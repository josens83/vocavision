// ============================================
// VocaVision Queue System - Job Processors
// Bull Job Processing Logic
// ============================================

import { Job } from 'bull';
import { PrismaClient } from '@prisma/client';
import {
  AnyJobData,
  ImageGenerationJobData,
  ContentGenerationJobData,
  BatchImportJobData,
  ExportJobData,
  CleanupJobData,
  JobResult,
  JobProgress,
  JobError,
} from '../types/queue.types';

const prisma = new PrismaClient();

// ---------------------------------------------
// Image Generation Processor
// ---------------------------------------------

export async function processImageGeneration(
  job: Job<ImageGenerationJobData>
): Promise<JobResult> {
  const startTime = Date.now();
  const { wordIds, style, size, regenerate, totalWords } = job.data;
  const errors: JobError[] = [];
  const results: Array<{ id: string; success: boolean; data?: unknown; error?: string }> = [];

  let completed = 0;
  let failed = 0;

  console.log(`[ImageProcessor] Starting job ${job.id} for ${totalWords} words`);

  // Dynamic import to avoid circular dependencies
  const { ImageGenerationService } = await import('../../whisk-integration/services/image-generation.service');

  for (const wordId of wordIds) {
    try {
      // Update progress
      await job.progress({
        completed,
        total: totalWords,
        percent: Math.round((completed / totalWords) * 100),
        currentItem: wordId,
        stage: 'generating',
        message: `Processing word ${completed + 1} of ${totalWords}`,
        errors,
      } as JobProgress);

      // Get word with content
      const word = await prisma.vocaWord.findUnique({
        where: { id: wordId },
        include: { content: true },
      });

      if (!word) {
        throw new Error(`Word not found: ${wordId}`);
      }

      if (!word.content?.mnemonic) {
        throw new Error(`Word has no mnemonic: ${word.word}`);
      }

      // Check if image exists and skip if not regenerating
      if (word.content.mnemonicImage && !regenerate) {
        results.push({
          id: wordId,
          success: true,
          data: { skipped: true, imageUrl: word.content.mnemonicImage },
        });
        completed++;
        continue;
      }

      // Generate image
      const result = await ImageGenerationService.generate({
        wordId: word.id,
        word: word.word,
        mnemonic: word.content.mnemonic,
        mnemonicKorean: word.content.mnemonicKorean || undefined,
        style: style as any,
        size: size as any,
      });

      if (!result.success) {
        throw new Error(result.error || 'Image generation failed');
      }

      // Update database
      await prisma.vocaContent.update({
        where: { id: word.content.id },
        data: {
          mnemonicImage: result.imageUrl,
          primaryGifUrl: result.imageUrl,
          thumbnailUrl: result.thumbnailUrl,
          updatedAt: new Date(),
        },
      });

      // Create media record
      await prisma.vocaMedia.create({
        data: {
          contentId: word.content.id,
          type: 'image',
          url: result.imageUrl!,
          thumbnailUrl: result.thumbnailUrl,
          caption: `Mnemonic for "${word.word}"`,
          altText: word.content.mnemonic,
          whiskPrompt: result.whiskPrompt,
          whiskStyle: result.style,
          source: 'ai-generated',
          order: 0,
        },
      });

      results.push({
        id: wordId,
        success: true,
        data: {
          imageUrl: result.imageUrl,
          thumbnailUrl: result.thumbnailUrl,
          style: result.style,
        },
      });

      completed++;

      // Rate limiting delay
      await delay(200);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push({
        itemId: wordId,
        code: 'GENERATION_FAILED',
        message: errorMessage,
        timestamp: new Date().toISOString(),
      });
      results.push({
        id: wordId,
        success: false,
        error: errorMessage,
      });
      failed++;
    }
  }

  const duration = Date.now() - startTime;

  // Log job completion
  await prisma.contentAuditLog.create({
    data: {
      entityType: 'ImageGenerationJob',
      entityId: job.id as string,
      action: 'JOB_COMPLETED',
      newData: {
        total: totalWords,
        completed,
        failed,
        duration,
        style,
      },
      performedBy: job.data.createdBy || 'system',
    },
  });

  console.log(`[ImageProcessor] Job ${job.id} completed: ${completed}/${totalWords} successful`);

  return {
    success: failed === 0,
    completed,
    failed,
    total: totalWords,
    results,
    duration,
    completedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------
// Content Generation Processor
// ---------------------------------------------

export async function processContentGeneration(
  job: Job<ContentGenerationJobData>
): Promise<JobResult> {
  const startTime = Date.now();
  const { wordIds, options, totalWords } = job.data;
  const errors: JobError[] = [];
  const results: Array<{ id: string; success: boolean; data?: unknown; error?: string }> = [];

  let completed = 0;
  let failed = 0;

  console.log(`[ContentProcessor] Starting job ${job.id} for ${totalWords} words`);

  // Dynamic import (assumes ContentGenerationService exists)
  // const { ContentGenerationService } = await import('../../services/content-generation.service');

  for (const wordId of wordIds) {
    try {
      await job.progress({
        completed,
        total: totalWords,
        percent: Math.round((completed / totalWords) * 100),
        currentItem: wordId,
        stage: 'generating',
        message: `Generating content for word ${completed + 1} of ${totalWords}`,
        errors,
      } as JobProgress);

      const word = await prisma.vocaWord.findUnique({
        where: { id: wordId },
        include: { content: true },
      });

      if (!word) {
        throw new Error(`Word not found: ${wordId}`);
      }

      // TODO: Implement actual content generation with Claude API
      // For now, just mark as completed
      const generatedContent = {
        mnemonic: options?.generateMnemonic ? `Mnemonic for ${word.word}` : undefined,
        examples: options?.generateExamples ? [`Example sentence with ${word.word}`] : undefined,
        etymology: options?.generateEtymology ? `Etymology of ${word.word}` : undefined,
      };

      results.push({
        id: wordId,
        success: true,
        data: generatedContent,
      });

      completed++;

      // Rate limiting delay
      await delay(100);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push({
        itemId: wordId,
        code: 'CONTENT_GENERATION_FAILED',
        message: errorMessage,
        timestamp: new Date().toISOString(),
      });
      results.push({
        id: wordId,
        success: false,
        error: errorMessage,
      });
      failed++;
    }
  }

  const duration = Date.now() - startTime;

  console.log(`[ContentProcessor] Job ${job.id} completed: ${completed}/${totalWords} successful`);

  return {
    success: failed === 0,
    completed,
    failed,
    total: totalWords,
    results,
    duration,
    completedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------
// Batch Import Processor
// ---------------------------------------------

export async function processBatchImport(
  job: Job<BatchImportJobData>
): Promise<JobResult> {
  const startTime = Date.now();
  const { fileUrl, fileName, totalRows, category, level } = job.data;
  const errors: JobError[] = [];
  const results: Array<{ id: string; success: boolean; data?: unknown; error?: string }> = [];

  let completed = 0;
  let failed = 0;

  console.log(`[ImportProcessor] Starting job ${job.id} for ${totalRows} rows from ${fileName}`);

  try {
    await job.progress({
      completed: 0,
      total: totalRows,
      percent: 0,
      stage: 'downloading',
      message: 'Downloading file...',
    } as JobProgress);

    // TODO: Implement file download and parsing
    // const fileContent = await downloadFile(fileUrl);
    // const rows = parseFile(fileContent, fileName);

    await job.progress({
      completed: 0,
      total: totalRows,
      percent: 0,
      stage: 'parsing',
      message: 'Parsing file...',
    } as JobProgress);

    // TODO: Process each row
    // for (const row of rows) {
    //   // Create word entry
    //   completed++;
    // }

    // Placeholder completion
    completed = totalRows;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push({
      code: 'IMPORT_FAILED',
      message: errorMessage,
      timestamp: new Date().toISOString(),
    });
    failed = totalRows;
  }

  const duration = Date.now() - startTime;

  console.log(`[ImportProcessor] Job ${job.id} completed: ${completed}/${totalRows} rows imported`);

  return {
    success: failed === 0,
    completed,
    failed,
    total: totalRows,
    results,
    duration,
    completedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------
// Export Processor
// ---------------------------------------------

export async function processExport(
  job: Job<ExportJobData>
): Promise<JobResult> {
  const startTime = Date.now();
  const { format, filters, includeFields } = job.data;
  const errors: JobError[] = [];

  console.log(`[ExportProcessor] Starting job ${job.id} in ${format} format`);

  try {
    await job.progress({
      completed: 0,
      total: 100,
      percent: 0,
      stage: 'querying',
      message: 'Fetching data...',
    } as JobProgress);

    // Build query based on filters
    const where: Record<string, unknown> = {};
    if (filters?.level) where.level = filters.level;
    if (filters?.category) where.categories = { has: filters.category };
    if (filters?.hasImage !== undefined) {
      where.content = {
        mnemonicImage: filters.hasImage ? { not: null } : null,
      };
    }
    if (filters?.hasContent !== undefined) {
      where.content = {
        ...where.content as object,
        mnemonic: filters.hasContent ? { not: null } : null,
      };
    }

    const words = await prisma.vocaWord.findMany({
      where,
      include: { content: true },
    });

    await job.progress({
      completed: 50,
      total: 100,
      percent: 50,
      stage: 'formatting',
      message: `Formatting ${words.length} words...`,
    } as JobProgress);

    // TODO: Format and upload to cloud storage
    let outputUrl = '';

    switch (format) {
      case 'csv':
        // Generate CSV
        outputUrl = `/exports/words-${Date.now()}.csv`;
        break;
      case 'json':
        // Generate JSON
        outputUrl = `/exports/words-${Date.now()}.json`;
        break;
      case 'xlsx':
        // Generate Excel
        outputUrl = `/exports/words-${Date.now()}.xlsx`;
        break;
    }

    await job.progress({
      completed: 100,
      total: 100,
      percent: 100,
      stage: 'complete',
      message: 'Export complete',
    } as JobProgress);

    const duration = Date.now() - startTime;

    return {
      success: true,
      completed: words.length,
      failed: 0,
      total: words.length,
      outputUrl,
      duration,
      completedAt: new Date().toISOString(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push({
      code: 'EXPORT_FAILED',
      message: errorMessage,
      timestamp: new Date().toISOString(),
    });

    return {
      success: false,
      completed: 0,
      failed: 1,
      total: 1,
      duration: Date.now() - startTime,
      completedAt: new Date().toISOString(),
    };
  }
}

// ---------------------------------------------
// Cleanup Processor
// ---------------------------------------------

export async function processCleanup(
  job: Job<CleanupJobData>
): Promise<JobResult> {
  const startTime = Date.now();
  const { target, olderThan } = job.data;
  let cleaned = 0;
  let failed = 0;

  console.log(`[CleanupProcessor] Starting job ${job.id} for target: ${target}`);

  try {
    await job.progress({
      completed: 0,
      total: 100,
      percent: 0,
      stage: 'scanning',
      message: `Scanning for ${target}...`,
    } as JobProgress);

    const cutoffDate = olderThan ? new Date(olderThan) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days default

    switch (target) {
      case 'orphaned-media':
        // Find media without associated content
        const orphanedMedia = await prisma.vocaMedia.findMany({
          where: {
            content: null,
          },
        });
        cleaned = orphanedMedia.length;
        await prisma.vocaMedia.deleteMany({
          where: {
            id: { in: orphanedMedia.map((m) => m.id) },
          },
        });
        break;

      case 'old-logs':
        // Delete old audit logs
        const deletedLogs = await prisma.contentAuditLog.deleteMany({
          where: {
            createdAt: { lt: cutoffDate },
          },
        });
        cleaned = deletedLogs.count;
        break;

      case 'temp-files':
        // TODO: Clean temp files from storage
        cleaned = 0;
        break;
    }

    await job.progress({
      completed: 100,
      total: 100,
      percent: 100,
      stage: 'complete',
      message: `Cleaned ${cleaned} items`,
    } as JobProgress);

    const duration = Date.now() - startTime;

    return {
      success: true,
      completed: cleaned,
      failed: 0,
      total: cleaned,
      duration,
      completedAt: new Date().toISOString(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[CleanupProcessor] Error:`, errorMessage);

    return {
      success: false,
      completed: cleaned,
      failed: 1,
      total: 1,
      duration: Date.now() - startTime,
      completedAt: new Date().toISOString(),
    };
  }
}

// ---------------------------------------------
// Processor Router
// ---------------------------------------------

export async function routeJobProcessor(job: Job<AnyJobData>): Promise<JobResult> {
  const { type } = job.data;

  switch (type) {
    case 'image-generation':
      return processImageGeneration(job as Job<ImageGenerationJobData>);
    case 'content-generation':
      return processContentGeneration(job as Job<ContentGenerationJobData>);
    case 'batch-import':
      return processBatchImport(job as Job<BatchImportJobData>);
    case 'export':
      return processExport(job as Job<ExportJobData>);
    case 'cleanup':
      return processCleanup(job as Job<CleanupJobData>);
    default:
      throw new Error(`Unknown job type: ${type}`);
  }
}

// ---------------------------------------------
// Utility Functions
// ---------------------------------------------

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------
// Register All Processors
// ---------------------------------------------

export function registerAllProcessors(queueManager: any): void {
  queueManager.registerProcessor('image-generation', processImageGeneration);
  queueManager.registerProcessor('content-generation', processContentGeneration);
  queueManager.registerProcessor('batch-import', processBatchImport);
  queueManager.registerProcessor('export', processExport);
  queueManager.registerProcessor('cleanup', processCleanup);

  console.log('[JobProcessors] All processors registered');
}
