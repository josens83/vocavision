/**
 * Pronunciation Generator Service
 * AI를 사용하여 한국어 발음 (음절 구분 + 강세) 생성
 */

import Anthropic from '@anthropic-ai/sdk';
import prisma from '../lib/prisma';

const anthropic = new Anthropic();

interface WordInput {
  id: string;
  word: string;
  ipaUs: string | null;
  ipaUk: string | null;
  pronunciation: string | null;
}

interface PronunciationResult {
  word: string;
  pronunciation: string;
}

interface RegenerationStats {
  total: number;
  updated: number;
  skipped: number;
  alreadyConverted: number;
  errors: string[];
  examples: Array<{ word: string; before: string | null; after: string }>;
  offset: number;
  nextOffset: number | null;
  remaining: number;
}

/**
 * Claude API를 사용하여 배치 발음 생성
 */
async function generatePronunciationsBatch(
  words: Array<{ word: string; ipa: string }>
): Promise<PronunciationResult[]> {
  const wordList = words.map((w) => `- ${w.word} ${w.ipa || ''}`).join('\n');

  const prompt = `다음 영어 단어들의 한국어 발음을 생성해주세요.

## 규칙
1. 영어 음절 단위로 하이픈(-)으로 구분
2. 강세가 있는 음절을 "(강세: XX)" 형식으로 표시
3. IPA 발음기호의 ˈ 위치가 강세 위치임
4. 한글 발음은 실제 영어 발음에 최대한 가깝게

## 형식
한국어발음 (강세: 강세음절)

## 예시
- identity /aɪˈdentɪti/: 아이-덴-터-티 (강세: 덴)
- capricious /kəˈprɪʃəs/: 커-프리-셔스 (강세: 프리)
- comprehensive /ˌkɒmprɪˈhensɪv/: 컴-프리-헨-시브 (강세: 헨)
- perceive /pərˈsiːv/: 퍼-시브 (강세: 시브)
- chastise /tʃæˈstaɪz/: 채스-타이즈 (강세: 타이즈)
- abandon /əˈbændən/: 어-밴-던 (강세: 밴)
- accelerate /əkˈseləreɪt/: 악-셀-러-레이트 (강세: 셀)

## 단어 목록
${wordList}

JSON 배열로만 응답해주세요 (다른 텍스트 없이):
[
  {"word": "단어", "pronunciation": "한국어발음 (강세: XX)"},
  ...
]`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  });

  // Extract text content
  const textContent = response.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  // Parse JSON from response
  const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.error('Claude response:', textContent.text);
    throw new Error('JSON array not found in response');
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (parseError) {
    console.error('JSON parse error:', parseError);
    console.error('Matched text:', jsonMatch[0]);
    throw new Error('Failed to parse pronunciation JSON');
  }
}

/**
 * 발음 일괄 재생성
 */
export async function regeneratePronunciations(
  dryRun: boolean = true,
  limit: number = 100,
  batchSize: number = 20,
  offset: number = 0
): Promise<{
  success: boolean;
  mode: string;
  stats: RegenerationStats;
  message: string;
}> {
  console.log(
    `[Pronunciation Regenerate] Mode: ${dryRun ? 'DRY RUN' : 'EXECUTE'}, Limit: ${limit}, Offset: ${offset}, BatchSize: ${batchSize}`
  );

  // Get total count first (for remaining calculation)
  const totalCount = await prisma.word.count({
    where: {
      OR: [{ ipaUs: { not: null } }, { ipaUk: { not: null } }],
    },
  });

  // Get words that need pronunciation with offset
  const words: WordInput[] = await prisma.word.findMany({
    skip: offset,
    take: limit,
    where: {
      OR: [{ ipaUs: { not: null } }, { ipaUk: { not: null } }],
    },
    select: {
      id: true,
      word: true,
      ipaUs: true,
      ipaUk: true,
      pronunciation: true,
    },
    orderBy: { word: 'asc' },
  });

  console.log(`[Pronunciation Regenerate] Found ${words.length} words (offset: ${offset}, total: ${totalCount})`);

  const nextOffset = offset + limit < totalCount ? offset + limit : null;
  const remaining = Math.max(0, totalCount - offset - words.length);

  const stats: RegenerationStats = {
    total: words.length,
    updated: 0,
    skipped: 0,
    alreadyConverted: 0,
    errors: [],
    examples: [],
    offset,
    nextOffset,
    remaining,
  };

  // Process in batches
  for (let i = 0; i < words.length; i += batchSize) {
    const rawBatch = words.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(words.length / batchSize);

    // Filter out already converted words (containing "(강세:")
    const alreadyConverted = rawBatch.filter((w) => w.pronunciation?.includes('(강세:'));
    const batch = rawBatch.filter((w) => !w.pronunciation?.includes('(강세:'));

    stats.alreadyConverted += alreadyConverted.length;

    if (batch.length === 0) {
      console.log(`[Pronunciation Regenerate] Batch ${batchNum}/${totalBatches}: All ${alreadyConverted.length} words already converted, skipping`);
      continue;
    }

    console.log(`[Pronunciation Regenerate] Processing batch ${batchNum}/${totalBatches} (${batch.length} words, ${alreadyConverted.length} already converted)`);

    try {
      const pronunciations = await generatePronunciationsBatch(
        batch.map((w) => ({
          word: w.word,
          ipa: w.ipaUs || w.ipaUk || '',
        }))
      );

      for (const pron of pronunciations) {
        const word = batch.find(
          (w) => w.word.toLowerCase() === pron.word.toLowerCase()
        );
        if (!word) {
          console.warn(`Word not found in batch: ${pron.word}`);
          continue;
        }

        // Collect examples (first 15)
        if (stats.examples.length < 15) {
          stats.examples.push({
            word: word.word,
            before: word.pronunciation,
            after: pron.pronunciation,
          });
        }

        if (!dryRun) {
          await prisma.word.update({
            where: { id: word.id },
            data: { pronunciation: pron.pronunciation },
          });
        }

        stats.updated++;
      }

      // Rate limiting - wait a bit between batches
      if (i + batchSize < words.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[Pronunciation Regenerate] Batch ${batchNum} error:`, errorMsg);
      stats.errors.push(`Batch ${batchNum}: ${errorMsg}`);

      // Skip this batch's words
      stats.skipped += batch.length;
    }
  }

  console.log(
    `[Pronunciation Regenerate] Complete: ${stats.updated} updated, ${stats.skipped} skipped, ${stats.errors.length} errors`
  );

  return {
    success: true,
    mode: dryRun ? 'dry_run' : 'executed',
    stats,
    message: dryRun
      ? `테스트 모드: ${stats.updated}개 변환 예정 (DB 미변경)`
      : `완료: ${stats.updated}개 업데이트됨`,
  };
}
