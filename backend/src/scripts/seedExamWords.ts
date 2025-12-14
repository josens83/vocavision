/**
 * Exam Words Seed Script
 *
 * TOEFL/TOEIC/TEPS 단어를 시드할 때 CSAT와 중복 체크하여 콘텐츠 재사용
 *
 * 사용법:
 *   npx ts-node src/scripts/seedExamWords.ts
 */

import { PrismaClient } from '@prisma/client';
import { checkDuplicates, copyWordContent } from '../utils/wordDeduplication';

// Type aliases (since Prisma client may not be generated)
type ExamCategory = 'CSAT' | 'TOEFL' | 'TOEIC' | 'TEPS' | 'SAT';
const ContentStatus = {
  DRAFT: 'DRAFT',
  REVIEW: 'REVIEW',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const;

const prisma = new PrismaClient();

interface WordEntry {
  word: string;
  level: string; // L1, L2, L3
}

interface SeedOptions {
  exam: ExamCategory;
  wordList: WordEntry[];
  reuseContent: boolean;
  dryRun?: boolean;
}

interface SeedResult {
  exam: string;
  total: number;
  duplicatesCopied: number;
  newCreated: number;
  errors: number;
  details: {
    word: string;
    status: 'copied' | 'created' | 'skipped' | 'error';
    message?: string;
  }[];
}

/**
 * 시험별 단어 시드
 */
async function seedExamWords(options: SeedOptions): Promise<SeedResult> {
  const { exam, wordList, reuseContent, dryRun = false } = options;

  console.log(`\n📚 ${exam} 단어 시드 시작...`);
  console.log(`총 ${wordList.length}개 단어`);
  if (dryRun) console.log('⚠️ DRY RUN 모드 - 실제 변경 없음');

  const result: SeedResult = {
    exam,
    total: wordList.length,
    duplicatesCopied: 0,
    newCreated: 0,
    errors: 0,
    details: [],
  };

  // 1. 중복 체크
  const words = wordList.map((w) => w.word);
  const duplicateResults = await checkDuplicates(words, exam);

  const newWords = duplicateResults.filter((r) => r.isNew);
  const existingWords = duplicateResults.filter((r) => !r.isNew);

  console.log(`\n📊 분석 결과:`);
  console.log(`   ✅ 신규 단어: ${newWords.length}개`);
  console.log(`   ♻️ 중복 단어: ${existingWords.length}개 (재사용 가능)`);

  // 2. 중복 단어 처리 (콘텐츠 재사용)
  if (reuseContent && existingWords.length > 0) {
    console.log('\n♻️ 중복 단어 콘텐츠 복사 중...');

    for (const dupResult of existingWords) {
      if (!dupResult.existingWordId) continue;

      const wordData = wordList.find(
        (w) => w.word.toLowerCase() === dupResult.word.toLowerCase()
      );
      const targetLevel = wordData?.level || 'L1';

      if (dryRun) {
        console.log(`  [DRY] ${dupResult.word} (${dupResult.existingExam} → ${exam})`);
        result.details.push({
          word: dupResult.word,
          status: 'copied',
          message: `Would copy from ${dupResult.existingExam}`,
        });
        result.duplicatesCopied++;
        continue;
      }

      const copyResult = await copyWordContent(
        dupResult.existingWordId,
        exam,
        targetLevel
      );

      if (copyResult.success) {
        console.log(`  ✓ ${dupResult.word} (${dupResult.existingExam} → ${exam})`);
        result.details.push({
          word: dupResult.word,
          status: 'copied',
          message: `Copied from ${dupResult.existingExam}`,
        });
        result.duplicatesCopied++;
      } else if (copyResult.error?.includes('already exists')) {
        console.log(`  - ${dupResult.word} (이미 존재)`);
        result.details.push({
          word: dupResult.word,
          status: 'skipped',
          message: 'Already exists in target exam',
        });
      } else {
        console.log(`  ✗ ${dupResult.word}: ${copyResult.error}`);
        result.details.push({
          word: dupResult.word,
          status: 'error',
          message: copyResult.error,
        });
        result.errors++;
      }
    }
  }

  // 3. 신규 단어 생성 (콘텐츠 없이 - DRAFT 상태)
  console.log('\n🆕 신규 단어 생성 중...');

  for (const newResult of newWords) {
    const wordData = wordList.find(
      (w) => w.word.toLowerCase() === newResult.word.toLowerCase()
    );
    const targetLevel = wordData?.level || 'L1';

    if (dryRun) {
      console.log(`  [DRY] ${newResult.word} (신규 - DRAFT)`);
      result.details.push({
        word: newResult.word,
        status: 'created',
        message: 'Would create as DRAFT',
      });
      result.newCreated++;
      continue;
    }

    try {
      // 이미 존재하는지 확인
      const existing = await prisma.word.findFirst({
        where: {
          word: { equals: newResult.word, mode: 'insensitive' },
          examCategory: exam,
        },
      });

      if (existing) {
        console.log(`  - ${newResult.word} (이미 존재)`);
        result.details.push({
          word: newResult.word,
          status: 'skipped',
          message: 'Already exists',
        });
        continue;
      }

      await prisma.word.create({
        data: {
          word: newResult.word,
          definition: '', // 콘텐츠 생성 필요
          partOfSpeech: 'NOUN', // 기본값
          examCategory: exam,
          level: targetLevel,
          status: ContentStatus.DRAFT, // 콘텐츠 생성 대기
        },
      });

      console.log(`  ✓ ${newResult.word} (신규 - 콘텐츠 생성 필요)`);
      result.details.push({
        word: newResult.word,
        status: 'created',
        message: 'Created as DRAFT - needs content',
      });
      result.newCreated++;
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log(`  - ${newResult.word} (이미 존재)`);
        result.details.push({
          word: newResult.word,
          status: 'skipped',
          message: 'Already exists (unique constraint)',
        });
      } else {
        console.error(`  ✗ ${newResult.word}:`, error.message);
        result.details.push({
          word: newResult.word,
          status: 'error',
          message: error.message,
        });
        result.errors++;
      }
    }
  }

  console.log(`\n✅ ${exam} 시드 완료!`);
  console.log(`   - 중복 복사: ${result.duplicatesCopied}개`);
  console.log(`   - 신규 생성: ${result.newCreated}개 (콘텐츠 생성 대기)`);
  console.log(`   - 오류: ${result.errors}개`);

  return result;
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('🚀 VocaVision 시험별 단어 시드 시작\n');
  console.log('=' .repeat(50));

  // 예시 단어 목록 (실제로는 CSV/JSON 파일에서 로드)
  const toeflWords: WordEntry[] = [
    { word: 'abundant', level: 'L1' },
    { word: 'accelerate', level: 'L2' },
    { word: 'accommodate', level: 'L2' },
    { word: 'accumulate', level: 'L1' },
    { word: 'acquire', level: 'L1' },
    { word: 'adjacent', level: 'L2' },
    { word: 'advocate', level: 'L2' },
    { word: 'aesthetic', level: 'L3' },
    { word: 'aggregate', level: 'L3' },
    { word: 'allocate', level: 'L2' },
  ];

  const toeicWords: WordEntry[] = [
    { word: 'accomplish', level: 'L1' },
    { word: 'accountant', level: 'L1' },
    { word: 'acknowledge', level: 'L2' },
    { word: 'acquisition', level: 'L2' },
    { word: 'adequate', level: 'L1' },
    { word: 'agenda', level: 'L1' },
    { word: 'amendment', level: 'L2' },
    { word: 'anticipate', level: 'L2' },
    { word: 'applicant', level: 'L1' },
    { word: 'appraisal', level: 'L3' },
  ];

  const tepsWords: WordEntry[] = [
    { word: 'adversary', level: 'L2' },
    { word: 'affluent', level: 'L2' },
    { word: 'allegation', level: 'L3' },
    { word: 'alleviate', level: 'L2' },
    { word: 'ambiguous', level: 'L2' },
    { word: 'amenable', level: 'L3' },
    { word: 'analogous', level: 'L3' },
    { word: 'anomaly', level: 'L3' },
    { word: 'apprehend', level: 'L3' },
    { word: 'articulate', level: 'L2' },
  ];

  const results: SeedResult[] = [];

  // TOEFL 시드
  results.push(
    await seedExamWords({
      exam: 'TOEFL',
      wordList: toeflWords,
      reuseContent: true,
      dryRun: true, // 테스트용 - 실제 실행 시 false로 변경
    })
  );

  // TOEIC 시드
  results.push(
    await seedExamWords({
      exam: 'TOEIC',
      wordList: toeicWords,
      reuseContent: true,
      dryRun: true,
    })
  );

  // TEPS 시드
  results.push(
    await seedExamWords({
      exam: 'TEPS',
      wordList: tepsWords,
      reuseContent: true,
      dryRun: true,
    })
  );

  // 최종 요약
  console.log('\n' + '='.repeat(50));
  console.log('📊 최종 요약\n');

  let totalCopied = 0;
  let totalCreated = 0;
  let totalErrors = 0;

  for (const result of results) {
    console.log(`${result.exam}:`);
    console.log(`  - 복사: ${result.duplicatesCopied}개`);
    console.log(`  - 신규: ${result.newCreated}개`);
    console.log(`  - 오류: ${result.errors}개`);
    totalCopied += result.duplicatesCopied;
    totalCreated += result.newCreated;
    totalErrors += result.errors;
  }

  console.log(`\n총계:`);
  console.log(`  - 복사 (재사용): ${totalCopied}개`);
  console.log(`  - 신규 (생성 필요): ${totalCreated}개`);
  console.log(`  - 오류: ${totalErrors}개`);
  console.log(`\n예상 절감: $${(totalCopied * 0.03).toFixed(2)}`);

  await prisma.$disconnect();
}

// 실행
main().catch((error) => {
  console.error('Seed error:', error);
  prisma.$disconnect();
  process.exit(1);
});

export { seedExamWords, SeedOptions, SeedResult };
