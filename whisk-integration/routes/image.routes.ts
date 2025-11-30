// ============================================
// VocaVision - Image Generation Routes
// AI 이미지 생성 Express API 엔드포인트
// ============================================

import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ImageGenerationService, buildMnemonicPrompt } from '../services/image-generation.service';
import { PromptOptimizer } from '../services/prompt-optimizer.service';
import {
  ImageStyle,
  STYLE_CONFIGS,
  GenerateImageApiRequest,
  GenerateBatchApiRequest,
  PreviewPromptApiRequest,
} from '../types/whisk.types';

const router = Router();
const prisma = new PrismaClient();

// Type for authenticated request
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

/**
 * @swagger
 * tags:
 *   name: Image Generation
 *   description: AI 이미지 생성 API (WHISK)
 */

// ---------------------------------------------
// GET /styles - 사용 가능한 스타일 목록
// ---------------------------------------------

/**
 * @swagger
 * /admin/images/styles:
 *   get:
 *     summary: 사용 가능한 이미지 스타일 목록
 *     tags: [Image Generation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 스타일 목록
 */
router.get('/styles', async (_req: Request, res: Response) => {
  const styles = ImageGenerationService.getStyleLabels();

  res.json({
    success: true,
    data: { styles },
  });
});

// ---------------------------------------------
// POST /generate - 단일 이미지 생성
// ---------------------------------------------

/**
 * @swagger
 * /admin/images/generate:
 *   post:
 *     summary: 단일 단어 이미지 생성
 *     tags: [Image Generation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - wordId
 *             properties:
 *               wordId:
 *                 type: string
 *               style:
 *                 type: string
 *                 enum: [cartoon, anime, watercolor, pixel, sketch, 3d-render, comic, minimalist, vintage, pop-art]
 *                 default: cartoon
 *               size:
 *                 type: string
 *                 default: "512x512"
 *               regenerate:
 *                 type: boolean
 *                 default: false
 */
router.post('/generate', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { wordId, style = 'cartoon', size = '512x512', regenerate = false } = req.body as GenerateImageApiRequest;

    if (!wordId) {
      res.status(400).json({
        success: false,
        error: 'wordId is required',
      });
      return;
    }

    // Fetch word with content
    const word = await prisma.word.findUnique({
      where: { id: wordId },
      include: {
        content: true,
      },
    });

    if (!word) {
      res.status(404).json({
        success: false,
        error: 'Word not found',
      });
      return;
    }

    // Check if image already exists
    if (!regenerate && word.content?.mnemonicImageUrl) {
      res.json({
        success: true,
        data: {
          wordId,
          word: word.word,
          imageUrl: word.content.mnemonicImageUrl,
          style,
          message: 'Image already exists. Use regenerate=true to create a new one.',
        },
      });
      return;
    }

    // Get mnemonic from content
    const mnemonic = word.content?.mnemonicEnglish || word.content?.mnemonicScene || `A visual representation of ${word.word}`;
    const mnemonicKorean = word.content?.mnemonicKorean || undefined;

    // Generate image
    const result = await ImageGenerationService.generate({
      wordId,
      word: word.word,
      mnemonic,
      mnemonicKorean,
      style: style as ImageStyle,
      size,
      regenerate,
    });

    if (!result.success) {
      res.status(500).json({
        success: false,
        error: result.error || 'Image generation failed',
      });
      return;
    }

    // Update database with image URL
    if (result.imageUrl) {
      await prisma.content.update({
        where: { wordId },
        data: {
          mnemonicImageUrl: result.imageUrl,
        },
      });
    }

    res.json({
      success: true,
      data: {
        wordId,
        word: word.word,
        imageUrl: result.imageUrl,
        thumbnailUrl: result.thumbnailUrl,
        style,
        generatedAt: result.generatedAt,
        metadata: result.metadata,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------
// POST /generate-batch - 배치 이미지 생성
// ---------------------------------------------

/**
 * @swagger
 * /admin/images/generate-batch:
 *   post:
 *     summary: 배치 이미지 생성 (최대 50개)
 *     tags: [Image Generation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - wordIds
 *             properties:
 *               wordIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 maxItems: 50
 *               style:
 *                 type: string
 *                 default: cartoon
 *               regenerate:
 *                 type: boolean
 *                 default: false
 */
router.post('/generate-batch', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { wordIds, style = 'cartoon', regenerate = false } = req.body as GenerateBatchApiRequest;

    if (!wordIds || !Array.isArray(wordIds) || wordIds.length === 0) {
      res.status(400).json({
        success: false,
        error: 'wordIds array is required',
      });
      return;
    }

    if (wordIds.length > 50) {
      res.status(400).json({
        success: false,
        error: 'Maximum 50 words per batch',
      });
      return;
    }

    // Fetch words with content
    const words = await prisma.word.findMany({
      where: { id: { in: wordIds } },
      include: { content: true },
    });

    // Prepare generation requests
    const requests = words
      .filter((w) => regenerate || !w.content?.mnemonicImageUrl)
      .map((w) => ({
        wordId: w.id,
        word: w.word,
        mnemonic: w.content?.mnemonicEnglish || w.content?.mnemonicScene || `A visual representation of ${w.word}`,
        mnemonicKorean: w.content?.mnemonicKorean || undefined,
        style: style as ImageStyle,
      }));

    if (requests.length === 0) {
      res.json({
        success: true,
        data: {
          total: wordIds.length,
          successful: wordIds.length,
          failed: 0,
          message: 'All images already exist',
          results: [],
        },
      });
      return;
    }

    // Generate images
    const batchResult = await ImageGenerationService.generateBatch(requests, {
      maxConcurrent: 3,
      onProgress: (completed, total, result) => {
        console.log(`[BatchGen] Progress: ${completed}/${total} - ${result.wordId}`);
      },
    });

    // Update database for successful generations
    const updatePromises = batchResult.results
      .filter((r) => r.success && r.imageUrl)
      .map((r) =>
        prisma.content.update({
          where: { wordId: r.wordId },
          data: { mnemonicImageUrl: r.imageUrl },
        })
      );

    await Promise.all(updatePromises);

    res.json({
      success: true,
      data: {
        total: batchResult.total,
        successful: batchResult.successful,
        failed: batchResult.failed,
        results: batchResult.results.map((r) => ({
          wordId: r.wordId,
          success: r.success,
          imageUrl: r.imageUrl,
          error: r.error,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------
// POST /preview-prompt - 프롬프트 미리보기
// ---------------------------------------------

/**
 * @swagger
 * /admin/images/preview-prompt:
 *   post:
 *     summary: 프롬프트 미리보기 (이미지 생성 없이)
 *     tags: [Image Generation]
 *     security:
 *       - bearerAuth: []
 */
router.post('/preview-prompt', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { word, mnemonic, mnemonicKorean, style = 'cartoon' } = req.body as PreviewPromptApiRequest;

    if (!word || !mnemonic) {
      res.status(400).json({
        success: false,
        error: 'word and mnemonic are required',
      });
      return;
    }

    // Build basic prompt
    const { prompt, negativePrompt, styleConfig } = buildMnemonicPrompt(
      word,
      mnemonic,
      mnemonicKorean,
      style as ImageStyle
    );

    // Try to optimize with Claude (optional)
    let optimizedPrompt: string | null = null;
    try {
      const optimized = await PromptOptimizer.optimize({
        word,
        mnemonic,
        mnemonicKorean,
        style: style as ImageStyle,
      });
      optimizedPrompt = optimized.prompt;
    } catch {
      // Ignore optimization errors
    }

    res.json({
      success: true,
      data: {
        word,
        style,
        styleConfig: {
          name: styleConfig.name,
          nameKo: styleConfig.nameKo,
        },
        basicPrompt: prompt,
        negativePrompt,
        optimizedPrompt,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------
// GET /stats - 이미지 생성 통계
// ---------------------------------------------

/**
 * @swagger
 * /admin/images/stats:
 *   get:
 *     summary: 이미지 생성 통계
 *     tags: [Image Generation]
 *     security:
 *       - bearerAuth: []
 */
router.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Count words with images
    const totalWithImages = await prisma.content.count({
      where: {
        mnemonicImageUrl: { not: null },
      },
    });

    // Count words without images
    const totalWithoutImages = await prisma.content.count({
      where: {
        OR: [
          { mnemonicImageUrl: null },
          { mnemonicImageUrl: '' },
        ],
      },
    });

    // Recent generations (from audit log if available)
    const recentContent = await prisma.content.findMany({
      where: {
        mnemonicImageUrl: { not: null },
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      include: {
        word: { select: { id: true, word: true } },
      },
    });

    res.json({
      success: true,
      data: {
        totalGenerated: totalWithImages,
        totalPending: totalWithoutImages,
        recentGenerations: recentContent.map((c) => ({
          wordId: c.wordId,
          word: c.word.word,
          imageUrl: c.mnemonicImageUrl,
          updatedAt: c.updatedAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------
// GET /pending - 이미지 생성 대기 단어 목록
// ---------------------------------------------

/**
 * @swagger
 * /admin/images/pending:
 *   get:
 *     summary: 이미지 생성 대기 단어 목록
 *     tags: [Image Generation]
 *     security:
 *       - bearerAuth: []
 */
router.get('/pending', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const words = await prisma.word.findMany({
      where: {
        content: {
          OR: [
            { mnemonicImageUrl: null },
            { mnemonicImageUrl: '' },
          ],
          mnemonicEnglish: { not: null },
        },
      },
      include: {
        content: {
          select: {
            mnemonicEnglish: true,
            mnemonicKorean: true,
          },
        },
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.word.count({
      where: {
        content: {
          OR: [
            { mnemonicImageUrl: null },
            { mnemonicImageUrl: '' },
          ],
          mnemonicEnglish: { not: null },
        },
      },
    });

    res.json({
      success: true,
      data: {
        words: words.map((w) => ({
          id: w.id,
          word: w.word,
          mnemonic: w.content?.mnemonicEnglish,
          mnemonicKorean: w.content?.mnemonicKorean,
        })),
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + words.length < total,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------
// DELETE /:wordId - 단어 이미지 삭제
// ---------------------------------------------

/**
 * @swagger
 * /admin/images/{wordId}:
 *   delete:
 *     summary: 단어의 이미지 삭제
 *     tags: [Image Generation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: wordId
 *         required: true
 *         schema:
 *           type: string
 */
router.delete('/:wordId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { wordId } = req.params;

    const content = await prisma.content.findUnique({
      where: { wordId },
    });

    if (!content) {
      res.status(404).json({
        success: false,
        error: 'Word content not found',
      });
      return;
    }

    // TODO: Delete from Cloudinary if needed

    // Clear image URL in database
    await prisma.content.update({
      where: { wordId },
      data: { mnemonicImageUrl: null },
    });

    res.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
