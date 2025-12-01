/**
 * VocaVision Admin Controller
 * 관리자 대시보드 API 컨트롤러
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../lib/prisma';

// ============================================
// Dashboard Stats
// ============================================

export const getDashboardStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get word counts by status
    const [
      totalWords,
      draftWords,
      pendingReview,
      publishedWords,
      wordsByCategory,
      wordsByLevel,
      hasEtymology,
      hasMnemonic,
      hasExamples,
      hasMedia,
    ] = await Promise.all([
      prisma.word.count(),
      prisma.word.count({ where: { status: 'DRAFT' } }),
      prisma.word.count({ where: { status: 'PENDING_REVIEW' } }),
      prisma.word.count({ where: { status: 'PUBLISHED' } }),
      prisma.word.groupBy({
        by: ['examCategory'],
        _count: { id: true },
      }),
      prisma.word.groupBy({
        by: ['difficulty'],
        _count: { id: true },
      }),
      // Content coverage counts
      prisma.word.count({ where: { etymology: { isNot: null } } }),
      prisma.mnemonic.count(),
      prisma.example.count(),
      prisma.wordImage.count(),
    ]);

    // Convert category counts to Record
    const byExamCategory: Record<string, number> = {};
    for (const c of wordsByCategory) {
      if (c.examCategory) {
        byExamCategory[c.examCategory] = c._count.id;
      }
    }

    // Convert level counts to Record
    const byLevel: Record<string, number> = {};
    for (const l of wordsByLevel) {
      if (l.difficulty) {
        byLevel[l.difficulty] = l._count.id;
      }
    }

    const stats = {
      totalWords,
      draftWords,
      pendingReview,
      publishedWords,
      byExamCategory,
      byLevel,
      contentCoverage: {
        hasEtymology,
        hasMnemonic,
        hasExamples,
        hasMedia,
      },
    };

    res.json({ stats });
  } catch (error) {
    next(error);
  }
};

// ============================================
// Word List with Filters
// ============================================

export const getAdminWords = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      search,
      examCategories,
      levels,
      status,
      hasContent,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = '1',
      limit = '20',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { word: { contains: search as string, mode: 'insensitive' } },
        { definition: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (examCategories) {
      const categories = (examCategories as string).split(',');
      where.examCategory = { in: categories };
    }

    if (levels) {
      const levelList = (levels as string).split(',');
      where.cefrLevel = { in: levelList };
    }

    if (status) {
      const statusList = (status as string).split(',');
      where.status = { in: statusList };
    }

    if (hasContent === 'true') {
      where.examples = { some: {} };
    } else if (hasContent === 'false') {
      where.examples = { none: {} };
    }

    // Get words with pagination
    const [words, total] = await Promise.all([
      prisma.word.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy as string]: sortOrder },
        include: {
          _count: {
            select: {
              examples: true,
              mnemonics: true,
            },
          },
        },
      }),
      prisma.word.count({ where }),
    ]);

    res.json({
      words: words.map((w) => ({
        ...w,
        exampleCount: w._count.examples,
        mnemonicCount: w._count.mnemonics,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// Get Single Word with Full Content
// ============================================

export const getAdminWordById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { wordId } = req.params;

    const word = await prisma.word.findUnique({
      where: { id: wordId },
      include: {
        examples: true,
        mnemonics: true,
        etymology: true,
        synonyms: true,
        antonyms: true,
        collocations: true,
        rhymes: true,
        images: true,
      },
    });

    if (!word) {
      return res.status(404).json({ message: 'Word not found' });
    }

    res.json({ word });
  } catch (error) {
    next(error);
  }
};

// ============================================
// Create Word
// ============================================

export const createAdminWord = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      word,
      definition,
      definitionKo,
      partOfSpeech,
      examCategory,
      cefrLevel,
      difficulty,
      level,
      frequency,
      pronunciation,
      ipaUs,
      ipaUk,
    } = req.body;

    // Check if word already exists
    const existing = await prisma.word.findFirst({
      where: { word: { equals: word, mode: 'insensitive' } },
    });

    if (existing) {
      return res.status(400).json({ message: 'Word already exists' });
    }

    const newWord = await prisma.word.create({
      data: {
        word,
        definition: definition || '',
        definitionKo,
        partOfSpeech: partOfSpeech || 'NOUN',
        examCategory: examCategory || 'CSAT',
        cefrLevel: cefrLevel || 'B1',
        difficulty: difficulty || 'INTERMEDIATE',
        level: level || 'L1',
        frequency: frequency || 100,
        pronunciation,
        ipaUs,
        ipaUk,
        status: 'DRAFT',
      },
    });

    res.status(201).json({ word: newWord });
  } catch (error) {
    next(error);
  }
};

// ============================================
// Update Word
// ============================================

export const updateAdminWord = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { wordId } = req.params;
    const updateData = req.body;

    const word = await prisma.word.update({
      where: { id: wordId },
      data: updateData,
    });

    res.json({ word });
  } catch (error) {
    next(error);
  }
};

// ============================================
// Delete Word
// ============================================

export const deleteAdminWord = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { wordId } = req.params;

    // Delete related content first
    await prisma.$transaction([
      prisma.example.deleteMany({ where: { wordId } }),
      prisma.mnemonic.deleteMany({ where: { wordId } }),
      prisma.etymology.deleteMany({ where: { wordId } }),
      prisma.synonym.deleteMany({ where: { wordId } }),
      prisma.antonym.deleteMany({ where: { wordId } }),
      prisma.collocation.deleteMany({ where: { wordId } }),
      prisma.rhyme.deleteMany({ where: { wordId } }),
      prisma.wordImage.deleteMany({ where: { wordId } }),
      prisma.word.delete({ where: { id: wordId } }),
    ]);

    res.json({ message: 'Word deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ============================================
// Batch Create Words
// ============================================

export const batchCreateWords = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { words, examCategory, level, generateContent } = req.body;

    if (!Array.isArray(words) || words.length === 0) {
      return res.status(400).json({ message: 'Words array is required' });
    }

    const results = {
      created: 0,
      failed: [] as string[],
    };

    for (const wordText of words) {
      try {
        // Check if word already exists
        const existing = await prisma.word.findFirst({
          where: { word: { equals: wordText, mode: 'insensitive' } },
        });

        if (existing) {
          results.failed.push(wordText);
          continue;
        }

        await prisma.word.create({
          data: {
            word: wordText,
            definition: '',
            partOfSpeech: 'NOUN',
            examCategory: examCategory || 'CSAT',
            cefrLevel: level || 'B1',
            difficulty: 'INTERMEDIATE',
            level: 'L1',
            frequency: 100,
            status: 'DRAFT',
          },
        });

        results.created++;
      } catch {
        results.failed.push(wordText);
      }
    }

    res.json(results);
  } catch (error) {
    next(error);
  }
};

// ============================================
// Bulk Update Word Status (Approve/Publish)
// ============================================

export const bulkUpdateStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { wordIds, status } = req.body;

    if (!Array.isArray(wordIds) || wordIds.length === 0) {
      return res.status(400).json({ message: 'Word IDs array is required' });
    }

    if (!['DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const result = await prisma.word.updateMany({
      where: { id: { in: wordIds } },
      data: { status },
    });

    res.json({
      updated: result.count,
      message: `${result.count} words updated to ${status}`,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// Update Word Content (for Claude Max import)
// ============================================

export const updateWordContent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { wordId } = req.params;
    const content = req.body;

    // Verify word exists
    const existingWord = await prisma.word.findUnique({
      where: { id: wordId },
    });

    if (!existingWord) {
      return res.status(404).json({ message: 'Word not found' });
    }

    // Update word fields
    const wordUpdate: any = {};
    if (content.ipaUs !== undefined) wordUpdate.ipaUs = content.ipaUs;
    if (content.ipaUk !== undefined) wordUpdate.ipaUk = content.ipaUk;
    if (content.pronunciation !== undefined) wordUpdate.pronunciation = content.pronunciation;
    if (content.prefix !== undefined) wordUpdate.prefix = content.prefix;
    if (content.root !== undefined) wordUpdate.root = content.root;
    if (content.suffix !== undefined) wordUpdate.suffix = content.suffix;
    if (content.morphologyNote !== undefined) wordUpdate.morphologyNote = content.morphologyNote;
    if (content.synonyms !== undefined) wordUpdate.synonymList = content.synonyms;
    if (content.antonyms !== undefined) wordUpdate.antonymList = content.antonyms;
    if (content.rhymingWords !== undefined) wordUpdate.rhymingWords = content.rhymingWords;

    // Start transaction
    await prisma.$transaction(async (tx) => {
      // Update word fields
      if (Object.keys(wordUpdate).length > 0) {
        await tx.word.update({
          where: { id: wordId },
          data: wordUpdate,
        });
      }

      // Update Etymology
      if (content.etymology) {
        await tx.etymology.upsert({
          where: { wordId },
          create: {
            wordId,
            origin: content.etymology,
            language: content.etymologyLang || null,
            evolution: content.etymology,
            rootWords: [],
            relatedWords: [],
          },
          update: {
            origin: content.etymology,
            language: content.etymologyLang || null,
            evolution: content.etymology,
          },
        });
      }

      // Update Mnemonic
      if (content.mnemonic) {
        // Delete existing and create new
        await tx.mnemonic.deleteMany({ where: { wordId } });
        await tx.mnemonic.create({
          data: {
            wordId,
            title: 'Primary Mnemonic',
            content: content.mnemonic,
            koreanHint: content.mnemonicKorean || null,
            imageUrl: content.mnemonicImage || null,
          },
        });
      }

      // Update Collocations
      if (content.collocations && Array.isArray(content.collocations)) {
        await tx.collocation.deleteMany({ where: { wordId } });
        for (let i = 0; i < content.collocations.length; i++) {
          const col = content.collocations[i];
          await tx.collocation.create({
            data: {
              wordId,
              phrase: col.phrase,
              translation: col.translation || null,
              order: i,
            },
          });
        }
      }

      // Update Examples (funnyExamples)
      if (content.funnyExamples && Array.isArray(content.funnyExamples)) {
        await tx.example.deleteMany({ where: { wordId } });
        for (let i = 0; i < content.funnyExamples.length; i++) {
          const ex = content.funnyExamples[i];
          await tx.example.create({
            data: {
              wordId,
              sentence: ex.sentenceEn,
              translation: ex.sentenceKo || null,
              isFunny: ex.isFunny || false,
              order: i,
            },
          });
        }
      }

      // Update Definitions (stored in examples with special handling)
      if (content.definitions && Array.isArray(content.definitions)) {
        // Store definition in word table if available
        const firstDef = content.definitions[0];
        if (firstDef) {
          await tx.word.update({
            where: { id: wordId },
            data: {
              definition: firstDef.definitionEn || '',
              definitionKo: firstDef.definitionKo || null,
              partOfSpeech: (firstDef.partOfSpeech?.toUpperCase() as any) || 'NOUN',
            },
          });
        }
      }
    });

    // Fetch updated word with content
    const updatedWord = await prisma.word.findUnique({
      where: { id: wordId },
      include: {
        examples: true,
        mnemonics: true,
        etymology: true,
        collocations: true,
      },
    });

    res.json({
      message: 'Content updated successfully',
      word: updatedWord,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// Get Batch Jobs
// ============================================

export const getBatchJobs = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const jobs = await prisma.contentGenerationJob.findMany({
      orderBy: { id: 'desc' },
      take: 20,
      select: {
        id: true,
        status: true,
        progress: true,
        inputWords: true,
        examCategory: true,
        cefrLevel: true,
        batchId: true,
        errorMessage: true,
      },
    });

    res.json({ jobs });
  } catch (error) {
    next(error);
  }
};
