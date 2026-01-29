// ============================================
// VocaVision - AI Content Generation Service
// Claude API를 사용한 단어 콘텐츠 자동 생성
// ============================================

import Anthropic from '@anthropic-ai/sdk';
import { ExamCategory, CEFRLevel } from '@prisma/client';
import logger from '../utils/logger';
import prisma from '../lib/prisma';

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
// 프롬프트 템플릿 (최적화 v2 - 35% 토큰 절감)
// ---------------------------------------------

const CONTENT_GENERATION_PROMPT = `당신은 한국인 영어 학습자를 위한 어휘 콘텐츠 전문가입니다.

## 입력
단어: {{WORD}} | 시험: {{EXAM_CATEGORY}} | 레벨: {{CEFR_LEVEL}}

## 핵심 원칙
1. 정확성: 사전적으로 정확한 정보
2. 기억성: 한글 발음 기반 연상법 (경선식 스타일)
3. 재미: 유머러스한 예문으로 학습 동기 유발

## 연상 기억법 (mnemonic) - 가장 중요!
- 한글 발음과 의미를 창의적으로 연결
- 예: "abandon [어밴던]" → "아! 밴(van)에서 던져버리다" → 버리다
- 시각적 장면이 떠오르는 구체적 이미지
- imagePrompt는 DALL-E용 영어 프롬프트

## 한글 발음 강세 표시 (중요!)
- 강세가 있는 음절을 **별표**로 감싸기
- 예: "어**밴**던" (밴에 강세), "퍼**시**브" (시에 강세)
- IPA의 ˈ 기호 위치를 참고하여 강세 음절 결정

## JSON 출력 형식
\`\`\`json
{
  "pronunciation": { "ipaUs": "/IPA/", "ipaUk": "/IPA/", "korean": "한글**강세**발음" },
  "definitions": [{ "partOfSpeech": "noun/verb/adj", "definitionEn": "영어정의", "definitionKo": "한국어뜻", "exampleEn": "예문", "exampleKo": "번역" }],
  "etymology": { "description": "어원설명(스토리텔링)", "language": "Latin/Greek/French", "breakdown": "분석" },
  "morphology": { "prefix": { "part": "접두사", "meaning": "의미" }, "root": { "part": "어근", "meaning": "의미" }, "suffix": { "part": "접미사", "meaning": "의미" }, "note": "설명" },
  "collocations": [{ "phrase": "자주쓰는조합", "translation": "번역", "type": "verb+noun" }],
  "rhyming": { "words": ["word1", "word2"], "note": "암기팁" },
  "mnemonic": { "description": "한글발음 연상 설명", "koreanAssociation": "짧은 연상 공식", "imagePrompt": "DALL-E image prompt in English" },
  "examples": [{ "sentenceEn": "재미있거나 실용적인 예문", "sentenceKo": "번역", "isFunny": true/false }],
  "relatedWords": { "synonyms": ["동의어3-5개"], "antonyms": ["반의어2-3개"], "related": ["관련어"] }
}
\`\`\`

## 참고
- 품사: noun, verb, adjective, adverb, pronoun, preposition, conjunction, interjection
- collocations 5-7개, examples 3-5개, synonyms 3-5개 생성
- 모든 필드 필수. null인 경우 해당 필드 생략 가능 (prefix/root/suffix 등)
`;

// 기존 상세 프롬프트 (고품질 생성용 - Claude Max 편집 시 사용)
const CONTENT_GENERATION_PROMPT_DETAILED = `
당신은 영어 어휘 학습 콘텐츠 전문가입니다. 한국인 영어 학습자를 위한 고품질 단어 학습 자료를 생성합니다.

## 입력 정보
- 단어: {{WORD}}
- 시험 카테고리: {{EXAM_CATEGORY}}
- CEFR 레벨: {{CEFR_LEVEL}}

## 품질 기준 (GOLD Standard)
다음 기준을 반드시 충족해야 합니다:
1. **정확성**: 모든 정보는 사전적으로 정확해야 함
2. **기억성**: 연상법은 한국어 발음을 창의적으로 활용해야 함
3. **맥락성**: 예문은 실제 사용 맥락을 반영해야 함
4. **재미**: 유머러스한 요소로 학습 동기 유발

## 연상 기억법 (Mnemonic - 경선식 스타일) ⭐ 핵심
- 한글 발음과 의미를 연결하는 창의적 연상법
- 예: "abandon [어밴던] → '아! 밴(van)에서 던져버리다' → 버리다, 포기하다"
- 시각적 장면을 떠올릴 수 있는 구체적 이미지
- 한국어 언어유희 적극 활용

## 한글 발음 강세 표시 (중요!)
- 강세가 있는 음절을 **별표**로 감싸기
- 예: "어**밴**던" (밴에 강세), "퍼**시**브" (시에 강세)
- IPA의 ˈ 기호 위치를 참고하여 강세 음절 결정

## 출력 형식
반드시 JSON 형식으로 출력:
\`\`\`json
{
  "pronunciation": { "ipaUs": "/발음/", "ipaUk": "/발음/", "korean": "한글**강세**표시" },
  "definitions": [{ "partOfSpeech": "품사", "definitionEn": "영어정의", "definitionKo": "한국어뜻", "exampleEn": "예문", "exampleKo": "번역" }],
  "etymology": { "description": "어원설명", "language": "언어", "breakdown": "분석" },
  "morphology": { "prefix": { "part": "접두사", "meaning": "의미" }, "root": { "part": "어근", "meaning": "의미" }, "suffix": { "part": "접미사", "meaning": "의미" }, "note": "설명" },
  "collocations": [{ "phrase": "콜로케이션", "translation": "번역", "type": "유형" }],
  "rhyming": { "words": ["라이밍단어"], "note": "팁" },
  "mnemonic": { "description": "연상설명", "koreanAssociation": "한글연상", "imagePrompt": "이미지프롬프트" },
  "examples": [{ "sentenceEn": "예문", "sentenceKo": "번역", "isFunny": true }],
  "relatedWords": { "synonyms": ["동의어"], "antonyms": ["반의어"], "related": ["관련어"] }
}
\`\`\`
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
        prefix: generated.morphology?.prefix?.part,
        root: generated.morphology?.root?.part,
        suffix: generated.morphology?.suffix?.part,
        morphologyNote: generated.morphology?.note,

        // Related words (arrays)
        synonymList: generated.relatedWords.synonyms,
        antonymList: generated.relatedWords.antonyms,
        rhymingWords: generated.rhyming.words,
        relatedWords: generated.relatedWords.related,

        // AI metadata
        aiModel: 'claude-sonnet-4-20250514',
        aiGeneratedAt: new Date(),
        humanReviewed: false,

        // Update status to pending review
        status: 'PENDING_REVIEW',
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
