// ============================================
// VocaVision Queue System - Job Processors
// 작업 처리 로직 (Workers)
// ============================================

import { Job, DoneCallback } from 'bull';
import { PrismaClient } from '@prisma/client';
import Anthropic from '@anthropic-ai/sdk';
import {
  JobType,
  ContentGenerationJobData,
  BatchContentJobData,
  ImageGenerationJobData,
  BatchImageJobData,
  ExportJobData,
  ContentGenerationResult,
  ImageGenerationResult,
  BatchJobResult,
  QUEUE_NAMES,
} from '../types/queue.types';
import { getQueueManager } from './queue-manager.service';

// ---------------------------------------------
// Dependencies
// ---------------------------------------------

const prisma = new PrismaClient();
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ---------------------------------------------
// Content Generation Processor
// ---------------------------------------------

export async function processContentGeneration(
  job: Job<ContentGenerationJobData>
): Promise<ContentGenerationResult> {
  const startTime = Date.now();
  const { wordId, word, examCategory, level, regenerate } = job.data;

  console.log(`[ContentProcessor] Processing word: ${word} (${wordId})`);
  job.progress(10);

  try {
    // 1. Check if content already exists
    const existingContent = await prisma.vocaContent.findUnique({
      where: { wordId },
    });

    if (existingContent && !regenerate) {
      return {
        success: true,
        wordId,
        contentId: existingContent.id,
        duration: Date.now() - startTime,
      };
    }

    job.progress(20);

    // 2. Build prompt for Claude
    const prompt = buildContentGenerationPrompt(word, examCategory, level);

    job.progress(30);

    // 3. Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    job.progress(60);

    // 4. Parse response
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const jsonMatch = content.text.match(/```json\n?([\s\S]*?)\n?```/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Claude response');
    }

    const generatedContent = JSON.parse(jsonMatch[1]);

    job.progress(70);

    // 5. Save to database
    let savedContent;

    if (existingContent) {
      // Update existing
      savedContent = await prisma.vocaContent.update({
        where: { id: existingContent.id },
        data: {
          ipaUs: generatedContent.pronunciation?.ipaUs,
          ipaUk: generatedContent.pronunciation?.ipaUk,
          pronunciation: generatedContent.pronunciation?.korean,
          etymology: generatedContent.etymology?.description,
          etymologyLang: generatedContent.etymology?.language,
          prefix: generatedContent.morphology?.prefix,
          root: generatedContent.morphology?.root,
          suffix: generatedContent.morphology?.suffix,
          morphologyNote: generatedContent.morphology?.note,
          rhymingWords: generatedContent.rhyming?.words || [],
          rhymingNote: generatedContent.rhyming?.note,
          mnemonic: generatedContent.mnemonic?.description,
          mnemonicKorean: generatedContent.mnemonic?.koreanAssociation,
          synonyms: generatedContent.relatedWords?.synonyms || [],
          antonyms: generatedContent.relatedWords?.antonyms || [],
          relatedWords: generatedContent.relatedWords?.related || [],
          aiModel: 'claude-sonnet-4-20250514',
          aiGeneratedAt: new Date(),
          humanReviewed: false,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new
      savedContent = await prisma.vocaContent.create({
        data: {
          wordId,
          ipaUs: generatedContent.pronunciation?.ipaUs,
          ipaUk: generatedContent.pronunciation?.ipaUk,
          pronunciation: generatedContent.pronunciation?.korean,
          etymology: generatedContent.etymology?.description,
          etymologyLang: generatedContent.etymology?.language,
          prefix: generatedContent.morphology?.prefix,
          root: generatedContent.morphology?.root,
          suffix: generatedContent.morphology?.suffix,
          morphologyNote: generatedContent.morphology?.note,
          rhymingWords: generatedContent.rhyming?.words || [],
          rhymingNote: generatedContent.rhyming?.note,
          mnemonic: generatedContent.mnemonic?.description,
          mnemonicKorean: generatedContent.mnemonic?.koreanAssociation,
          synonyms: generatedContent.relatedWords?.synonyms || [],
          antonyms: generatedContent.relatedWords?.antonyms || [],
          relatedWords: generatedContent.relatedWords?.related || [],
          aiModel: 'claude-sonnet-4-20250514',
          aiGeneratedAt: new Date(),
          humanReviewed: false,
        },
      });
    }

    job.progress(85);

    // 6. Save definitions
    if (generatedContent.definitions?.length > 0) {
      await prisma.vocaDefinition.deleteMany({ where: { contentId: savedContent.id } });
      await prisma.vocaDefinition.createMany({
        data: generatedContent.definitions.map((def: any, index: number) => ({
          contentId: savedContent.id,
          partOfSpeech: def.partOfSpeech,
          definitionEn: def.english,
          definitionKo: def.korean,
          exampleEn: def.exampleEn,
          exampleKo: def.exampleKo,
          order: index,
        })),
      });
    }

    // 7. Save collocations
    if (generatedContent.collocations?.length > 0) {
      await prisma.vocaCollocation.deleteMany({ where: { contentId: savedContent.id } });
      await prisma.vocaCollocation.createMany({
        data: generatedContent.collocations.map((col: any) => ({
          contentId: savedContent.id,
          phrase: col.phrase,
          translation: col.translation,
          type: col.type,
          frequency: col.frequency || 0,
        })),
      });
    }

    // 8. Save examples
    if (generatedContent.examples?.length > 0) {
      await prisma.vocaExample.deleteMany({ where: { contentId: savedContent.id } });
      await prisma.vocaExample.createMany({
        data: generatedContent.examples.map((ex: any, index: number) => ({
          contentId: savedContent.id,
          sentenceEn: ex.english,
          sentenceKo: ex.korean,
          isFunny: ex.isFunny || false,
          isReal: ex.isReal || true,
          source: ex.source,
          order: index,
        })),
      });
    }

    // 9. Update word status
    await prisma.vocaWord.update({
      where: { id: wordId },
      data: {
        status: 'PENDING_REVIEW',
        updatedAt: new Date(),
      },
    });

    job.progress(100);

    const duration = Date.now() - startTime;
    console.log(`[ContentProcessor] Completed ${word} in ${duration}ms`);

    return {
      success: true,
      wordId,
      contentId: savedContent.id,
      duration,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[ContentProcessor] Failed ${word}:`, errorMessage);

    return {
      success: false,
      wordId,
      error: errorMessage,
      duration: Date.now() - startTime,
    };
  }
}

// ---------------------------------------------
// Batch Content Generation Processor
// ---------------------------------------------

export async function processBatchContent(
  job: Job<BatchContentJobData>
): Promise<BatchJobResult> {
  const startTime = Date.now();
  const { batchId, words, examCategory, level, regenerate, requestedBy } = job.data;

  console.log(`[BatchContentProcessor] Starting batch ${batchId} with ${words.length} words`);

  const results: BatchJobResult['results'] = [];
  let successful = 0;
  let failed = 0;

  const queueManager = getQueueManager();
  const contentQueue = queueManager.getContentQueue();

  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    try {
      // Add individual job to content queue
      const childJob = await contentQueue.add('content-generation', {
        wordId: word.id,
        word: word.word,
        examCategory,
        level,
        regenerate,
        requestedBy,
      } as ContentGenerationJobData, {
        jobId: `${batchId}-content-${i}`,
        priority: 2, // Batch jobs have lower priority
      });

      // Wait for job to complete
      const result = await childJob.finished() as ContentGenerationResult;

      if (result.success) {
        successful++;
        results.push({ wordId: word.id, success: true });
      } else {
        failed++;
        results.push({ wordId: word.id, success: false, error: result.error });
      }

    } catch (error) {
      failed++;
      results.push({
        wordId: word.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Update progress
    job.progress(Math.round(((i + 1) / words.length) * 100));

    // Small delay between jobs to prevent overload
    await sleep(500);
  }

  const duration = Date.now() - startTime;
  console.log(`[BatchContentProcessor] Completed batch ${batchId}: ${successful}/${words.length} successful`);

  return {
    batchId,
    total: words.length,
    successful,
    failed,
    results,
    duration,
  };
}

// ---------------------------------------------
// Image Generation Processor
// ---------------------------------------------

export async function processImageGeneration(
  job: Job<ImageGenerationJobData>
): Promise<ImageGenerationResult> {
  const startTime = Date.now();
  const { wordId, word, mnemonic, mnemonicKorean, style, size, regenerate } = job.data;

  console.log(`[ImageProcessor] Processing word: ${word} (${wordId})`);
  job.progress(10);

  try {
    // Import dynamically to avoid circular dependencies
    const { ImageGenerationService } = await import('../../whisk-integration/services/image-generation.service');

    job.progress(30);

    const result = await ImageGenerationService.generate({
      wordId,
      word,
      mnemonic,
      mnemonicKorean,
      style: style as any,
      size: size as any,
    });

    job.progress(80);

    if (result.success && result.imageUrl) {
      // Update database
      await prisma.vocaContent.update({
        where: { wordId },
        data: {
          mnemonicImage: result.imageUrl,
          primaryGifUrl: result.imageUrl,
          thumbnailUrl: result.thumbnailUrl,
          updatedAt: new Date(),
        },
      });
    }

    job.progress(100);

    const duration = Date.now() - startTime;
    console.log(`[ImageProcessor] Completed ${word} in ${duration}ms`);

    return {
      success: result.success,
      wordId,
      imageUrl: result.imageUrl,
      thumbnailUrl: result.thumbnailUrl,
      error: result.error,
      duration,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[ImageProcessor] Failed ${word}:`, errorMessage);

    return {
      success: false,
      wordId,
      error: errorMessage,
      duration: Date.now() - startTime,
    };
  }
}

// ---------------------------------------------
// Batch Image Generation Processor
// ---------------------------------------------

export async function processBatchImage(
  job: Job<BatchImageJobData>
): Promise<BatchJobResult> {
  const startTime = Date.now();
  const { batchId, words, style, size, regenerate, requestedBy } = job.data;

  console.log(`[BatchImageProcessor] Starting batch ${batchId} with ${words.length} words`);

  const results: BatchJobResult['results'] = [];
  let successful = 0;
  let failed = 0;

  const queueManager = getQueueManager();
  const imageQueue = queueManager.getImageQueue();

  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    try {
      // Add individual job to image queue
      const childJob = await imageQueue.add('image-generation', {
        wordId: word.id,
        word: word.word,
        mnemonic: word.mnemonic,
        mnemonicKorean: word.mnemonicKorean,
        style,
        size,
        regenerate,
        requestedBy,
      } as ImageGenerationJobData, {
        jobId: `${batchId}-image-${i}`,
        priority: 2,
      });

      // Wait for job to complete
      const result = await childJob.finished() as ImageGenerationResult;

      if (result.success) {
        successful++;
        results.push({ wordId: word.id, success: true });
      } else {
        failed++;
        results.push({ wordId: word.id, success: false, error: result.error });
      }

    } catch (error) {
      failed++;
      results.push({
        wordId: word.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Update progress
    job.progress(Math.round(((i + 1) / words.length) * 100));

    // Delay between jobs (image generation is rate-limited)
    await sleep(1000);
  }

  const duration = Date.now() - startTime;
  console.log(`[BatchImageProcessor] Completed batch ${batchId}: ${successful}/${words.length} successful`);

  return {
    batchId,
    total: words.length,
    successful,
    failed,
    results,
    duration,
  };
}

// ---------------------------------------------
// Export Processor
// ---------------------------------------------

export async function processExport(
  job: Job<ExportJobData>
): Promise<{ success: boolean; fileUrl?: string; error?: string }> {
  const { exportId, format, filters, requestedBy } = job.data;

  console.log(`[ExportProcessor] Starting export ${exportId} (format: ${format})`);
  job.progress(10);

  try {
    // Build query
    const where: any = {};
    if (filters?.examCategories?.length) {
      where.examCategories = { hasSome: filters.examCategories };
    }
    if (filters?.levels?.length) {
      where.level = { in: filters.levels };
    }
    if (filters?.status?.length) {
      where.status = { in: filters.status };
    }

    job.progress(20);

    // Fetch data
    const words = await prisma.vocaWord.findMany({
      where,
      include: {
        content: true,
      },
    });

    job.progress(50);

    // Format data based on export type
    let fileContent: string;
    let fileName: string;
    let mimeType: string;

    switch (format) {
      case 'json':
        fileContent = JSON.stringify(words, null, 2);
        fileName = `vocavision-export-${exportId}.json`;
        mimeType = 'application/json';
        break;

      case 'csv':
        fileContent = convertToCSV(words);
        fileName = `vocavision-export-${exportId}.csv`;
        mimeType = 'text/csv';
        break;

      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    job.progress(80);

    // In production, upload to cloud storage
    // For now, just return success
    const fileUrl = `/exports/${fileName}`;

    job.progress(100);
    console.log(`[ExportProcessor] Completed export ${exportId}`);

    return { success: true, fileUrl };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[ExportProcessor] Failed:`, errorMessage);
    return { success: false, error: errorMessage };
  }
}

// ---------------------------------------------
// Helper Functions
// ---------------------------------------------

function buildContentGenerationPrompt(word: string, examCategory: string, level: string): string {
  return `
당신은 한국인 영어 학습자를 위한 어휘 학습 콘텐츠를 생성하는 전문가입니다.

다음 영어 단어에 대해 학습 콘텐츠를 생성해주세요:

**단어:** ${word}
**시험:** ${examCategory}
**난이도:** ${level}

아래 JSON 형식으로 응답해주세요:

\`\`\`json
{
  "pronunciation": {
    "ipaUs": "미국식 IPA 발음기호",
    "ipaUk": "영국식 IPA 발음기호",
    "korean": "한글 발음"
  },
  "definitions": [
    {
      "partOfSpeech": "품사",
      "english": "영어 정의",
      "korean": "한국어 정의",
      "exampleEn": "영어 예문",
      "exampleKo": "한국어 번역"
    }
  ],
  "etymology": {
    "description": "어원 설명 (영어)",
    "language": "원어 (Latin, Greek 등)"
  },
  "morphology": {
    "prefix": "접두사 (있는 경우)",
    "root": "어근",
    "suffix": "접미사 (있는 경우)",
    "note": "형태 분석 설명"
  },
  "collocations": [
    {
      "phrase": "콜로케이션",
      "translation": "한국어 번역",
      "type": "verb+noun, adj+noun 등",
      "frequency": 1-5
    }
  ],
  "rhyming": {
    "words": ["라이밍 단어들"],
    "note": "라이밍 패턴 설명"
  },
  "mnemonic": {
    "description": "영어 연상 기억법 설명",
    "koreanAssociation": "한국어 발음 연상법 (예: abandon = 어밴던 = 어! 밴드가 버리다)",
    "imagePrompt": "이미지 생성을 위한 장면 설명"
  },
  "examples": [
    {
      "english": "예문 (영어)",
      "korean": "번역 (한국어)",
      "isFunny": true/false,
      "source": "출처 (있는 경우)"
    }
  ],
  "relatedWords": {
    "synonyms": ["동의어들"],
    "antonyms": ["반의어들"],
    "related": ["관련어들"]
  }
}
\`\`\`

중요:
1. 한국인 학습자가 쉽게 기억할 수 있는 연상법을 만들어주세요
2. 재미있고 기억에 남는 예문을 포함해주세요
3. ${examCategory} 시험에 적합한 난이도로 작성해주세요
4. 반드시 유효한 JSON 형식으로 응답해주세요
`.trim();
}

function convertToCSV(words: any[]): string {
  const headers = ['word', 'level', 'status', 'examCategories', 'etymology', 'mnemonic'];
  const rows = words.map((w) => [
    w.word,
    w.level,
    w.status,
    w.examCategories.join(';'),
    w.content?.etymology || '',
    w.content?.mnemonic || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  return csvContent;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------
// Register Processors
// ---------------------------------------------

export async function registerProcessors(): Promise<void> {
  const queueManager = getQueueManager();

  // Content Queue Processors
  const contentQueue = queueManager.getContentQueue();
  contentQueue.process('content-generation', 3, processContentGeneration);
  contentQueue.process('batch-content', 1, processBatchContent);

  // Image Queue Processors
  const imageQueue = queueManager.getImageQueue();
  imageQueue.process('image-generation', 2, processImageGeneration);
  imageQueue.process('batch-image', 1, processBatchImage);

  // Export Queue Processors
  const exportQueue = queueManager.getExportQueue();
  exportQueue.process('export', 2, processExport);

  console.log('[Processors] All processors registered');
}

export default {
  processContentGeneration,
  processBatchContent,
  processImageGeneration,
  processBatchImage,
  processExport,
  registerProcessors,
};
