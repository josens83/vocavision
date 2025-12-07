/**
 * 한국어 발음 강세 일괄 변환 스크립트
 *
 * 변환 예시:
 *   perceive: 퍼시브 → 퍼-시브 (강세: 시브)
 *   comprehensive: 컴프리헨시브 → 컴-프리-헨-시브 (강세: 헨)
 *   chastise: 챠스타이즈 → 챠스-타이즈 (강세: 타이즈)
 *
 * 사용법:
 *   cd backend
 *   npx tsx src/scripts/convertPronunciationFormat.ts
 *
 * 테스트 모드 (10개만):
 *   DRY_RUN=true npx tsx src/scripts/convertPronunciationFormat.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 한글 유니코드 범위
const HANGUL_START = 0xAC00;
const HANGUL_END = 0xD7A3;

// 한글 글자인지 확인
function isHangul(char: string): boolean {
  const code = char.charCodeAt(0);
  return code >= HANGUL_START && code <= HANGUL_END;
}

// 한국어 발음에서 음절 분리
function splitKoreanSyllables(korean: string): string[] {
  const syllables: string[] = [];
  let current = '';

  for (const char of korean) {
    if (isHangul(char)) {
      syllables.push(char);
    } else if (char === ' ' || char === '-') {
      // 공백이나 하이픈은 무시 (이미 분리된 경우)
      continue;
    } else {
      // 비한글 문자는 그대로 유지 (숫자, 기호 등)
      current += char;
    }
  }

  return syllables;
}

// IPA에서 주 강세 위치 찾기
// ˈ 기호가 다음 음절의 강세를 나타냄
function findStressPosition(ipa: string, totalSyllables: number): number {
  if (!ipa || totalSyllables <= 1) return 0;

  // ˈ (주 강세) 위치 찾기
  const primaryStressIndex = ipa.indexOf('ˈ');
  if (primaryStressIndex === -1) {
    // 강세 표시가 없으면 첫 음절
    return 0;
  }

  // IPA에서 ˈ 앞의 음절 수를 세기 (모음 기반)
  const beforeStress = ipa.substring(0, primaryStressIndex);

  // 영어 IPA 모음 패턴
  const vowelPattern = /[aeiouəɪʊɛɔæɑʌɒɜɐ]/gi;
  const diphthongPattern = /eɪ|aɪ|ɔɪ|aʊ|oʊ|ɪə|eə|ʊə/gi;

  // 이중모음을 먼저 제거하고 단모음 카운트
  const cleanedBefore = beforeStress.replace(diphthongPattern, 'V');
  const vowelsBefore = (cleanedBefore.match(vowelPattern) || []).length;

  // 강세 음절 인덱스 (0-based)
  const stressIndex = Math.min(vowelsBefore, totalSyllables - 1);

  return stressIndex;
}

// 한국어 발음 변환
function convertPronunciation(ipa: string, koreanPron: string): {
  converted: string;
  changed: boolean;
  stressSyllable: string;
} {
  if (!koreanPron) {
    return { converted: koreanPron, changed: false, stressSyllable: '' };
  }

  // 이미 변환된 경우 스킵
  if (koreanPron.includes('강세:')) {
    return { converted: koreanPron, changed: false, stressSyllable: '' };
  }

  // 이미 하이픈으로 분리된 경우 (강세 표시만 추가)
  if (koreanPron.includes('-')) {
    const syllables = koreanPron.split('-');
    const stressIndex = findStressPosition(ipa, syllables.length);
    const stressSyllable = syllables[stressIndex] || syllables[0];
    const result = `${koreanPron} (강세: ${stressSyllable})`;
    return { converted: result, changed: true, stressSyllable };
  }

  // 음절 분리
  const syllables = splitKoreanSyllables(koreanPron);

  if (syllables.length === 0) {
    return { converted: koreanPron, changed: false, stressSyllable: '' };
  }

  if (syllables.length === 1) {
    // 단음절은 그대로 + 강세 표시
    const result = `${syllables[0]} (강세: ${syllables[0]})`;
    return { converted: result, changed: true, stressSyllable: syllables[0] };
  }

  // 강세 위치 찾기
  const stressIndex = findStressPosition(ipa, syllables.length);
  const stressSyllable = syllables[stressIndex];

  // 하이픈으로 연결 + 강세 표시
  const hyphenated = syllables.join('-');
  const result = `${hyphenated} (강세: ${stressSyllable})`;

  return { converted: result, changed: true, stressSyllable };
}

async function main() {
  const isDryRun = process.env.DRY_RUN === 'true';
  const testLimit = isDryRun ? 10 : undefined;

  console.log('='.repeat(50));
  console.log('한국어 발음 강세 일괄 변환 스크립트');
  console.log('='.repeat(50));
  console.log(`모드: ${isDryRun ? '테스트 (10개만)' : '전체 변환'}`);
  console.log();

  // 모든 단어 가져오기
  const words = await prisma.word.findMany({
    ...(testLimit ? { take: testLimit } : {}),
    where: {
      pronunciation: { not: null }
    },
    select: {
      id: true,
      word: true,
      pronunciation: true,
      ipaUs: true,
      ipaUk: true,
    },
  });

  console.log(`총 ${words.length}개 단어 처리 예정`);
  console.log();

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  const examples: Array<{word: string, before: string, after: string}> = [];

  for (const wordData of words) {
    try {
      const ipa = wordData.ipaUs || wordData.ipaUk || '';
      const korean = wordData.pronunciation || '';

      const { converted, changed, stressSyllable } = convertPronunciation(ipa, korean);

      if (!changed) {
        skipped++;
        continue;
      }

      // 예시 수집 (처음 10개)
      if (examples.length < 10) {
        examples.push({
          word: wordData.word,
          before: korean,
          after: converted,
        });
      }

      if (!isDryRun) {
        await prisma.word.update({
          where: { id: wordData.id },
          data: { pronunciation: converted },
        });
      }

      updated++;

      // 진행 상황 출력
      if (updated % 100 === 0) {
        console.log(`진행: ${updated}개 업데이트됨...`);
      }
    } catch (error) {
      console.error(`오류 (${wordData.word}):`, error);
      errors++;
    }
  }

  // 결과 출력
  console.log();
  console.log('='.repeat(50));
  console.log('변환 결과');
  console.log('='.repeat(50));
  console.log();
  console.log(`업데이트: ${updated}개`);
  console.log(`스킵: ${skipped}개`);
  console.log(`오류: ${errors}개`);
  console.log();

  if (examples.length > 0) {
    console.log('변환 예시:');
    console.log('-'.repeat(50));
    for (const ex of examples) {
      console.log(`${ex.word}:`);
      console.log(`  전: ${ex.before}`);
      console.log(`  후: ${ex.after}`);
      console.log();
    }
  }

  if (isDryRun) {
    console.log('='.repeat(50));
    console.log('테스트 모드로 실행되었습니다. 실제 DB는 변경되지 않았습니다.');
    console.log('전체 변환을 하려면: npx tsx src/scripts/convertPronunciationFormat.ts');
    console.log('='.repeat(50));
  }
}

main()
  .catch((error) => {
    console.error('스크립트 실행 중 오류:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
