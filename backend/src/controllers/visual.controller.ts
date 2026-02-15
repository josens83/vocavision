/**
 * Visual Controller - Word Visual 3-Image System API
 * CONCEPT, MNEMONIC, RHYME 이미지 관리
 */

import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

// Visual type enum (matches Prisma schema)
type VisualType = 'CONCEPT' | 'MNEMONIC' | 'RHYME';

// Visual type validation
const VALID_VISUAL_TYPES: VisualType[] = ['CONCEPT', 'MNEMONIC', 'RHYME'];

/**
 * GET /admin/words/:wordId/visuals
 * 단어의 시각화 이미지 목록 조회
 */
export const getWordVisuals = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { wordId } = req.params;

    const visuals = await prisma.wordVisual.findMany({
      where: { wordId },
      orderBy: { order: 'asc' },
    });

    res.json({ visuals });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /admin/words/:wordId/visuals
 * 단어의 시각화 이미지 일괄 업데이트 (upsert)
 */
export const updateWordVisuals = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { wordId } = req.params;
    const { visuals } = req.body;

    if (!Array.isArray(visuals)) {
      return res.status(400).json({ error: 'visuals must be an array' });
    }

    // Validate word exists
    const word = await prisma.word.findUnique({ where: { id: wordId } });
    if (!word) {
      return res.status(404).json({ error: 'Word not found' });
    }

    // Upsert each visual
    const results = await Promise.all(
      visuals.map(async (visual: {
        type: VisualType;
        labelEn?: string;
        labelKo?: string;
        captionEn?: string;
        captionKo?: string;
        imageUrl?: string;
        promptEn?: string;
        order?: number;
      }) => {
        if (!VALID_VISUAL_TYPES.includes(visual.type)) {
          throw new Error(`Invalid visual type: ${visual.type}`);
        }

        return prisma.wordVisual.upsert({
          where: {
            wordId_type: {
              wordId,
              type: visual.type,
            },
          },
          update: {
            labelEn: visual.labelEn,
            labelKo: visual.labelKo,
            captionEn: visual.captionEn,
            captionKo: visual.captionKo,
            imageUrl: visual.imageUrl,
            promptEn: visual.promptEn,
            order: visual.order ?? VALID_VISUAL_TYPES.indexOf(visual.type),
          },
          create: {
            wordId,
            type: visual.type,
            labelEn: visual.labelEn,
            labelKo: visual.labelKo,
            captionEn: visual.captionEn,
            captionKo: visual.captionKo,
            imageUrl: visual.imageUrl,
            promptEn: visual.promptEn,
            order: visual.order ?? VALID_VISUAL_TYPES.indexOf(visual.type),
          },
        });
      })
    );

    res.json({ visuals: results });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /admin/words/:wordId/visuals/:type
 * 특정 타입의 시각화 이미지 삭제
 */
export const deleteWordVisual = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { wordId, type } = req.params;

    if (!VALID_VISUAL_TYPES.includes(type as VisualType)) {
      return res.status(400).json({ error: `Invalid visual type: ${type}` });
    }

    await prisma.wordVisual.delete({
      where: {
        wordId_type: {
          wordId,
          type: type as VisualType,
        },
      },
    });

    res.json({ success: true });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Visual not found' });
    }
    next(error);
  }
};
