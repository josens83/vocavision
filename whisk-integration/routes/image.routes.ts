// ============================================
// VocaVision - Image Generation API Routes
// Express.js Router for /api/admin/images
// ============================================

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { ImageGenerationService } from '../services/image-generation.service';
import {
  ImageStyle,
  ImageSize,
  STYLE_CONFIGS,
} from '../types/whisk.types';

const router = Router();
const prisma = new PrismaClient();

// ---------------------------------------------
// Validation Schemas
// ---------------------------------------------

const GenerateSingleImageSchema = z.object({
  wordId: z.string().uuid(),
  style: z.enum([
    'cartoon', 'anime', 'watercolor', 'pixel', 'sketch',
    '3d-render', 'comic', 'minimalist', 'vintage', 'pop-art'
  ] as const).optional(),
  size: z.enum(['512x512', '768x768', '1024x1024'] as const).optional(),
  regenerate: z.boolean().optional().default(false),
});

const GenerateBatchImagesSchema = z.object({
  wordIds: z.array(z.string().uuid()).min(1).max(50),
  style: z.enum([
    'cartoon', 'anime', 'watercolor', 'pixel', 'sketch',
    '3d-render', 'comic', 'minimalist', 'vintage', 'pop-art'
  ] as const).optional(),
  size: z.enum(['512x512', '768x768', '1024x1024'] as const).optional(),
  regenerate: z.boolean().optional().default(false),
});

const PreviewPromptSchema = z.object({
  word: z.string().min(1),
  mnemonic: z.string().min(1),
  mnemonicKorean: z.string().optional(),
  style: z.enum([
    'cartoon', 'anime', 'watercolor', 'pixel', 'sketch',
    '3d-render', 'comic', 'minimalist', 'vintage', 'pop-art'
  ] as const).optional(),
});

// ---------------------------------------------
// Helper Functions
// ---------------------------------------------

function sendSuccess(res: Response, data: unknown, message?: string) {
  res.json({
    success: true,
    data,
    message,
  });
}

function sendError(res: Response, statusCode: number, code: string, message: string) {
  res.status(statusCode).json({
    success: false,
    error: { code, message },
  });
}

// ---------------------------------------------
// Routes
// ---------------------------------------------

/**
 * GET /api/admin/images/styles
 * 사용 가능한 이미지 스타일 목록
 */
router.get('/styles', (_req: Request, res: Response) => {
  const styles = ImageGenerationService.getStyleLabels();
  sendSuccess(res, { styles });
});

/**
 * POST /api/admin/images/preview-prompt
 * 프롬프트 미리보기 (이미지 생성 없이)
 */
router.post('/preview-prompt', async (req: Request, res: Response) => {
  try {
    const input = PreviewPromptSchema.parse(req.body);

    const { prompt, negativePrompt, styleConfig } = ImageGenerationService.buildPrompt(
      input.word,
      input.mnemonic,
      input.mnemonicKorean,
      input.style || 'cartoon'
    );

    sendSuccess(res, {
      prompt,
      negativePrompt,
      style: input.style || 'cartoon',
      styleConfig: {
        name: styleConfig.name,
        nameKo: styleConfig.nameKo,
        cfgScale: styleConfig.cfgScale,
        steps: styleConfig.steps,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      sendError(res, 400, 'VALIDATION_ERROR', error.errors[0].message);
      return;
    }
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to generate preview');
  }
});

/**
 * POST /api/admin/images/generate
 * 단일 단어 이미지 생성
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const input = GenerateSingleImageSchema.parse(req.body);

    // 1. Get word with content
    const word = await prisma.vocaWord.findUnique({
      where: { id: input.wordId },
      include: { content: true },
    });

    if (!word) {
      sendError(res, 404, 'NOT_FOUND', 'Word not found');
      return;
    }

    if (!word.content) {
      sendError(res, 400, 'NO_CONTENT', 'Word has no content. Generate content first.');
      return;
    }

    if (!word.content.mnemonic) {
      sendError(res, 400, 'NO_MNEMONIC', 'Word has no mnemonic. Cannot generate image.');
      return;
    }

    // 2. Check if image already exists
    if (word.content.mnemonicImage && !input.regenerate) {
      sendError(res, 409, 'IMAGE_EXISTS', 'Image already exists. Set regenerate=true to override.');
      return;
    }

    // 3. Generate image
    const result = await ImageGenerationService.generate({
      wordId: word.id,
      word: word.word,
      mnemonic: word.content.mnemonic,
      mnemonicKorean: word.content.mnemonicKorean || undefined,
      style: input.style,
      size: input.size,
    });

    if (!result.success) {
      sendError(res, 500, 'GENERATION_FAILED', result.error || 'Image generation failed');
      return;
    }

    // 4. Update database
    await prisma.vocaContent.update({
      where: { id: word.content.id },
      data: {
        mnemonicImage: result.imageUrl,
        primaryGifUrl: result.imageUrl,
        thumbnailUrl: result.thumbnailUrl,
        updatedAt: new Date(),
      },
    });

    // 5. Create media record
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

    // 6. Log activity
    await prisma.contentAuditLog.create({
      data: {
        entityType: 'VocaContent',
        entityId: word.content.id,
        action: input.regenerate ? 'IMAGE_REGENERATED' : 'IMAGE_GENERATED',
        newData: {
          imageUrl: result.imageUrl,
          thumbnailUrl: result.thumbnailUrl,
          style: result.style,
          prompt: result.whiskPrompt,
        },
        performedBy: (req as any).user?.id || 'system',
      },
    });

    sendSuccess(res, {
      wordId: word.id,
      word: word.word,
      imageUrl: result.imageUrl,
      thumbnailUrl: result.thumbnailUrl,
      style: result.style,
      generatedAt: result.generatedAt,
      metadata: result.metadata,
    }, 'Image generated successfully');

  } catch (error) {
    if (error instanceof z.ZodError) {
      sendError(res, 400, 'VALIDATION_ERROR', error.errors[0].message);
      return;
    }
    console.error('[ImageRoute] Generate error:', error);
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to generate image');
  }
});

/**
 * POST /api/admin/images/generate-batch
 * 배치 이미지 생성 (최대 50개)
 */
router.post('/generate-batch', async (req: Request, res: Response) => {
  try {
    const input = GenerateBatchImagesSchema.parse(req.body);

    // 1. Get words with content
    const words = await prisma.vocaWord.findMany({
      where: {
        id: { in: input.wordIds },
      },
      include: { content: true },
    });

    // 2. Filter words that have mnemonic
    const validWords = words.filter((w) => {
      if (!w.content?.mnemonic) return false;
      if (w.content.mnemonicImage && !input.regenerate) return false;
      return true;
    });

    if (validWords.length === 0) {
      sendError(res, 400, 'NO_VALID_WORDS', 'No words eligible for image generation');
      return;
    }

    // 3. Prepare requests
    const requests = validWords.map((w) => ({
      wordId: w.id,
      word: w.word,
      mnemonic: w.content!.mnemonic!,
      mnemonicKorean: w.content!.mnemonicKorean || undefined,
      style: input.style,
      size: input.size,
    }));

    // 4. Generate images
    const batchResult = await ImageGenerationService.generateBatch(requests, {
      maxConcurrent: 3,
      onProgress: (completed, total, result) => {
        console.log(`[ImageBatch] Progress: ${completed}/${total} - ${result.wordId}: ${result.success ? 'OK' : 'FAILED'}`);
      },
    });

    // 5. Update database for successful generations
    const updatePromises = batchResult.results
      .filter((r) => r.success && r.imageUrl)
      .map(async (result) => {
        const word = words.find((w) => w.id === result.wordId);
        if (!word?.content) return;

        await prisma.vocaContent.update({
          where: { id: word.content.id },
          data: {
            mnemonicImage: result.imageUrl,
            primaryGifUrl: result.imageUrl,
            thumbnailUrl: result.thumbnailUrl,
            updatedAt: new Date(),
          },
        });

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
      });

    await Promise.all(updatePromises);

    // 6. Log activity
    await prisma.contentAuditLog.create({
      data: {
        entityType: 'VocaContent',
        entityId: 'batch',
        action: 'BATCH_IMAGE_GENERATION',
        newData: {
          total: batchResult.total,
          successful: batchResult.successful,
          failed: batchResult.failed,
          style: input.style,
        },
        performedBy: (req as any).user?.id || 'system',
      },
    });

    sendSuccess(res, {
      total: batchResult.total,
      successful: batchResult.successful,
      failed: batchResult.failed,
      results: batchResult.results.map((r) => ({
        wordId: r.wordId,
        success: r.success,
        imageUrl: r.imageUrl,
        error: r.error,
      })),
    }, `Batch generation completed: ${batchResult.successful}/${batchResult.total} successful`);

  } catch (error) {
    if (error instanceof z.ZodError) {
      sendError(res, 400, 'VALIDATION_ERROR', error.errors[0].message);
      return;
    }
    console.error('[ImageRoute] Batch generate error:', error);
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to generate batch images');
  }
});

/**
 * DELETE /api/admin/images/:wordId
 * 단어의 이미지 삭제
 */
router.delete('/:wordId', async (req: Request, res: Response) => {
  try {
    const { wordId } = req.params;

    const word = await prisma.vocaWord.findUnique({
      where: { id: wordId },
      include: { content: true },
    });

    if (!word) {
      sendError(res, 404, 'NOT_FOUND', 'Word not found');
      return;
    }

    if (!word.content?.mnemonicImage) {
      sendError(res, 404, 'NO_IMAGE', 'Word has no image');
      return;
    }

    // Update content
    await prisma.vocaContent.update({
      where: { id: word.content.id },
      data: {
        mnemonicImage: null,
        primaryGifUrl: null,
        thumbnailUrl: null,
        updatedAt: new Date(),
      },
    });

    // Delete media records
    await prisma.vocaMedia.deleteMany({
      where: {
        contentId: word.content.id,
        source: 'ai-generated',
      },
    });

    // Log activity
    await prisma.contentAuditLog.create({
      data: {
        entityType: 'VocaContent',
        entityId: word.content.id,
        action: 'IMAGE_DELETED',
        previousData: {
          mnemonicImage: word.content.mnemonicImage,
        },
        performedBy: (req as any).user?.id || 'system',
      },
    });

    sendSuccess(res, { wordId }, 'Image deleted successfully');

  } catch (error) {
    console.error('[ImageRoute] Delete error:', error);
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to delete image');
  }
});

/**
 * GET /api/admin/images/stats
 * 이미지 생성 통계
 */
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    // Total words with content
    const totalWithContent = await prisma.vocaContent.count();

    // Words with images
    const withImages = await prisma.vocaContent.count({
      where: {
        mnemonicImage: { not: null },
      },
    });

    // Words with mnemonic but no image
    const pendingImages = await prisma.vocaContent.count({
      where: {
        mnemonic: { not: null },
        mnemonicImage: null,
      },
    });

    // Recent generations (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentGenerations = await prisma.vocaMedia.count({
      where: {
        source: 'ai-generated',
        createdAt: { gte: sevenDaysAgo },
      },
    });

    // Style distribution
    const styleDistribution = await prisma.vocaMedia.groupBy({
      by: ['whiskStyle'],
      _count: true,
      where: {
        source: 'ai-generated',
        whiskStyle: { not: null },
      },
    });

    sendSuccess(res, {
      totalWithContent,
      withImages,
      pendingImages,
      coveragePercent: totalWithContent > 0
        ? Math.round((withImages / totalWithContent) * 100)
        : 0,
      recentGenerations,
      styleDistribution: styleDistribution.map((s) => ({
        style: s.whiskStyle,
        count: s._count,
      })),
    });

  } catch (error) {
    console.error('[ImageRoute] Stats error:', error);
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to get stats');
  }
});

/**
 * GET /api/admin/images/pending
 * 이미지 생성 대기 중인 단어 목록
 */
router.get('/pending', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    const [words, total] = await Promise.all([
      prisma.vocaWord.findMany({
        where: {
          content: {
            mnemonic: { not: null },
            mnemonicImage: null,
          },
        },
        include: {
          content: {
            select: {
              id: true,
              mnemonic: true,
              mnemonicKorean: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
      }),
      prisma.vocaWord.count({
        where: {
          content: {
            mnemonic: { not: null },
            mnemonicImage: null,
          },
        },
      }),
    ]);

    sendSuccess(res, {
      words: words.map((w) => ({
        id: w.id,
        word: w.word,
        level: w.level,
        mnemonic: w.content?.mnemonic,
        mnemonicKorean: w.content?.mnemonicKorean,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('[ImageRoute] Pending error:', error);
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to get pending words');
  }
});

export default router;
