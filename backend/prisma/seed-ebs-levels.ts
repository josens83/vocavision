/**
 * EBS 교재별 레벨 매핑 스크립트
 *
 * 3개 텍스트 파일에서 단어를 파싱하여 WordExamLevel에 교재별 레벨 매핑:
 * - level 'LISTENING'      ← 수능특강 영어듣기
 * - level 'READING_BASIC'  ← 수능특강 영어
 * - level 'READING_ADV'    ← 수능특강 영어독해연습
 *
 * 사용법: npx tsx prisma/seed-ebs-levels.ts
 */

import { PrismaClient, ExamCategory } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// 파일 → 레벨 매핑
const FILE_LEVEL_MAP: { file: string; level: string; label: string }[] = [
  {
    file: 'EBS_2026_수능특강_영어듣기_영단어_숙어.txt',
    level: 'LISTENING',
    label: '듣기영역',
  },
  {
    file: 'EBS_2026_수능특강_영단어_숙어.txt',
    level: 'READING_BASIC',
    label: '독해영역 기본',
  },
  {
    file: 'EBS_2026_수능특강_영어독해연습_영단어_숙어.txt',
    level: 'READING_ADV',
    label: '독해영역 실력',
  },
];

/**
 * 텍스트 파일에서 ≅ 접두사 항목의 영어 단어/숙어 추출
 */
function parseWordsFromFile(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const words: Set<string> = new Set();

  for (const line of lines) {
    const trimmed = line.trim();
    // ≅ 접두사로 시작하는 항목만 처리
    if (!trimmed.startsWith('≅')) continue;

    // ≅ 제거 후 영어 부분 추출 (첫 번째 한글/한자 문자 이전까지)
    const entry = trimmed.substring(1).trim();

    // 영어 부분과 한국어 뜻 분리
    // 패턴: 영어단어(또는 숙어) + 공백 + 한국어뜻
    const match = entry.match(/^([a-zA-Z][a-zA-Z\s\-'.,;:~()\/]+?)(?:\s+[가-힣\(]|\s*$)/);
    if (match) {
      let word = match[1].trim();
      // 끝에 있는 구두점 제거
      word = word.replace(/[,;:]+$/, '').trim();
      if (word.length > 0) {
        words.add(word.toLowerCase());
      }
    }
  }

  return Array.from(words);
}

async function main() {
  console.log('=== EBS 교재별 레벨 매핑 시작 ===\n');

  const examCategory: ExamCategory = 'EBS';

  // 기존 EBS WordExamLevel 레코드 조회
  const existingMappings = await prisma.wordExamLevel.findMany({
    where: { examCategory },
    select: { id: true, wordId: true, level: true },
  });
  console.log(`기존 EBS WordExamLevel 레코드: ${existingMappings.length}개\n`);

  // 기존 EBS 단어 전체 조회 (word text → id 매핑)
  const ebsWords = await prisma.word.findMany({
    where: { examCategory },
    select: { id: true, word: true },
  });
  const wordTextToId = new Map<string, string>();
  for (const w of ebsWords) {
    wordTextToId.set(w.word.toLowerCase(), w.id);
  }
  console.log(`DB EBS 단어 수: ${ebsWords.length}개\n`);

  const stats = {
    totalParsed: 0,
    matched: 0,
    notFound: 0,
    created: 0,
    skipped: 0,
  };

  for (const { file, level, label } of FILE_LEVEL_MAP) {
    // backend/data/ 디렉토리에서 텍스트 파일 읽기
    const filePath = path.resolve(__dirname, '..', 'data', file);

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  파일 없음: ${file} — 건너뜀`);
      continue;
    }

    console.log(`📖 ${label} (${file}) 처리 중...`);
    const parsedWords = parseWordsFromFile(filePath);
    console.log(`   파싱된 고유 단어: ${parsedWords.length}개`);
    stats.totalParsed += parsedWords.length;

    // DB 매칭 및 WordExamLevel 생성
    const mappingsToCreate: { wordId: string; examCategory: ExamCategory; level: string }[] = [];
    let matchCount = 0;
    let notFoundCount = 0;

    for (const word of parsedWords) {
      const wordId = wordTextToId.get(word);
      if (wordId) {
        matchCount++;
        mappingsToCreate.push({
          wordId,
          examCategory,
          level,
        });
      } else {
        notFoundCount++;
      }
    }

    console.log(`   DB 매칭: ${matchCount}개, 미매칭: ${notFoundCount}개`);
    stats.matched += matchCount;
    stats.notFound += notFoundCount;

    // 배치 삽입 (skipDuplicates로 중복 방지)
    if (mappingsToCreate.length > 0) {
      const batchSize = 500;
      let created = 0;
      for (let i = 0; i < mappingsToCreate.length; i += batchSize) {
        const batch = mappingsToCreate.slice(i, i + batchSize);
        const result = await prisma.wordExamLevel.createMany({
          data: batch,
          skipDuplicates: true,
        });
        created += result.count;
      }
      console.log(`   생성된 WordExamLevel: ${created}개`);
      stats.created += created;
    }

    console.log('');
  }

  // 기존 level=null 또는 level='1' 레코드 정리 (교재별 매핑으로 대체)
  // 새 레벨 매핑이 있는 단어의 기존 null/1 레코드 삭제
  const newMappingWordIds = await prisma.wordExamLevel.findMany({
    where: {
      examCategory,
      level: { in: ['LISTENING', 'READING_BASIC', 'READING_ADV'] },
    },
    select: { wordId: true },
    distinct: ['wordId'],
  });
  const mappedWordIds = newMappingWordIds.map(m => m.wordId);

  if (mappedWordIds.length > 0) {
    const deleted = await prisma.wordExamLevel.deleteMany({
      where: {
        examCategory,
        wordId: { in: mappedWordIds },
        level: { notIn: ['LISTENING', 'READING_BASIC', 'READING_ADV'] },
      },
    });
    console.log(`🧹 기존 단일 레벨 레코드 정리: ${deleted.count}개 삭제`);
  }

  console.log('\n=== 완료 ===');
  console.log(`총 파싱: ${stats.totalParsed}개`);
  console.log(`DB 매칭: ${stats.matched}개`);
  console.log(`미매칭: ${stats.notFound}개`);
  console.log(`생성: ${stats.created}개`);
}

main()
  .catch((e) => {
    console.error('오류:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
