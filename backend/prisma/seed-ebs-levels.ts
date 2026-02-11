/**
 * EBS 교재별 레벨 매핑 스크립트
 *
 * 기존 level=null인 EBS WordExamLevel 레코드를 교재별 레벨로 UPDATE:
 * - level 'LISTENING'      ← 수능특강 영어듣기
 * - level 'READING_BASIC'  ← 수능특강 영어
 * - level 'READING_ADV'    ← 수능특강 영어독해연습
 *
 * 로직:
 * 1. 모든 텍스트 파일 파싱 → wordId → Set<level> 매핑
 * 2. 기존 null 레코드를 첫 번째 레벨로 UPDATE
 * 3. 추가 레벨은 새 레코드 CREATE
 *
 * 사용법: npx tsx prisma/seed-ebs-levels.ts
 */

import { PrismaClient, ExamCategory } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

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

function parseWordsFromFile(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const words: Set<string> = new Set();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('≅')) continue;

    const entry = trimmed.substring(1).trim();
    const match = entry.match(/^([a-zA-Z][a-zA-Z\s\-'.,;:~()\/]+?)(?:\s+[가-힣\(]|\s*$)/);
    if (match) {
      let word = match[1].trim();
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

  // 1. 기존 EBS 단어 전체 조회 (word text → id 매핑)
  const ebsWords = await prisma.word.findMany({
    where: { examCategory },
    select: { id: true, word: true },
  });
  const wordTextToId = new Map<string, string>();
  for (const w of ebsWords) {
    wordTextToId.set(w.word.toLowerCase(), w.id);
  }
  console.log(`DB EBS 단어 수: ${ebsWords.length}개\n`);

  // 2. 모든 텍스트 파일 파싱 → wordId → Set<level> 매핑 구축
  const wordIdToLevels = new Map<string, Set<string>>();
  const stats = {
    totalParsed: 0,
    matched: 0,
    notFound: 0,
    updated: 0,
    created: 0,
  };

  for (const { file, level, label } of FILE_LEVEL_MAP) {
    const filePath = path.resolve(__dirname, '..', 'data', file);

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  파일 없음: ${file} — 건너뜀`);
      continue;
    }

    console.log(`📖 ${label} (${file}) 처리 중...`);
    const parsedWords = parseWordsFromFile(filePath);
    console.log(`   파싱된 고유 단어: ${parsedWords.length}개`);
    stats.totalParsed += parsedWords.length;

    let matchCount = 0;
    let notFoundCount = 0;

    for (const word of parsedWords) {
      const wordId = wordTextToId.get(word);
      if (wordId) {
        matchCount++;
        if (!wordIdToLevels.has(wordId)) wordIdToLevels.set(wordId, new Set());
        wordIdToLevels.get(wordId)!.add(level);
      } else {
        notFoundCount++;
      }
    }

    console.log(`   DB 매칭: ${matchCount}개, 미매칭: ${notFoundCount}개\n`);
    stats.matched += matchCount;
    stats.notFound += notFoundCount;
  }

  // 3. 기존 level=null 레코드 조회 → wordId → recordId 매핑
  const nullRecords = await prisma.wordExamLevel.findMany({
    where: { examCategory, level: null },
    select: { id: true, wordId: true },
  });
  const wordIdToNullRecordId = new Map<string, string>();
  for (const r of nullRecords) {
    wordIdToNullRecordId.set(r.wordId, r.id);
  }
  console.log(`기존 level=null 레코드: ${nullRecords.length}개\n`);

  // 4. UPDATE + CREATE 실행
  const toCreate: { wordId: string; examCategory: ExamCategory; level: string }[] = [];

  for (const [wordId, levels] of wordIdToLevels) {
    const levelArray = Array.from(levels);
    const nullRecordId = wordIdToNullRecordId.get(wordId);

    if (nullRecordId) {
      // 기존 null 레코드를 첫 번째 레벨로 UPDATE
      await prisma.wordExamLevel.update({
        where: { id: nullRecordId },
        data: { level: levelArray[0] },
      });
      stats.updated++;
      // 나머지 레벨은 CREATE
      for (let i = 1; i < levelArray.length; i++) {
        toCreate.push({ wordId, examCategory, level: levelArray[i] });
      }
    } else {
      // null 레코드 없음 → 모두 CREATE
      for (const level of levelArray) {
        toCreate.push({ wordId, examCategory, level });
      }
    }
  }
  console.log(`UPDATE: ${stats.updated}개 (null → 레벨)`);

  // 배치 CREATE
  if (toCreate.length > 0) {
    const batchSize = 500;
    for (let i = 0; i < toCreate.length; i += batchSize) {
      const batch = toCreate.slice(i, i + batchSize);
      const result = await prisma.wordExamLevel.createMany({
        data: batch,
        skipDuplicates: true,
      });
      stats.created += result.count;
    }
  }
  console.log(`CREATE: ${stats.created}개 (추가 레벨)`);

  // 5. 남은 null 레코드 확인
  const remainingNull = await prisma.wordExamLevel.count({
    where: { examCategory, level: null },
  });
  console.log(`남은 level=null 레코드: ${remainingNull}개`);

  // 최종 레벨별 카운트
  const levelCounts = await prisma.wordExamLevel.groupBy({
    by: ['level'],
    where: { examCategory },
    _count: { id: true },
  });
  console.log(`\n📊 최종 레벨별 분포:`);
  for (const lc of levelCounts) {
    console.log(`   ${lc.level || 'null'}: ${lc._count.id}개`);
  }

  console.log('\n=== 완료 ===');
  console.log(`총 파싱: ${stats.totalParsed}개`);
  console.log(`DB 매칭: ${stats.matched}개`);
  console.log(`미매칭: ${stats.notFound}개`);
  console.log(`UPDATE: ${stats.updated}개`);
  console.log(`CREATE: ${stats.created}개`);
}

main()
  .catch((e) => {
    console.error('오류:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
