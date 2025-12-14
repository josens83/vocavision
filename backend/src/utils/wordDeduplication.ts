/**
 * Word Deduplication Utility
 *
 * CSAT 단어와의 중복을 체크하여 콘텐츠 재사용
 * 예상 절감: ~44% (TOEFL 5,000개 중 ~2,000개 중복)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Type alias for exam categories (since Prisma client may not be generated)
type ExamCategory = 'CSAT' | 'TOEFL' | 'TOEIC' | 'TEPS' | 'SAT';

export interface DeduplicationResult {
  word: string;
  existingWordId: string | null;
  existingExam: string | null;
  existingLevel: string | null;
  isNew: boolean;
}

export interface DeduplicationStats {
  sourceCount: number;
  targetCount: number;
  overlapCount: number;
  overlapPercentage: number;
  newWordsNeeded: number;
  estimatedCost: number;
  estimatedSavings: number;
}

// 단어당 콘텐츠 생성 비용 (USD)
const COST_PER_WORD = 0.03;

/**
 * 단어 목록에서 중복 체크
 */
export async function checkDuplicates(
  words: string[],
  targetExam: string
): Promise<DeduplicationResult[]> {
  const results: DeduplicationResult[] = [];

  // 소문자로 정규화
  const normalizedWords = words.map((w) => w.toLowerCase().trim());

  // 기존 단어들 조회 (모든 시험)
  const existingWords = await prisma.word.findMany({
    where: {
      word: {
        in: normalizedWords,
        mode: 'insensitive',
      },
    },
    select: {
      id: true,
      word: true,
      examCategory: true,
      level: true,
    },
  });

  // 맵으로 변환 (소문자 키)
  type ExistingWord = {
    id: string;
    word: string;
    examCategory: string | null;
    level: string | null;
  };
  const existingMap = new Map<string, ExistingWord>(
    existingWords.map((w) => [w.word.toLowerCase(), w as ExistingWord])
  );

  for (const word of words) {
    const lowerWord = word.toLowerCase().trim();
    const existing = existingMap.get(lowerWord);

    results.push({
      word,
      existingWordId: existing?.id || null,
      existingExam: existing?.examCategory || null,
      existingLevel: existing?.level || null,
      isNew: !existing,
    });
  }

  return results;
}

/**
 * 두 시험 간 중복 통계 조회
 */
export async function getDeduplicationStats(
  sourceExam: string,
  targetExam: string
): Promise<DeduplicationStats> {
  // 소스 시험 단어
  const sourceWords = await prisma.word.findMany({
    where: { examCategory: sourceExam as ExamCategory },
    select: { word: true },
  });
  const sourceSet = new Set(sourceWords.map((w) => w.word.toLowerCase()));

  // 타겟 시험 단어 (이미 등록된 것 또는 목표)
  const targetWords = await prisma.word.findMany({
    where: { examCategory: targetExam as ExamCategory },
    select: { word: true },
  });
  const targetSet = new Set(targetWords.map((w) => w.word.toLowerCase()));

  // 겹치는 단어
  const overlap = [...targetSet].filter((w) => sourceSet.has(w));

  const overlapCount = overlap.length;
  const newWordsNeeded = targetSet.size - overlapCount;

  return {
    sourceCount: sourceSet.size,
    targetCount: targetSet.size,
    overlapCount,
    overlapPercentage:
      targetSet.size > 0
        ? Math.round((overlapCount / targetSet.size) * 100)
        : 0,
    newWordsNeeded,
    estimatedCost: Number((newWordsNeeded * COST_PER_WORD).toFixed(2)),
    estimatedSavings: Number((overlapCount * COST_PER_WORD).toFixed(2)),
  };
}

/**
 * 모든 시험 간 중복 통계 일괄 조회
 */
export async function getAllDeduplicationStats(
  sourceExam: string = 'CSAT'
): Promise<Record<string, DeduplicationStats>> {
  const targetExams = ['TOEFL', 'TOEIC', 'TEPS', 'SAT'];
  const results: Record<string, DeduplicationStats> = {};

  for (const targetExam of targetExams) {
    if (targetExam !== sourceExam) {
      results[targetExam] = await getDeduplicationStats(sourceExam, targetExam);
    }
  }

  return results;
}

/**
 * 중복 단어의 콘텐츠 복사
 */
export async function copyWordContent(
  sourceWordId: string,
  targetExam: ExamCategory,
  targetLevel: string
): Promise<{ success: boolean; newWordId?: string; error?: string }> {
  try {
    // 소스 단어와 관련 콘텐츠 조회
    const sourceWord = await prisma.word.findUnique({
      where: { id: sourceWordId },
      include: {
        etymology: true,
        mnemonics: true,
        examples: true,
        collocations: true,
        visuals: true,
        synonyms: true,
        antonyms: true,
      },
    });

    if (!sourceWord) {
      return { success: false, error: 'Source word not found' };
    }

    // 이미 타겟 시험에 존재하는지 확인
    const existingTarget = await prisma.word.findFirst({
      where: {
        word: { equals: sourceWord.word, mode: 'insensitive' },
        examCategory: targetExam,
      },
    });

    if (existingTarget) {
      return { success: false, error: 'Word already exists in target exam' };
    }

    // 새 단어 생성 (콘텐츠 복사)
    const newWord = await prisma.word.create({
      data: {
        word: sourceWord.word,
        definition: sourceWord.definition,
        definitionKo: sourceWord.definitionKo,
        pronunciation: sourceWord.pronunciation,
        phonetic: sourceWord.phonetic,
        partOfSpeech: sourceWord.partOfSpeech,
        difficulty: sourceWord.difficulty,
        cefrLevel: sourceWord.cefrLevel,
        examCategory: targetExam,
        level: targetLevel,
        frequency: sourceWord.frequency,
        tags: sourceWord.tags,
        tips: sourceWord.tips,
        commonMistakes: sourceWord.commonMistakes,
        ipaUs: sourceWord.ipaUs,
        ipaUk: sourceWord.ipaUk,
        audioUrlUs: sourceWord.audioUrlUs,
        audioUrlUk: sourceWord.audioUrlUk,
        prefix: sourceWord.prefix,
        root: sourceWord.root,
        suffix: sourceWord.suffix,
        morphologyNote: sourceWord.morphologyNote,
        synonymList: sourceWord.synonymList,
        antonymList: sourceWord.antonymList,
        rhymingWords: sourceWord.rhymingWords,
        relatedWords: sourceWord.relatedWords,
        status: 'PUBLISHED',

        // 어원 복사
        ...(sourceWord.etymology && {
          etymology: {
            create: {
              origin: sourceWord.etymology.origin,
              language: sourceWord.etymology.language,
              rootWords: sourceWord.etymology.rootWords,
              evolution: sourceWord.etymology.evolution,
              relatedWords: sourceWord.etymology.relatedWords,
              breakdown: sourceWord.etymology.breakdown,
            },
          },
        }),

        // 연상법 복사
        mnemonics: {
          create: sourceWord.mnemonics.map((m) => ({
            title: m.title,
            content: m.content,
            koreanHint: m.koreanHint,
            imageUrl: m.imageUrl,
            source: m.source,
            whiskPrompt: m.whiskPrompt,
            whiskStyle: m.whiskStyle,
            gifUrl: m.gifUrl,
          })),
        },

        // 예문 복사
        examples: {
          create: sourceWord.examples.map((e) => ({
            sentence: e.sentence,
            translation: e.translation,
            audioUrl: e.audioUrl,
            isFunny: e.isFunny,
            isReal: e.isReal,
            source: e.source,
            highlightWord: e.highlightWord,
            grammarNote: e.grammarNote,
            order: e.order,
          })),
        },

        // 콜로케이션 복사
        collocations: {
          create: sourceWord.collocations.map((c) => ({
            phrase: c.phrase,
            translation: c.translation,
            exampleEn: c.exampleEn,
            exampleKo: c.exampleKo,
            type: c.type,
            frequency: c.frequency,
            order: c.order,
          })),
        },

        // 시각화 복사
        visuals: {
          create: sourceWord.visuals.map((v) => ({
            type: v.type,
            labelEn: v.labelEn,
            labelKo: v.labelKo,
            captionEn: v.captionEn,
            captionKo: v.captionKo,
            imageUrl: v.imageUrl,
            promptEn: v.promptEn,
            order: v.order,
          })),
        },

        // 동의어 복사
        synonyms: {
          create: sourceWord.synonyms.map((s) => ({
            synonym: s.synonym,
            nuance: s.nuance,
          })),
        },

        // 반의어 복사
        antonyms: {
          create: sourceWord.antonyms.map((a) => ({
            antonym: a.antonym,
            explanation: a.explanation,
          })),
        },
      },
    });

    return { success: true, newWordId: newWord.id };
  } catch (error: any) {
    console.error('Copy word content error:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

export { COST_PER_WORD };
