// ============================================
// VocaVision - AI Content Generation Service
// Claude API를 사용한 단어 콘텐츠 자동 생성
// ============================================

import Anthropic from '@anthropic-ai/sdk';
import { PrismaClient, ExamCategory, CEFRLevel } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

// Claude API Client
let anthropic: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropic) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropic;
}

// ---------------------------------------------
// 타입 정의
// ---------------------------------------------

export interface GenerationOptions {
  word: string;
  examCategory: ExamCategory;
  cefrLevel: CEFRLevel;
}

export interface GeneratedContent {
  pronunciation: {
    ipaUs: string;
    ipaUk: string;
    korean: string;
  };
  definitions: Array<{
    partOfSpeech: string;
    definitionEn: string;
    definitionKo: string;
    exampleEn?: string;
    exampleKo?: string;
  }>;
  etymology: {
    description: string;
    language: string;
    breakdown?: string;
  };
  morphology: {
    prefix?: { part: string; meaning: string };
    root?: { part: string; meaning: string };
    suffix?: { part: string; meaning: string };
    note?: string;
  };
  collocations: Array<{
    phrase: string;
    translation: string;
    type?: string;
    exampleEn?: string;
    exampleKo?: string;
  }>;
  rhyming: {
    words: string[];
    note?: string;
  };
  mnemonic: {
    description: string;
    koreanAssociation: string;
    imagePrompt: string;
  };
  examples: Array<{
    sentenceEn: string;
    sentenceKo: string;
    isFunny: boolean;
    source?: string;
  }>;
  relatedWords: {
    synonyms: string[];
    antonyms: string[];
    related: string[];
  };
}

// ---------------------------------------------
// 프롬프트 템플릿
// ---------------------------------------------

const CONTENT_GENERATION_PROMPT = `
당신은 영어 어휘 학습 콘텐츠 전문가입니다. 한국인 영어 학습자를 위한 고품질 단어 학습 자료를 생성합니다.

## 입력 정보
- 단어: {{WORD}}
- 시험 카테고리: {{EXAM_CATEGORY}}
- CEFR 레벨: {{CEFR_LEVEL}}

## 생성해야 할 콘텐츠

### 1. 발음 (Pronunciation)
- IPA 발음 기호 (미국식, 영국식)
- 한글 발음 표기

### 2. 정의 (Definitions)
- 품사별 영어 정의
- 한국어 번역
- 각 정의에 대한 예문

### 3. 어원 (Etymology)
- 단어의 기원과 역사
- 어원 언어 (라틴어, 그리스어, 프랑스어 등)
- 어원을 통한 의미 이해 설명

### 4. 형태 분석 (Morphology)
- 접두사 (prefix): 있다면 의미와 함께
- 어근 (root): 핵심 의미
- 접미사 (suffix): 있다면 품사 변화 설명

### 5. 콜로케이션 (Collocations)
- 자주 함께 쓰이는 단어 조합 5-7개
- 각 콜로케이션의 한국어 번역
- 유형 (verb+noun, adj+noun 등)

### 6. 라이밍 (Rhyming Words)
- 발음이 비슷한 단어 3-5개
- 라이밍을 활용한 암기 팁

### 7. 연상 기억법 (Mnemonic - 경선식 스타일)
- 발음과 의미를 연결하는 창의적 연상법
- 한글 발음을 활용한 기억 트릭
- 이미지화하기 좋은 스토리

### 8. 재미있는 예문 (Fun Examples)
- 기억에 남는 유머러스한 예문 2-3개
- 실제 사용 맥락이 담긴 예문 2-3개
- 한국어 번역 포함

### 9. 관련어
- 동의어 (synonyms) 3-5개
- 반의어 (antonyms) 2-3개
- 관련 단어 (related words) 3-5개

## 출력 형식
반드시 아래 JSON 형식으로 출력하세요:

\`\`\`json
{
  "pronunciation": {
    "ipaUs": "/발음기호/",
    "ipaUk": "/발음기호/",
    "korean": "한글발음"
  },
  "definitions": [
    {
      "partOfSpeech": "noun",
      "definitionEn": "English definition",
      "definitionKo": "한국어 정의",
      "exampleEn": "Example sentence.",
      "exampleKo": "예문 번역."
    }
  ],
  "etymology": {
    "description": "어원 설명",
    "language": "Latin",
    "breakdown": "어원 분석"
  },
  "morphology": {
    "prefix": { "part": "접두사", "meaning": "의미" },
    "root": { "part": "어근", "meaning": "의미" },
    "suffix": { "part": "접미사", "meaning": "의미" },
    "note": "형태 분석 설명"
  },
  "collocations": [
    {
      "phrase": "collocation phrase",
      "translation": "번역",
      "type": "verb+noun",
      "exampleEn": "Example",
      "exampleKo": "예문 번역"
    }
  ],
  "rhyming": {
    "words": ["word1", "word2", "word3"],
    "note": "라이밍 학습 팁"
  },
  "mnemonic": {
    "description": "연상 기억법 설명",
    "koreanAssociation": "한글 발음 연상",
    "imagePrompt": "WHISK 이미지 생성용 프롬프트 (영어)"
  },
  "examples": [
    {
      "sentenceEn": "Example sentence",
      "sentenceKo": "예문 번역",
      "isFunny": true,
      "source": "출처 (선택)"
    }
  ],
  "relatedWords": {
    "synonyms": ["동의어1", "동의어2"],
    "antonyms": ["반의어1", "반의어2"],
    "related": ["관련어1", "관련어2"]
  }
}
\`\`\`

## 주의사항
1. 한국인 학습자의 관점에서 이해하기 쉽게 설명
2. 시험 카테고리({{EXAM_CATEGORY}})에 맞는 난이도와 맥락 유지
3. 재미있고 기억에 남는 콘텐츠 생성
4. 정확한 JSON 형식 준수
5. 연상 기억법은 창의적이고 한국어 발음을 활용
`;

// ---------------------------------------------
// Content Generation Function
// ---------------------------------------------

export async function generateWordContent(
  options: GenerationOptions
): Promise<GeneratedContent> {
  const { word, examCategory, cefrLevel } = options;

  // 프롬프트 생성
  const prompt = CONTENT_GENERATION_PROMPT
    .replace(/\{\{WORD\}\}/g, word)
    .replace(/\{\{EXAM_CATEGORY\}\}/g, examCategory)
    .replace(/\{\{CEFR_LEVEL\}\}/g, cefrLevel);

  try {
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // 응답에서 JSON 추출
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // JSON 파싱
    const jsonMatch = content.text.match(/```json\n([\s\S]*?)\n```/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const generatedContent: GeneratedContent = JSON.parse(jsonMatch[1]);
    return generatedContent;
  } catch (error) {
    logger.error('Content generation failed:', error);
    throw error;
  }
}

// ---------------------------------------------
// Retry helper for PgBouncer connection errors
// ---------------------------------------------

async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 500
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      const errorMsg = error instanceof Error ? error.message : String(error);

      // Check if it's a PgBouncer prepared statement error
      if (errorMsg.includes('prepared statement') && errorMsg.includes('does not exist')) {
        logger.warn(`PgBouncer error on attempt ${attempt}/${maxRetries}, retrying in ${delayMs}ms...`);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
          delayMs *= 2; // Exponential backoff
          continue;
        }
      }
      throw error;
    }
  }

  throw lastError;
}

// ---------------------------------------------
// Save Generated Content to DB
// ---------------------------------------------

export async function saveGeneratedContent(
  wordId: string,
  generated: GeneratedContent
): Promise<void> {
  // Wrap entire save operation with retry logic for PgBouncer errors
  await withRetry(async () => {
    // First, clean up any existing related data to avoid duplicates on retry
    await prisma.example.deleteMany({ where: { wordId } });
    await prisma.collocation.deleteMany({ where: { wordId } });
    await prisma.synonym.deleteMany({ where: { wordId } });
    await prisma.antonym.deleteMany({ where: { wordId } });
    await prisma.rhyme.deleteMany({ where: { wordId } });
    await prisma.mnemonic.deleteMany({ where: { wordId } });

    // Get primary definition from generated content
    const primaryDef = generated.definitions?.[0];
    const posMapping: Record<string, string> = {
      'noun': 'NOUN',
      'verb': 'VERB',
      'adjective': 'ADJECTIVE',
      'adverb': 'ADVERB',
      'pronoun': 'PRONOUN',
      'preposition': 'PREPOSITION',
      'conjunction': 'CONJUNCTION',
      'interjection': 'INTERJECTION',
    };

    // Update Word with generated content
    await prisma.word.update({
      where: { id: wordId },
      data: {
        // Definition (from AI if empty)
        definition: primaryDef?.definitionEn || undefined,
        definitionKo: primaryDef?.definitionKo || undefined,
        partOfSpeech: primaryDef?.partOfSpeech
          ? (posMapping[primaryDef.partOfSpeech.toLowerCase()] as any) || undefined
          : undefined,

        // Pronunciation
        ipaUs: generated.pronunciation.ipaUs,
        ipaUk: generated.pronunciation.ipaUk,
        pronunciation: generated.pronunciation.korean,

        // Morphology
        prefix: generated.morphology.prefix?.part,
        root: generated.morphology.root?.part,
        suffix: generated.morphology.suffix?.part,
        morphologyNote: generated.morphology.note,

        // Related words (arrays)
        synonymList: generated.relatedWords.synonyms,
        antonymList: generated.relatedWords.antonyms,
        rhymingWords: generated.rhyming.words,
        relatedWords: generated.relatedWords.related,

        // AI metadata
        aiModel: 'claude-sonnet-4-20250514',
        aiGeneratedAt: new Date(),
        humanReviewed: false,
      },
    });

    // Create Etymology
    if (generated.etymology) {
      await prisma.etymology.upsert({
        where: { wordId },
        update: {
          origin: generated.etymology.description,
          language: generated.etymology.language,
          breakdown: generated.etymology.breakdown,
        },
        create: {
          wordId,
          origin: generated.etymology.description,
          language: generated.etymology.language,
          evolution: generated.etymology.description,
          breakdown: generated.etymology.breakdown,
        },
      });
    }

    // Create Mnemonic
    if (generated.mnemonic) {
      await prisma.mnemonic.create({
        data: {
          wordId,
          title: 'AI Generated Mnemonic',
          content: generated.mnemonic.description,
          koreanHint: generated.mnemonic.koreanAssociation,
          whiskPrompt: generated.mnemonic.imagePrompt,
          source: 'AI_GENERATED',
        },
      });
    }

    // Create Examples - use createMany for efficiency
    if (generated.examples.length > 0) {
      await prisma.example.createMany({
        data: generated.examples.map((example, i) => ({
          wordId,
          sentence: example.sentenceEn,
          translation: example.sentenceKo,
          isFunny: example.isFunny,
          isReal: !example.isFunny,
          source: example.source,
          order: i,
        })),
      });
    }

    // Create Collocations - use createMany for efficiency
    if (generated.collocations.length > 0) {
      await prisma.collocation.createMany({
        data: generated.collocations.map((collocation, i) => ({
          wordId,
          phrase: collocation.phrase,
          translation: collocation.translation,
          type: collocation.type,
          exampleEn: collocation.exampleEn,
          exampleKo: collocation.exampleKo,
          order: i,
        })),
      });
    }

    // Create Synonyms - use createMany for efficiency
    if (generated.relatedWords.synonyms.length > 0) {
      await prisma.synonym.createMany({
        data: generated.relatedWords.synonyms.map(synonym => ({
          wordId,
          synonym,
        })),
      });
    }

    // Create Antonyms - use createMany for efficiency
    if (generated.relatedWords.antonyms.length > 0) {
      await prisma.antonym.createMany({
        data: generated.relatedWords.antonyms.map(antonym => ({
          wordId,
          antonym,
        })),
      });
    }

    // Create Rhymes - use createMany for efficiency
    if (generated.rhyming.words.length > 0) {
      await prisma.rhyme.createMany({
        data: generated.rhyming.words.map(rhymingWord => ({
          wordId,
          rhymingWord,
          similarity: 0.8,
          example: generated.rhyming.note,
        })),
      });
    }

    logger.info(`Content saved for word: ${wordId}`);
  }, 3, 1000); // 3 retries with 1 second initial delay
}

// ---------------------------------------------
// Batch Processing
// ---------------------------------------------

export interface BatchGenerationResult {
  word: string;
  wordId?: string;
  success: boolean;
  content?: GeneratedContent;
  error?: string;
}

export async function generateBatchContent(
  words: string[],
  examCategory: ExamCategory,
  cefrLevel: CEFRLevel,
  onProgress?: (current: number, total: number) => void
): Promise<BatchGenerationResult[]> {
  const results: BatchGenerationResult[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    try {
      const content = await generateWordContent({
        word,
        examCategory,
        cefrLevel,
      });

      results.push({
        word,
        success: true,
        content,
      });
    } catch (error) {
      results.push({
        word,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // 진행률 콜백
    onProgress?.(i + 1, words.length);

    // Rate limiting - 요청 간 딜레이 (1초)
    if (i < words.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}

// ---------------------------------------------
// WHISK Image Prompt Generator
// ---------------------------------------------

export function generateWhiskPrompt(
  word: string,
  mnemonic: string,
  style: 'animation' | 'illustration' = 'animation'
): string {
  const basePrompt = `
Create a memorable, educational ${style} for the English word "${word}".

Visual concept: ${mnemonic}

Style requirements:
- Bright, engaging colors suitable for education
- Clear, simple composition
- Friendly and approachable aesthetic
- ${style === 'animation' ? 'Smooth looping animation, 2-3 seconds' : 'Clean illustration style'}
- No text or letters in the image

The image should help Korean learners remember both the pronunciation and meaning of "${word}" through visual association.
`.trim();

  return basePrompt;
}

// ---------------------------------------------
// Job Queue Processing
// ---------------------------------------------

export async function processGenerationJob(jobId: string): Promise<void> {
  const job = await prisma.contentGenerationJob.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new Error(`Job not found: ${jobId}`);
  }

  try {
    // Update job status
    await prisma.contentGenerationJob.update({
      where: { id: jobId },
      data: { status: 'processing', startedAt: new Date() },
    });

    const results: BatchGenerationResult[] = [];
    const inputWords = job.inputWords;

    for (let i = 0; i < inputWords.length; i++) {
      const input = inputWords[i];

      try {
        // Check if input is a UUID (word ID) or a word string
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input);

        let wordRecord;
        let wordText: string;

        if (isUUID) {
          // Input is a word ID - fetch the word from DB with retry
          wordRecord = await withRetry(async () => {
            return prisma.word.findUnique({
              where: { id: input },
            });
          });
          if (!wordRecord) {
            throw new Error(`Word not found with ID: ${input}`);
          }
          wordText = wordRecord.word;
        } else {
          // Input is a word string - find or create word record with retry
          wordText = input.trim().toLowerCase();
          wordRecord = await withRetry(async () => {
            return prisma.word.findFirst({
              where: { word: wordText },
            });
          });

          // If word doesn't exist, create it with basic info
          if (!wordRecord) {
            logger.info(`Word "${wordText}" not found in DB, creating new record...`);
            wordRecord = await withRetry(async () => {
              return prisma.word.create({
                data: {
                  word: wordText,
                  definition: '', // Will be filled by AI
                  definitionKo: '',
                  partOfSpeech: 'NOUN', // Default, will be updated
                  examCategory: job.examCategory || 'CSAT',
                  cefrLevel: job.cefrLevel || 'B1',
                  difficulty: 'INTERMEDIATE',
                  status: 'DRAFT',
                  level: 'L1',
                  frequency: 100,
                },
              });
            });
            logger.info(`Created new word record: ${wordText} (ID: ${wordRecord.id})`);
          }
        }

        // Generate content using Claude
        const content = await generateWordContent({
          word: wordText,
          examCategory: job.examCategory || 'CSAT',
          cefrLevel: job.cefrLevel || 'B1',
        });

        // Save generated content to database if we have a word record
        if (wordRecord) {
          await saveGeneratedContent(wordRecord.id, content);
          logger.info(`Content generated and saved for word: ${wordText} (ID: ${wordRecord.id})`);
          results.push({ word: wordText, wordId: wordRecord.id, success: true, content });
        } else {
          logger.warn(`Word record not found for: ${wordText}, content generated but not saved`);
          results.push({ word: wordText, success: true, content });
        }

        // Update progress with retry
        const progress = Math.round(((i + 1) / inputWords.length) * 100);
        await withRetry(async () => {
          return prisma.contentGenerationJob.update({
            where: { id: jobId },
            data: { progress },
          });
        });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to process word ${input}:`, error);
        results.push({
          word: input,
          success: false,
          error: errorMsg,
        });
      }

      // Rate limiting
      if (i < inputWords.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Update job as completed
    await prisma.contentGenerationJob.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        progress: 100,
        result: results as any,
        completedAt: new Date(),
      },
    });

    logger.info(`Job ${jobId} completed. Success: ${results.filter(r => r.success).length}/${results.length}`);
  } catch (error) {
    // Update job as failed
    await prisma.contentGenerationJob.update({
      where: { id: jobId },
      data: {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date(),
      },
    });
    throw error;
  }
}

export default {
  generateWordContent,
  saveGeneratedContent,
  generateBatchContent,
  generateWhiskPrompt,
  processGenerationJob,
};
