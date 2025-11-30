import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  generateWordContent,
  saveGeneratedContent,
  generateBatchContent,
  processGenerationJob,
  GenerationOptions,
} from '../services/contentGenerator.service';
import logger from '../utils/logger';

// ============================================
// Generate Content for a Single Word
// ============================================

export const generateContent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { word, examCategory = 'CSAT', cefrLevel = 'B1', saveToDb = false } = req.body;

    if (!word || typeof word !== 'string') {
      throw new AppError('Word is required', 400);
    }

    const options: GenerationOptions = {
      word: word.trim().toLowerCase(),
      examCategory,
      cefrLevel,
    };

    logger.info(`Generating content for word: ${options.word}`);

    const content = await generateWordContent(options);

    let wordId: string | undefined;

    // Optionally save to database
    if (saveToDb) {
      // Check if word exists
      let existingWord = await prisma.word.findFirst({
        where: { word: options.word },
      });

      if (!existingWord) {
        // Create new word - cast partOfSpeech to valid enum value
        const posString = content.definitions[0]?.partOfSpeech?.toUpperCase() || 'NOUN';
        const validPOS = ['NOUN', 'VERB', 'ADJECTIVE', 'ADVERB', 'PRONOUN', 'PREPOSITION', 'CONJUNCTION', 'INTERJECTION'];
        const partOfSpeech = validPOS.includes(posString) ? posString : 'NOUN';

        existingWord = await prisma.word.create({
          data: {
            word: options.word,
            definition: content.definitions[0]?.definitionEn || '',
            definitionKo: content.definitions[0]?.definitionKo || '',
            partOfSpeech: partOfSpeech as any,
            examCategory,
            cefrLevel,
            status: 'DRAFT',
          },
        });
      }

      wordId = existingWord.id;
      await saveGeneratedContent(existingWord.id, content);
    }

    res.json({
      success: true,
      word: options.word,
      content,
      wordId,
    });
  } catch (error) {
    logger.error('Content generation failed:', error);
    next(error);
  }
};

// ============================================
// Create Batch Generation Job
// ============================================

export const createBatchJob = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { words, examCategory = 'CSAT', cefrLevel = 'B1' } = req.body;

    if (!Array.isArray(words) || words.length === 0) {
      throw new AppError('Words array is required', 400);
    }

    if (words.length > 100) {
      throw new AppError('Maximum 100 words per batch', 400);
    }

    // Create job record
    const job = await prisma.contentGenerationJob.create({
      data: {
        inputWords: words.map((w: string) => w.trim().toLowerCase()),
        examCategory,
        cefrLevel,
        status: 'pending',
        progress: 0,
        requestedById: req.userId,
      },
    });

    // Start processing in background (non-blocking)
    processGenerationJob(job.id).catch((error) => {
      logger.error(`Background job ${job.id} failed:`, error);
    });

    res.status(201).json({
      success: true,
      jobId: job.id,
      message: `Batch job created for ${words.length} words`,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// Get Job Status
// ============================================

export const getJobStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { jobId } = req.params;

    const job = await prisma.contentGenerationJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new AppError('Job not found', 404);
    }

    res.json({
      success: true,
      job: {
        id: job.id,
        inputWords: job.inputWords,
        status: job.status,
        progress: job.progress,
        result: job.result,
        errorMessage: job.errorMessage,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// List All Jobs
// ============================================

export const listJobs = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, limit = '20', offset = '0' } = req.query;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [jobs, total] = await Promise.all([
      prisma.contentGenerationJob.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
        select: {
          id: true,
          inputWords: true,
          status: true,
          progress: true,
          errorMessage: true,
          createdAt: true,
          startedAt: true,
          completedAt: true,
        },
      }),
      prisma.contentGenerationJob.count({ where }),
    ]);

    res.json({
      success: true,
      jobs,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// Review Content (Approve/Reject)
// ============================================

export const reviewContent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { wordId } = req.params;
    const { action, fields, reason } = req.body;

    if (!['approve', 'reject', 'edit'].includes(action)) {
      throw new AppError('Invalid action. Use: approve, reject, or edit', 400);
    }

    const word = await prisma.word.findUnique({
      where: { id: wordId },
    });

    if (!word) {
      throw new AppError('Word not found', 404);
    }

    let newStatus: string;
    const updateData: any = {
      humanReviewed: true,
      reviewedAt: new Date(),
      reviewedBy: req.userId,
    };

    switch (action) {
      case 'approve':
        newStatus = 'APPROVED';
        updateData.status = 'APPROVED';
        break;
      case 'reject':
        newStatus = 'DRAFT';
        updateData.status = 'DRAFT';
        break;
      case 'edit':
        newStatus = 'PENDING_REVIEW';
        updateData.status = 'PENDING_REVIEW';
        if (fields) {
          Object.assign(updateData, fields);
        }
        break;
      default:
        newStatus = word.status || 'DRAFT';
    }

    await prisma.word.update({
      where: { id: wordId },
      data: updateData,
    });

    // Create audit log
    await prisma.contentAuditLog.create({
      data: {
        entityType: 'Word',
        entityId: wordId,
        action: action.toUpperCase(),
        previousData: { status: word.status },
        newData: { status: newStatus },
        changedFields: ['status'],
        performedById: req.userId,
      },
    });

    res.json({
      success: true,
      wordId,
      newStatus,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// Publish Content
// ============================================

export const publishContent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { wordId } = req.params;

    const word = await prisma.word.findUnique({
      where: { id: wordId },
    });

    if (!word) {
      throw new AppError('Word not found', 404);
    }

    if (word.status !== 'APPROVED') {
      throw new AppError('Only approved content can be published', 400);
    }

    await prisma.word.update({
      where: { id: wordId },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });

    // Create audit log
    await prisma.contentAuditLog.create({
      data: {
        entityType: 'Word',
        entityId: wordId,
        action: 'PUBLISH',
        previousData: { status: 'APPROVED' },
        newData: { status: 'PUBLISHED' },
        changedFields: ['status', 'publishedAt'],
        performedById: req.userId,
      },
    });

    res.json({
      success: true,
      wordId,
      newStatus: 'PUBLISHED',
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// Get Content Audit History
// ============================================

export const getAuditHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { wordId } = req.params;
    const { limit = '50' } = req.query;

    const logs = await prisma.contentAuditLog.findMany({
      where: {
        entityType: 'Word',
        entityId: wordId,
      },
      orderBy: { performedAt: 'desc' },
      take: parseInt(limit as string),
    });

    res.json({
      success: true,
      wordId,
      logs,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// Get Pending Review Content
// ============================================

export const getPendingReview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { limit = '20', offset = '0' } = req.query;

    const [words, total] = await Promise.all([
      prisma.word.findMany({
        where: {
          status: {
            in: ['DRAFT', 'PENDING_REVIEW'],
          },
        },
        include: {
          etymology: true,
          mnemonics: { take: 1 },
          examples: { take: 3 },
        },
        orderBy: { aiGeneratedAt: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      }),
      prisma.word.count({
        where: {
          status: {
            in: ['DRAFT', 'PENDING_REVIEW'],
          },
        },
      }),
    ]);

    res.json({
      success: true,
      words,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  } catch (error) {
    next(error);
  }
};
