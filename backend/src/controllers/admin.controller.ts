/**
 * VocaVision Admin Controller
 * 관리자 대시보드 API 컨트롤러
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../lib/prisma';
import logger from '../utils/logger';
import {
  generateAndUploadImage,
  generateConceptPrompt,
  generateMnemonicPrompt,
  generateRhymePrompt,
  VisualType,
  checkImageServiceConfig,
} from '../services/imageGenerator.service';
import {
  generateRhymeCaptions,
  translateMnemonicToEnglish,
  extractMnemonicScene,
  generateRhymeScene,
  generateConceptScene,
} from '../services/smartCaption.service';

// ============================================
// Dashboard Stats
// ============================================

export const getDashboardStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get basic word counts (safe queries only)
    const [
      totalWords,
      draftWords,
      pendingReview,
      publishedWords,
      wordsByCategory,
      wordsByLevel,
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
    ]);

    // Content coverage - query each model separately to handle errors gracefully
    let hasEtymology = 0;
    let hasMnemonic = 0;
    let hasExamples = 0;
    let hasMedia = 0;
    let hasWordVisuals = 0;

    // Query each model independently so one failure doesn't affect others
    try { hasEtymology = await prisma.etymology.count(); } catch { /* Model might not exist */ }
    try { hasMnemonic = await prisma.mnemonic.count(); } catch { /* Model might not exist */ }
    try { hasExamples = await prisma.example.count(); } catch { /* Model might not exist */ }
    try { hasMedia = await prisma.wordImage.count(); } catch { /* Model might not exist */ }
    try { hasWordVisuals = await prisma.wordVisual.count({ where: { imageUrl: { not: null } } }); } catch { /* Model might not exist */ }

    // Total media = WordImage + WordVisual with images
    const totalMedia = hasMedia + hasWordVisuals;

    // Also count words that have at least one visual
    let wordsWithVisuals = 0;
    try {
      wordsWithVisuals = await prisma.word.count({
        where: { visuals: { some: { imageUrl: { not: null } } } }
      });
    } catch { /* Relation might not exist */ }

    // Convert category counts to Record
    const byExamCategory: Record<string, number> = {};
    for (const c of wordsByCategory) {
      if (c.examCategory) {
        byExamCategory[c.examCategory] = c._count.id;
      }
    }

    // Convert level counts to Record (handle null as 'UNKNOWN')
    const byLevel: Record<string, number> = {};
    for (const l of wordsByLevel) {
      const level = l.difficulty || 'UNKNOWN';
      byLevel[level] = l._count.id;
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
        hasMedia: totalMedia, // WordImage + WordVisual combined
        // Additional media stats for debugging
        wordImageCount: hasMedia,
        wordVisualCount: hasWordVisuals,
        wordsWithVisuals, // Words that have at least one image
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
      let searchQuery = search as string;
      let exactMatch = false;

      // 따옴표로 감싸면 정확히 일치 검색 (예: "sin")
      if (searchQuery.startsWith('"') && searchQuery.endsWith('"') && searchQuery.length > 2) {
        searchQuery = searchQuery.slice(1, -1);
        exactMatch = true;
      }

      if (exactMatch) {
        // 정확히 일치 (단어만)
        where.word = { equals: searchQuery, mode: 'insensitive' };
      } else {
        // 부분 일치 (기존 동작)
        where.OR = [
          { word: { contains: searchQuery, mode: 'insensitive' } },
          { definition: { contains: searchQuery, mode: 'insensitive' } },
        ];
      }
    }

    if (examCategories) {
      const categories = (examCategories as string).split(',');
      // Filter through WordExamLevel mapping table
      where.examLevels = {
        some: {
          examCategory: { in: categories }
        }
      };
    }

    if (levels) {
      const levelList = (levels as string).split(',');
      // Filter through WordExamLevel mapping table
      if (where.examLevels) {
        // Combine with existing examLevels filter
        where.examLevels.some.level = { in: levelList };
      } else {
        where.examLevels = {
          some: {
            level: { in: levelList }
          }
        };
      }
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
          images: { take: 1 },
          mnemonics: { take: 1 },
          etymology: true,
          examLevels: true, // Include exam-level mappings
        },
      }),
      prisma.word.count({ where }),
    ]);

    // Map DB level (L1, L2, L3) to frontend DifficultyLevel (BEGINNER, INTERMEDIATE, ADVANCED)
    const dbLevelToFrontend: Record<string, string> = {
      L1: 'BEGINNER',
      L2: 'INTERMEDIATE',
      L3: 'ADVANCED',
    };

    // Transform words to match frontend VocaWord type
    const transformedWords = words.map((w) => {
      // Check if word has AI-generated content
      const hasContent = w.aiGeneratedAt !== null ||
                         (w.definition && w.definition !== '') ||
                         w.ipaUs !== null ||
                         w._count.mnemonics > 0 ||
                         w.etymology !== null ||
                         w._count.examples > 0;

      // Build exam categories from examLevels table (or fallback to single examCategory)
      const examCategoriesFromMappings = w.examLevels?.map((el) => el.examCategory) || [];
      const allExamCategories = examCategoriesFromMappings.length > 0
        ? [...new Set(examCategoriesFromMappings)]
        : (w.examCategory ? [w.examCategory] : []);

      return {
        id: w.id,
        word: w.word,
        partOfSpeech: w.partOfSpeech,
        frequency: w.frequency,
        // Transform exam levels to array for frontend compatibility
        examCategories: allExamCategories,
        // Map DB level (L1, L2, L3) to frontend (BEGINNER, INTERMEDIATE, ADVANCED)
        level: dbLevelToFrontend[w.level || 'L1'] || 'BEGINNER',
        topics: w.tags || [],
        status: w.status,
        isActive: w.isActive,
        createdAt: w.createdAt.toISOString(),
        updatedAt: w.updatedAt.toISOString(),
        publishedAt: w.publishedAt?.toISOString(),
        // Build content summary for frontend
        content: hasContent ? {
          id: w.id,
          humanReviewed: w.humanReviewed,
          aiGeneratedAt: w.aiGeneratedAt?.toISOString(),
          primaryGifUrl: w.images?.[0]?.imageUrl || null,
        } : null,
        // Additional fields for admin
        exampleCount: w._count.examples,
        mnemonicCount: w._count.mnemonics,
        // Keep original fields for reference
        difficulty: w.difficulty,
        cefrLevel: w.cefrLevel,
        examCategory: w.examCategory,
        wordLevel: w.level, // L1, L2, L3
        // Detailed exam-level mappings
        examLevels: w.examLevels?.map((el) => ({
          examCategory: el.examCategory,
          level: el.level,
          displayLevel: el.level ? (dbLevelToFrontend[el.level] || 'BEGINNER') : null,
        })) || [],
      };
    });

    res.json({
      words: transformedWords,
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

    // Check if word has AI-generated content (definition, pronunciation, etc.)
    const hasContent = word.aiGeneratedAt !== null ||
                       word.definition !== '' ||
                       word.ipaUs !== null ||
                       word.mnemonics?.length > 0 ||
                       word.etymology !== null;

    // Build content object for frontend
    const content = hasContent ? {
      id: word.id,
      wordId: word.id,

      // Pronunciation
      ipaUs: word.ipaUs,
      ipaUk: word.ipaUk,
      pronunciation: word.pronunciation,

      // Etymology
      etymology: word.etymology?.origin,
      etymologyLang: word.etymology?.language,

      // Morphology
      prefix: word.prefix,
      root: word.root,
      suffix: word.suffix,
      morphologyNote: word.morphologyNote,

      // Related words
      synonymList: word.synonymList || [],
      antonymList: word.antonymList || [],
      relatedWords: word.relatedWords || [],

      // Collocations
      collocations: word.collocations?.map(c => ({
        id: c.id,
        phrase: c.phrase,
        translation: c.translation,
        example: c.exampleEn,
      })) || [],

      // Rhyming
      rhymingWords: word.rhymingWords || [],

      // Mnemonic
      mnemonic: word.mnemonics?.[0]?.content,
      mnemonicImage: word.mnemonics?.[0]?.imageUrl,

      // Examples
      examples: word.examples?.map(e => ({
        id: e.id,
        sentence: e.sentence,
        translation: e.translation,
        source: e.source,
      })) || [],

      // Definitions
      definitions: [{
        partOfSpeech: word.partOfSpeech,
        definitionEn: word.definition,
        definitionKo: word.definitionKo,
      }],

      // AI metadata
      humanReviewed: word.humanReviewed || false,
      aiGeneratedAt: word.aiGeneratedAt?.toISOString(),
    } : null;

    res.json({
      word: {
        ...word,
        content,
      }
    });
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
// Batch Create Words (with Content Reuse)
// ============================================

export const batchCreateWords = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { words, examCategory, level } = req.body;

    if (!Array.isArray(words) || words.length === 0) {
      return res.status(400).json({ message: 'Words array is required' });
    }

    // Normalize all words to lowercase
    const normalizedWords = words.map((w: string) => w.toLowerCase().trim());
    const exam = examCategory || 'CSAT';
    const wordLevel = level || 'L1';

    // Map level to difficulty for backward compatibility
    const levelToDifficulty: Record<string, 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'> = {
      L1: 'BASIC',
      L2: 'INTERMEDIATE',
      L3: 'ADVANCED',
    };
    const difficulty = levelToDifficulty[wordLevel] || 'INTERMEDIATE';

    // Get all existing words with their exam mappings
    const existingWords = await prisma.word.findMany({
      where: {
        word: { in: normalizedWords },
      },
      select: {
        id: true,
        word: true,
        aiGeneratedAt: true,
        examLevels: {
          select: { examCategory: true, level: true }
        }
      },
    });

    const existingMap = new Map<string, typeof existingWords[number]>(
      existingWords.map((w) => [w.word.toLowerCase(), w])
    );

    // Separate words into: new (create), existing-same-exam (skip), existing-different-exam (add mapping)
    const newWordTexts: string[] = [];
    const mappingsToAdd: { wordId: string; word: string; hasContent: boolean }[] = [];
    const alreadyMapped: string[] = [];

    for (const wordText of normalizedWords) {
      const existing = existingMap.get(wordText);

      if (!existing) {
        // Word doesn't exist - will create new
        newWordTexts.push(wordText);
      } else {
        // Word exists - check if it already has this exam mapping
        const hasExamMapping = existing.examLevels.some(
          (el) => el.examCategory === exam
        );

        if (hasExamMapping) {
          // Already has this exam mapping - skip
          alreadyMapped.push(wordText);
        } else {
          // Exists but needs new exam mapping
          mappingsToAdd.push({
            wordId: existing.id,
            word: wordText,
            hasContent: existing.aiGeneratedAt !== null,
          });
        }
      }
    }

    // Create new words
    if (newWordTexts.length > 0) {
      await prisma.word.createMany({
        data: newWordTexts.map((wordText) => ({
          word: wordText,
          definition: '',
          partOfSpeech: 'NOUN' as const,
          examCategory: exam,
          difficulty: difficulty,
          level: wordLevel,
          frequency: 100,
          status: 'DRAFT' as const,
        })),
        skipDuplicates: true,
      });

      // Get the newly created words to add exam mappings
      const newlyCreated = await prisma.word.findMany({
        where: { word: { in: newWordTexts } },
        select: { id: true, word: true },
      });

      // Create WordExamLevel mappings for new words
      if (newlyCreated.length > 0) {
        await prisma.wordExamLevel.createMany({
          data: newlyCreated.map((w) => ({
            wordId: w.id,
            examCategory: exam,
            level: wordLevel,
            frequency: 0,
          })),
          skipDuplicates: true,
        });
      }
    }

    // Add exam mappings for existing words
    if (mappingsToAdd.length > 0) {
      await prisma.wordExamLevel.createMany({
        data: mappingsToAdd.map((m) => ({
          wordId: m.wordId,
          examCategory: exam,
          level: wordLevel,
          frequency: 0,
        })),
        skipDuplicates: true,
      });
    }

    // Count words that need content generation (no aiGeneratedAt)
    const wordsNeedingContent = newWordTexts.length +
      mappingsToAdd.filter((m) => !m.hasContent).length;
    const wordsWithContent = mappingsToAdd.filter((m) => m.hasContent).length;

    res.json({
      created: newWordTexts.length,
      mappingAdded: mappingsToAdd.length,
      alreadyMapped: alreadyMapped.length,
      needsContentGeneration: wordsNeedingContent,
      hasExistingContent: wordsWithContent,
      details: {
        newWords: newWordTexts,
        reusedWords: mappingsToAdd.map((m) => m.word),
        skippedWords: alreadyMapped,
      },
    });
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

// ============================================
// Image Generation Jobs
// ============================================

/**
 * Background job processor for image generation
 * This runs asynchronously in Railway's long-running server
 */
async function processImageGenerationJob(
  jobId: string,
  wordIds: string[],
  types: VisualType[],
  skipExisting: boolean = true
) {
  logger.info('[ImageJob] ========== STARTING JOB ==========', { jobId, wordCount: wordIds.length, skipExisting });

  try {
    // Check configuration
    const config = checkImageServiceConfig();
    if (!config.stabilityConfigured || !config.storageConfigured) {
      logger.error('[ImageJob] Service not configured:', config);
      await prisma.contentGenerationJob.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          errorMessage: 'Image service not configured',
          completedAt: new Date(),
        },
      });
      return;
    }

    // Initialize job result tracking
    const jobResult = {
      totalWords: wordIds.length,
      processedWords: 0,
      currentWord: null as string | null,
      currentType: null as string | null,
      results: [] as Array<{
        wordId: string;
        word: string;
        success: boolean;
        imagesGenerated: number;
        error?: string;
      }>,
    };

    // Update job to processing
    await prisma.contentGenerationJob.update({
      where: { id: jobId },
      data: {
        status: 'processing',
        startedAt: new Date(),
        progress: 0,
        result: jobResult,
      },
    });

    // Process each word
    for (let i = 0; i < wordIds.length; i++) {
      const wordId = wordIds[i];
      logger.info(`[ImageJob] Processing word ${i + 1}/${wordIds.length}:`, wordId);

      try {
        // Fetch word data with mnemonics relation
        const word = await prisma.word.findUnique({
          where: { id: wordId },
          include: {
            mnemonics: {
              take: 1,
              orderBy: { rating: 'desc' },
            },
          },
        });

        if (!word) {
          logger.error('[ImageJob] Word not found:', wordId);
          jobResult.results.push({
            wordId,
            word: 'Unknown',
            success: false,
            imagesGenerated: 0,
            error: 'Word not found',
          });
          continue;
        }

        logger.info('[ImageJob] Processing word:', word.word);
        jobResult.currentWord = word.word;

        // Check for existing visuals if skipExisting is true
        let typesToGenerate = types;
        if (skipExisting) {
          const existingVisuals = await prisma.wordVisual.findMany({
            where: { wordId },
            select: { type: true },
          });
          const existingTypes = new Set(existingVisuals.map((v) => v.type));

          typesToGenerate = types.filter((t) => !existingTypes.has(t));

          logger.info('[ImageJob] Skip check for', word.word, ':', {
            existingTypes: Array.from(existingTypes),
            typesToGenerate,
          });

          if (typesToGenerate.length === 0) {
            logger.info('[ImageJob] Skipping word (all images exist):', word.word);
            jobResult.results.push({
              wordId: word.id,
              word: word.word,
              success: true,
              imagesGenerated: 0,
              skipped: true,
              message: '기존 이미지 있음 - 스킵',
            } as any);

            jobResult.processedWords = i + 1;
            await prisma.contentGenerationJob.update({
              where: { id: jobId },
              data: {
                progress: Math.round(((i + 1) / wordIds.length) * 100),
                result: jobResult,
              },
            });
            continue;
          }
        }

        // Get word data from actual fields
        const definitionEn = word.definition;
        const definitionKo = word.definitionKo;
        const firstMnemonic = word.mnemonics?.[0];
        const mnemonic = firstMnemonic?.content;
        const mnemonicKorean = firstMnemonic?.koreanHint;
        const rhymingWords = word.rhymingWords;

        // Generate images for each type
        const generatedVisuals: Array<{
          type: string;
          imageUrl: string;
          captionKo: string;
          captionEn: string;
          promptEn: string;
        }> = [];

        for (const type of typesToGenerate) {
          logger.info('[ImageJob] Generating type:', type, 'for', word.word);
          jobResult.currentType = type;

          await prisma.contentGenerationJob.update({
            where: { id: jobId },
            data: { result: jobResult },
          });

          try {
            let prompt: string;
            let captionKo: string;
            let captionEn: string;

            switch (type) {
              case 'CONCEPT':
                prompt = generateConceptPrompt(definitionEn, word.word);
                captionKo = definitionKo || `${word.word}의 의미`;
                captionEn = definitionEn || `The meaning of ${word.word}`;
                break;
              case 'MNEMONIC': {
                logger.info('[ImageJob] MNEMONIC data:', {
                  word: word.word,
                  hasMnemonic: !!mnemonic,
                  mnemonicLength: mnemonic?.length || 0,
                  mnemonicPreview: mnemonic?.substring(0, 100),
                  hasMnemonicKorean: !!mnemonicKorean,
                  mnemonicKoreanPreview: mnemonicKorean?.substring(0, 100),
                });

                // Use Claude API to extract concrete scene from mnemonic
                if (mnemonic && process.env.ANTHROPIC_API_KEY) {
                  try {
                    const sceneData = await extractMnemonicScene(
                      word.word,
                      definitionEn || '',
                      mnemonic,
                      mnemonicKorean || ''
                    );

                    prompt = sceneData.prompt;
                    captionKo = sceneData.captionKo;
                    captionEn = sceneData.captionEn;

                    logger.info('[ImageJob] MNEMONIC scene extracted:', {
                      captionKo,
                      promptPreview: prompt.substring(0, 150),
                    });
                  } catch (error) {
                    logger.error('[ImageJob] MNEMONIC scene extraction failed:', error);
                    // Fallback to basic prompt
                    prompt = generateMnemonicPrompt(mnemonic, word.word);
                    captionKo = mnemonicKorean || mnemonic || `${word.word} 연상법`;
                    captionEn = await translateMnemonicToEnglish(word.word, captionKo);
                  }
                } else {
                  // No mnemonic or no API key - use basic prompt
                  prompt = generateMnemonicPrompt(mnemonic || word.word, word.word);
                  captionKo = mnemonicKorean || mnemonic || `${word.word} 연상법`;
                  captionEn = `Memory tip for ${word.word}`;
                }

                logger.info('[ImageJob] MNEMONIC final:', { captionKo, captionEn });
                break;
              }
              case 'RHYME': {
                const rhymes = rhymingWords || [];
                logger.info('[ImageJob] RHYME data:', {
                  word: word.word,
                  rhymingWordsCount: rhymes.length,
                  rhymingWords: rhymes.slice(0, 5),
                });

                // Use Claude API to generate scene + captions together
                if (rhymes.length > 0 && process.env.ANTHROPIC_API_KEY) {
                  try {
                    const sceneData = await generateRhymeScene(
                      word.word,
                      definitionEn || '',
                      rhymes
                    );

                    prompt = sceneData.prompt;
                    captionKo = sceneData.captionKo;
                    captionEn = sceneData.captionEn;

                    logger.info('[ImageJob] RHYME scene generated:', {
                      captionKo,
                      captionEn,
                      promptPreview: prompt.substring(0, 150),
                    });
                  } catch (error) {
                    logger.error('[ImageJob] RHYME scene generation failed:', error);
                    // Fallback to basic prompt + captions
                    prompt = generateRhymePrompt(definitionEn || word.word, word.word);
                    const captions = await generateRhymeCaptions(word.word, definitionEn || '', rhymes);
                    captionKo = captions.captionKo;
                    captionEn = captions.captionEn;
                  }
                } else {
                  // No rhymes or no API key - use basic prompt
                  prompt = generateRhymePrompt(definitionEn || word.word, word.word);
                  captionKo = definitionKo || '';
                  captionEn = definitionEn || '';
                }

                logger.info('[ImageJob] RHYME final:', { captionKo, captionEn });
                break;
              }
            }

            // Generate and upload image
            const result = await generateAndUploadImage(prompt, type, word.word);

            if (result) {
              generatedVisuals.push({
                type,
                imageUrl: result.imageUrl,
                captionKo,
                captionEn,
                promptEn: prompt,
              });
              logger.info('[ImageJob] Generated:', type, 'for', word.word);
            }

            // Rate limit delay (2 seconds between images)
            await new Promise((r) => setTimeout(r, 2000));
          } catch (error) {
            logger.error('[ImageJob] Error generating', type, 'for', word.word, ':', error);
          }
        }

        // Save visuals to database
        if (generatedVisuals.length > 0) {
          // Check if WordVisual model exists and save
          try {
            for (const visual of generatedVisuals) {
              await prisma.wordVisual.upsert({
                where: {
                  wordId_type: {
                    wordId: word.id,
                    type: visual.type as any,
                  },
                },
                update: {
                  imageUrl: visual.imageUrl,
                  captionKo: visual.captionKo,
                  captionEn: visual.captionEn,
                  promptEn: visual.promptEn,
                },
                create: {
                  wordId: word.id,
                  type: visual.type as any,
                  imageUrl: visual.imageUrl,
                  captionKo: visual.captionKo,
                  captionEn: visual.captionEn,
                  promptEn: visual.promptEn,
                },
              });
            }
            logger.info('[ImageJob] Saved', generatedVisuals.length, 'visuals for', word.word);
          } catch (saveError) {
            logger.error('[ImageJob] Error saving visuals:', saveError);
          }
        }

        jobResult.results.push({
          wordId: word.id,
          word: word.word,
          success: generatedVisuals.length > 0,
          imagesGenerated: generatedVisuals.length,
        });
      } catch (wordError) {
        logger.error('[ImageJob] Error processing word:', wordId, wordError);
        jobResult.results.push({
          wordId,
          word: 'Unknown',
          success: false,
          imagesGenerated: 0,
          error: wordError instanceof Error ? wordError.message : 'Unknown error',
        });
      }

      // Update progress
      jobResult.processedWords++;
      const progress = Math.round((jobResult.processedWords / jobResult.totalWords) * 100);
      await prisma.contentGenerationJob.update({
        where: { id: jobId },
        data: { progress, result: jobResult },
      });
    }

    // Mark job as completed
    jobResult.currentWord = null;
    jobResult.currentType = null;

    await prisma.contentGenerationJob.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        progress: 100,
        completedAt: new Date(),
        result: jobResult,
      },
    });

    logger.info('[ImageJob] ========== JOB COMPLETED ==========', {
      jobId,
      totalProcessed: jobResult.processedWords,
      successful: jobResult.results.filter((r) => r.success).length,
    });
  } catch (error) {
    logger.error('[ImageJob] Fatal error:', error);
    await prisma.contentGenerationJob.update({
      where: { id: jobId },
      data: {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date(),
      },
    });
  }
}

/**
 * Create a new image generation job
 */
export const createImageGenJob = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      wordIds,
      types = ['CONCEPT', 'MNEMONIC', 'RHYME'],
      skipExisting = true  // Skip words that already have images
    } = req.body;

    logger.info('[ImageJob] Creating job for', wordIds?.length, 'words', { skipExisting });

    if (!wordIds || !Array.isArray(wordIds) || wordIds.length === 0) {
      return res.status(400).json({ message: 'wordIds array is required' });
    }

    if (wordIds.length > 50) {
      return res.status(400).json({ message: 'Maximum 50 words per batch' });
    }

    // Check configuration
    const config = checkImageServiceConfig();
    logger.info('[ImageJob] Service config:', config);

    if (!config.stabilityConfigured) {
      return res.status(500).json({ message: 'Stability AI not configured. Set STABILITY_API_KEY.' });
    }

    if (!config.storageConfigured) {
      return res.status(500).json({ message: 'Storage not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.' });
    }

    // Create job in database
    const job = await prisma.contentGenerationJob.create({
      data: {
        batchId: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        inputWords: wordIds,
        generateFields: types,
        status: 'pending',
        progress: 0,
        result: {
          totalWords: wordIds.length,
          processedWords: 0,
          currentWord: null,
          currentType: null,
          results: [],
          skipExisting,
        },
      },
    });

    logger.info('[ImageJob] Job created:', job.id);

    // Estimate time (roughly 10 seconds per image, 3 images per word)
    const estimatedMinutes = Math.ceil((wordIds.length * types.length * 10) / 60);

    // Start background processing (Railway server stays alive!)
    processImageGenerationJob(job.id, wordIds, types, skipExisting).catch((err) => {
      logger.error('[ImageJob] Background processing error:', err);
    });

    res.json({
      success: true,
      data: {
        jobId: job.id,
        batchId: job.batchId,
        totalWords: wordIds.length,
        estimatedTime: `약 ${estimatedMinutes}분`,
      },
    });
  } catch (error) {
    logger.error('[ImageJob] Error creating job:', error);
    next(error);
  }
};

/**
 * Get image generation job status
 */
export const getImageGenJob = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { jobId } = req.params;

    const job = await prisma.contentGenerationJob.findFirst({
      where: {
        OR: [{ id: jobId }, { batchId: jobId }],
      },
    });

    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    const result = job.result as any;

    res.json({
      success: true,
      data: {
        id: job.id,
        batchId: job.batchId,
        status: job.status,
        progress: job.progress,
        totalWords: result?.totalWords || job.inputWords.length,
        processedWords: result?.processedWords || 0,
        currentWord: result?.currentWord,
        currentType: result?.currentType,
        results: result?.results || [],
        error: job.errorMessage,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update image generation job (for external updates if needed)
 */
export const updateImageGenJob = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { jobId } = req.params;
    const { status, progress, result: resultUpdate, error } = req.body;

    const job = await prisma.contentGenerationJob.findFirst({
      where: {
        OR: [{ id: jobId }, { batchId: jobId }],
      },
    });

    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    const updateData: any = {};

    if (status !== undefined) {
      updateData.status = status;
      if (status === 'processing' && !job.startedAt) {
        updateData.startedAt = new Date();
      }
      if (status === 'completed' || status === 'failed') {
        updateData.completedAt = new Date();
      }
    }

    if (progress !== undefined) updateData.progress = progress;
    if (resultUpdate !== undefined) updateData.result = { ...(job.result as any), ...resultUpdate };
    if (error !== undefined) updateData.errorMessage = error;

    const updated = await prisma.contentGenerationJob.update({
      where: { id: job.id },
      data: updateData,
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// ============================================
// Collection (단어장) Management
// ============================================

export const getAdminCollections = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const collections = await prisma.collection.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Get word count for each collection
    const collectionsWithCounts = collections.map((col) => ({
      ...col,
      wordCount: col.wordIds?.length || 0,
    }));

    res.json({ collections: collectionsWithCounts });
  } catch (error) {
    next(error);
  }
};

export const getAdminCollectionById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { collectionId } = req.params;

    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    // Get words in this collection
    const words = collection.wordIds?.length
      ? await prisma.word.findMany({
          where: { id: { in: collection.wordIds } },
          select: {
            id: true,
            word: true,
            definition: true,
            definitionKo: true,
            examCategory: true,
            level: true,
            difficulty: true,
            status: true,
          },
        })
      : [];

    res.json({
      ...collection,
      words,
      wordCount: words.length,
    });
  } catch (error) {
    next(error);
  }
};

export const createAdminCollection = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, slug, description, icon, category, difficulty, isPublic, wordIds } = req.body;

    if (!name || !category || !difficulty) {
      return res.status(400).json({
        message: 'Name, category, and difficulty are required',
      });
    }

    // Auto-generate slug if not provided
    const finalSlug = slug || name
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);

    const collection = await prisma.collection.create({
      data: {
        name,
        slug: finalSlug,
        description: description || null,
        icon: icon || null,
        category,
        difficulty,
        isPublic: isPublic ?? true,
        wordIds: wordIds || [],
      },
    });

    res.status(201).json({ collection });
  } catch (error) {
    next(error);
  }
};

export const updateAdminCollection = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { collectionId } = req.params;
    const { name, slug, description, icon, category, difficulty, isPublic, wordIds } = req.body;

    const existing = await prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    const collection = await prisma.collection.update({
      where: { id: collectionId },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
        ...(category !== undefined && { category }),
        ...(difficulty !== undefined && { difficulty }),
        ...(isPublic !== undefined && { isPublic }),
        ...(wordIds !== undefined && { wordIds }),
      },
    });

    res.json({ collection });
  } catch (error) {
    next(error);
  }
};

export const deleteAdminCollection = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { collectionId } = req.params;

    const existing = await prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    await prisma.collection.delete({
      where: { id: collectionId },
    });

    res.json({ message: 'Collection deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const addWordsToCollection = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { collectionId } = req.params;
    const { wordIds } = req.body;

    if (!Array.isArray(wordIds) || wordIds.length === 0) {
      return res.status(400).json({ message: 'wordIds array is required' });
    }

    const existing = await prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    // Merge existing wordIds with new ones (avoid duplicates)
    const existingWordIds = existing.wordIds || [];
    const newWordIds = [...new Set([...existingWordIds, ...wordIds])];

    const collection = await prisma.collection.update({
      where: { id: collectionId },
      data: { wordIds: newWordIds },
    });

    res.json({
      collection,
      added: wordIds.length,
      total: newWordIds.length,
    });
  } catch (error) {
    next(error);
  }
};

export const removeWordsFromCollection = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { collectionId } = req.params;
    const { wordIds } = req.body;

    if (!Array.isArray(wordIds) || wordIds.length === 0) {
      return res.status(400).json({ message: 'wordIds array is required' });
    }

    const existing = await prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    // Remove specified wordIds
    const existingWordIds = existing.wordIds || [];
    const newWordIds = existingWordIds.filter((id) => !wordIds.includes(id));

    const collection = await prisma.collection.update({
      where: { id: collectionId },
      data: { wordIds: newWordIds },
    });

    res.json({
      collection,
      removed: wordIds.length,
      total: newWordIds.length,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// Audit Log (변경 이력) Management
// ============================================

export const getWordAuditLogs = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { wordId } = req.params;
    const limit = parseInt(req.query.limit as string, 10) || 5;

    // Get audit logs for this word
    const logs = await prisma.contentAuditLog.findMany({
      where: {
        entityType: 'Word',
        entityId: wordId,
      },
      orderBy: { performedAt: 'desc' },
      take: limit,
    });

    res.json({ logs });
  } catch (error) {
    next(error);
  }
};

// ============================================
// Word Visuals API
// ============================================

/**
 * Get visuals for a specific word
 */
export const getWordVisuals = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { wordId } = req.params;

    const visuals = await prisma.wordVisual.findMany({
      where: { wordId },
      orderBy: { type: 'asc' },
    });

    res.json({ visuals });
  } catch (error) {
    next(error);
  }
};

/**
 * Update word visuals (CONCEPT, MNEMONIC, RHYME)
 * PUT /admin/words/:wordId/visuals
 *
 * Accepts either:
 * 1. Array format: { visuals: [{ type: "CONCEPT", imageUrl: "...", ... }] }
 * 2. Object format: { concept: { imageUrl: "...", ... }, mnemonic: { ... } }
 */
export const updateWordVisuals = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { wordId } = req.params;
    const requestData = req.body;

    // Verify word exists
    const word = await prisma.word.findUnique({
      where: { id: wordId },
    });

    if (!word) {
      return res.status(404).json({ error: 'Word not found' });
    }

    const updatedVisuals: any[] = [];

    // Handle array format: { visuals: [{ type: "CONCEPT", ... }] }
    if (requestData.visuals && Array.isArray(requestData.visuals)) {
      for (const visualData of requestData.visuals) {
        if (!visualData.type) continue;

        const type = visualData.type.toUpperCase() as 'CONCEPT' | 'MNEMONIC' | 'RHYME';
        if (!['CONCEPT', 'MNEMONIC', 'RHYME'].includes(type)) continue;

        const visual = await prisma.wordVisual.upsert({
          where: {
            wordId_type: { wordId, type },
          },
          update: {
            imageUrl: visualData.imageUrl,
            captionKo: visualData.captionKo,
            captionEn: visualData.captionEn,
            promptEn: visualData.promptEn,
            labelKo: visualData.labelKo,
            labelEn: visualData.labelEn,
          },
          create: {
            wordId,
            type,
            imageUrl: visualData.imageUrl,
            captionKo: visualData.captionKo,
            captionEn: visualData.captionEn,
            promptEn: visualData.promptEn,
            labelEn: visualData.labelEn || (type === 'CONCEPT' ? 'Concept' : type === 'MNEMONIC' ? 'Mnemonic' : 'Rhyme'),
            labelKo: visualData.labelKo || (type === 'CONCEPT' ? '의미' : type === 'MNEMONIC' ? '연상' : '라이밍'),
            order: type === 'CONCEPT' ? 0 : type === 'MNEMONIC' ? 1 : 2,
          },
        });
        updatedVisuals.push(visual);
      }
    } else {
      // Handle object format: { concept: { ... }, mnemonic: { ... } }
      for (const type of ['CONCEPT', 'MNEMONIC', 'RHYME'] as const) {
        const typeData = requestData[type.toLowerCase()];
        if (!typeData) continue;

        const visual = await prisma.wordVisual.upsert({
          where: {
            wordId_type: { wordId, type },
          },
          update: {
            imageUrl: typeData.imageUrl,
            captionKo: typeData.captionKo,
            captionEn: typeData.captionEn,
            promptEn: typeData.promptEn,
          },
          create: {
            wordId,
            type,
            imageUrl: typeData.imageUrl,
            captionKo: typeData.captionKo,
            captionEn: typeData.captionEn,
            promptEn: typeData.promptEn,
            labelEn: type === 'CONCEPT' ? 'Concept' : type === 'MNEMONIC' ? 'Mnemonic' : 'Rhyme',
            labelKo: type === 'CONCEPT' ? '의미' : type === 'MNEMONIC' ? '연상' : '라이밍',
            order: type === 'CONCEPT' ? 0 : type === 'MNEMONIC' ? 1 : 2,
          },
        });
        updatedVisuals.push(visual);
      }
    }

    // Create audit log
    await createAuditLog(
      'WORD_VISUAL',
      wordId,
      'UPDATE',
      null,
      requestData,
      Object.keys(requestData)
    );

    res.json({
      success: true,
      visuals: updatedVisuals,
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to create audit log entry
export const createAuditLog = async (
  entityType: string,
  entityId: string,
  action: string,
  previousData?: any,
  newData?: any,
  changedFields?: string[],
  performedById?: string
) => {
  try {
    await prisma.contentAuditLog.create({
      data: {
        entityType,
        entityId,
        action,
        previousData: previousData || null,
        newData: newData || null,
        changedFields: changedFields || [],
        performedById: performedById || null,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};

// ============================================
// Image Generation Management API
// ============================================

// In-memory job tracking for image generation batches
const imageGenJobs: Map<string, {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  totalWords: number;
  processedWords: number;
  currentWord?: string;
  successCount: number;
  errorCount: number;
  startedAt: string;
  errors: Array<{ word: string; error: string }>;
}> = new Map();

/**
 * Get image generation status by level
 * GET /admin/image-generation/status?examCategory=TEPS
 * Supports both examCategory and examType query params for backwards compatibility
 */
export const getImageGenerationStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Support both examCategory and examType for backwards compatibility
    const examCategory = (req.query.examCategory as string) || (req.query.examType as string) || 'CSAT';

    // Get words by level with image counts using WordExamLevel mapping
    const levels = ['L1', 'L2', 'L3'];
    const levelStats = await Promise.all(
      levels.map(async (level) => {
        // Count total words for this exam category and level using WordExamLevel
        const totalWords = await prisma.word.count({
          where: {
            status: { in: ['PUBLISHED', 'PENDING_REVIEW'] },
            examLevels: {
              some: {
                examCategory: examCategory as any,
                level: level,
              },
            },
          },
        });

        // Count words with at least one image
        const withImages = await prisma.word.count({
          where: {
            status: { in: ['PUBLISHED', 'PENDING_REVIEW'] },
            examLevels: {
              some: {
                examCategory: examCategory as any,
                level: level,
              },
            },
            visuals: { some: { imageUrl: { not: null } } },
          },
        });

        const withoutImages = totalWords - withImages;
        const coverage = totalWords > 0 ? (withImages / totalWords) * 100 : 0;

        return {
          level,
          totalWords,
          withImages,
          withoutImages,
          coverage,
        };
      })
    );

    // Calculate totals
    const totalWords = levelStats.reduce((sum, l) => sum + l.totalWords, 0);
    const totalWithImages = levelStats.reduce((sum, l) => sum + l.withImages, 0);
    const totalWithoutImages = levelStats.reduce((sum, l) => sum + l.withoutImages, 0);
    const overallCoverage = totalWords > 0 ? (totalWithImages / totalWords) * 100 : 0;

    res.json({
      success: true,
      data: {
        examType: examCategory,
        examCategory,
        levels: levelStats,
        totalWords,
        totalWithImages,
        totalWithoutImages,
        overallCoverage,
      },
    });
  } catch (error) {
    logger.error('[Admin/ImageGen] Status error:', error);
    next(error);
  }
};

/**
 * Start batch image generation
 * POST /admin/image-generation/batch
 * Supports both examCategory and examType body params for backwards compatibility
 */
export const startImageBatchGeneration = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Support both examCategory and examType for backwards compatibility
    const examCategory = req.body.examCategory || req.body.examType || 'CSAT';
    const { level, limit = 100 } = req.body;

    if (!level || !['L1', 'L2', 'L3'].includes(level)) {
      return res.status(400).json({
        success: false,
        error: 'Valid level (L1, L2, L3) is required',
      });
    }

    const batchLimit = Math.min(Math.max(1, limit), 1100);

    // Find words that need images using WordExamLevel mapping
    const wordsToProcess = await prisma.word.findMany({
      where: {
        status: { in: ['PUBLISHED', 'PENDING_REVIEW'] },
        aiGeneratedAt: { not: null },
        examLevels: {
          some: {
            examCategory: examCategory as any,
            level: level,
          },
        },
        // Exclude words that already have all 3 image types
        NOT: {
          AND: [
            { visuals: { some: { type: 'CONCEPT' } } },
            { visuals: { some: { type: 'MNEMONIC' } } },
            { visuals: { some: { type: 'RHYME' } } },
          ],
        },
      },
      select: {
        id: true,
        word: true,
        definition: true,
        definitionKo: true,
        visuals: { select: { type: true } },
        mnemonics: { take: 1, orderBy: { rating: 'desc' } },
        rhymingWords: true,
      },
      orderBy: { frequency: 'desc' },
      take: batchLimit,
    });

    if (wordsToProcess.length === 0) {
      return res.json({
        success: true,
        data: {
          jobId: null,
          message: 'No words need image generation for this level',
        },
      });
    }

    // Create job ID
    const jobId = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Initialize job tracking
    imageGenJobs.set(jobId, {
      id: jobId,
      status: 'pending',
      totalWords: wordsToProcess.length,
      processedWords: 0,
      successCount: 0,
      errorCount: 0,
      startedAt: new Date().toISOString(),
      errors: [],
    });

    // Start processing in background
    processImageBatch(jobId, wordsToProcess);

    logger.info(`[Admin/ImageGen] Started batch job ${jobId} for ${wordsToProcess.length} words`);

    res.json({
      success: true,
      data: {
        jobId,
        message: `Started image generation for ${wordsToProcess.length} words`,
        totalWords: wordsToProcess.length,
      },
    });
  } catch (error) {
    logger.error('[Admin/ImageGen] Batch start error:', error);
    next(error);
  }
};

/**
 * Get image generation job status
 * GET /admin/image-generation/job/:jobId
 */
export const getImageGenerationJobStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { jobId } = req.params;

    const job = imageGenJobs.get(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    res.json({
      success: true,
      data: job,
    });
  } catch (error) {
    logger.error('[Admin/ImageGen] Job status error:', error);
    next(error);
  }
};

/**
 * Stop image generation job
 * POST /admin/image-generation/stop/:jobId
 */
export const stopImageGeneration = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { jobId } = req.params;

    const job = imageGenJobs.get(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    if (job.status !== 'processing' && job.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: `Job is already ${job.status}`,
      });
    }

    // Set status to failed - the processing loop checks for 'processing' status and will stop
    job.status = 'failed';
    job.currentWord = undefined;
    job.errors.push({ word: 'SYSTEM', error: 'Job cancelled by user' });

    logger.info(`[Admin/ImageGen] Job ${jobId} cancelled by user. Processed: ${job.processedWords}/${job.totalWords}`);

    res.json({
      success: true,
      data: {
        jobId,
        message: 'Job cancelled successfully',
        newStatus: job.status,
        processedWords: job.processedWords,
        totalWords: job.totalWords,
        successCount: job.successCount,
        errorCount: job.errorCount,
      },
    });
  } catch (error) {
    logger.error('[Admin/ImageGen] Stop job error:', error);
    next(error);
  }
};

// Background process for image batch generation
async function processImageBatch(
  jobId: string,
  words: Array<{
    id: string;
    word: string;
    definition: string | null;
    definitionKo: string | null;
    visuals: Array<{ type: string }>;
    mnemonics: Array<{ content: string; koreanHint: string | null }>;
    rhymingWords: any;
  }>
) {
  const job = imageGenJobs.get(jobId);
  if (!job) return;

  job.status = 'processing';

  const visualTypes: VisualType[] = ['CONCEPT', 'MNEMONIC', 'RHYME'];

  for (const word of words) {
    // Check if job was cancelled (status changed externally)
    if (job.status !== 'processing') break;

    job.currentWord = word.word;
    const existingTypes = new Set(word.visuals.map(v => v.type));

    for (const visualType of visualTypes) {
      // Skip if already has this type
      if (existingTypes.has(visualType)) continue;

      try {
        let prompt: string;
        let captionKo: string;
        let captionEn: string;

        if (visualType === 'CONCEPT') {
          prompt = generateConceptPrompt(word.definition || '', word.word);
          captionKo = word.definitionKo || word.definition || '';
          captionEn = word.definition || '';
        } else if (visualType === 'MNEMONIC') {
          const mnemonic = word.mnemonics?.[0];
          if (mnemonic?.content) {
            const scene = await extractMnemonicScene(
              word.word,
              word.definition || '',
              mnemonic.content,
              mnemonic.koreanHint || ''
            );
            prompt = scene.prompt;
            captionKo = scene.captionKo;
            captionEn = scene.captionEn;
          } else {
            prompt = generateMnemonicPrompt(word.word, word.word);
            captionKo = word.definitionKo || '';
            captionEn = `Memory tip for ${word.word}`;
          }
        } else {
          // RHYME
          const rhymingWords = (word.rhymingWords || []) as string[];
          if (rhymingWords.length > 0) {
            const rhymeScene = await generateRhymeScene(
              word.word,
              word.definition || '',
              rhymingWords
            );
            prompt = rhymeScene.prompt;
            captionKo = rhymeScene.captionKo;
            captionEn = rhymeScene.captionEn;
          } else {
            prompt = generateRhymePrompt(word.definition || '', word.word);
            captionKo = `${word.word} 발음 연습`;
            captionEn = `Pronunciation practice for ${word.word}`;
          }
        }

        // Generate and upload image
        const result = await generateAndUploadImage(prompt, visualType, word.word);

        if (result) {
          // Use upsert to avoid unique constraint errors if visual already exists
          await prisma.wordVisual.upsert({
            where: {
              wordId_type: {
                wordId: word.id,
                type: visualType,
              },
            },
            update: {
              imageUrl: result.imageUrl,
              promptEn: prompt,
              captionKo,
              captionEn,
            },
            create: {
              wordId: word.id,
              type: visualType,
              imageUrl: result.imageUrl,
              promptEn: prompt,
              captionKo,
              captionEn,
            },
          });
          job.successCount++;
        }

        // Delay between images to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 5000));

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        job.errors.push({ word: word.word, error: `${visualType}: ${errorMsg}` });
        job.errorCount++;
        logger.error(`[Admin/ImageGen] Error generating ${visualType} for "${word.word}":`, error);

        // Continue despite errors
        await new Promise(resolve => setTimeout(resolve, 8000));
      }
    }

    job.processedWords++;
  }

  job.status = 'completed';
  job.currentWord = undefined;
  logger.info(`[Admin/ImageGen] Job ${jobId} completed. Success: ${job.successCount}, Errors: ${job.errorCount}`);
}

// ============================================
// Image Management - Missing Images & Regeneration
// ============================================

/**
 * Get words with missing images
 * GET /admin/words/missing-images
 */
export const getWordsMissingImages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      examCategory,
      imageType,
      page = '1',
      limit = '20',
      search,
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 100);

    // Determine which image types to check
    const imageTypes: VisualType[] = imageType
      ? [imageType as VisualType]
      : ['CONCEPT', 'MNEMONIC', 'RHYME'];

    // Build where clause - only get words missing at least one image type
    const whereClause: any = {
      status: { in: ['PUBLISHED', 'PENDING_REVIEW'] },
      aiGeneratedAt: { not: null },
      // Filter for words that DON'T have all required image types
      OR: imageTypes.map((type) => ({
        visuals: {
          none: { type },
        },
      })),
    };

    // Filter by exam category using WordExamLevel
    if (examCategory) {
      whereClause.examLevels = {
        some: {
          examCategory: examCategory as any,
        },
      };
    }

    // Search by word
    if (search) {
      whereClause.word = {
        contains: search as string,
        mode: 'insensitive',
      };
    }

    // Get total count FIRST (of words with missing images)
    const totalWords = await prisma.word.count({
      where: whereClause,
    });

    // Then get paginated words
    const skip = (pageNum - 1) * limitNum;
    const words = await prisma.word.findMany({
      where: whereClause,
      include: {
        visuals: {
          select: { type: true, imageUrl: true, captionKo: true, captionEn: true },
        },
        examLevels: {
          select: { examCategory: true, level: true },
        },
      },
      orderBy: { frequency: 'desc' },
      skip,
      take: limitNum,
    });

    // Map words with their missing types
    const wordsWithMissingImages = words.map((word) => {
      const existingTypes = new Set(word.visuals.map((v) => v.type));
      const missingTypes = imageTypes.filter((t) => !existingTypes.has(t));

      return {
        id: word.id,
        word: word.word,
        definition: word.definition,
        definitionKo: word.definitionKo,
        examLevels: word.examLevels,
        visuals: word.visuals,
        missingTypes,
      };
    });

    res.json({
      success: true,
      data: {
        words: wordsWithMissingImages,
        pagination: {
          total: totalWords,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalWords / limitNum),
        },
        filters: {
          examCategory: examCategory || undefined,
          imageType: imageType || undefined,
          search: search || undefined,
        },
      },
    });
  } catch (error) {
    logger.error('[Admin/MissingImages] Error:', error);
    next(error);
  }
};

/**
 * Regenerate a single image for a word
 * POST /admin/words/:wordId/regenerate-image
 */
export const regenerateWordImage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { wordId } = req.params;
    const { imageType, customPrompt } = req.body;

    if (!imageType || !['CONCEPT', 'MNEMONIC', 'RHYME'].includes(imageType)) {
      return res.status(400).json({
        success: false,
        error: 'Valid imageType (CONCEPT, MNEMONIC, RHYME) is required',
      });
    }

    // Get the word with related data
    const word = await prisma.word.findUnique({
      where: { id: wordId },
      include: {
        mnemonics: { take: 1, orderBy: { rating: 'desc' } },
      },
    });

    if (!word) {
      return res.status(404).json({
        success: false,
        error: 'Word not found',
      });
    }

    // Generate prompt based on type
    let prompt: string;
    let captionKo: string;
    let captionEn: string;

    if (customPrompt) {
      prompt = customPrompt;
      captionKo = word.definitionKo || '';
      captionEn = word.definition || '';
    } else if (imageType === 'CONCEPT') {
      prompt = generateConceptPrompt(word.definition || '', word.word);
      captionKo = word.definitionKo || word.definition || '';
      captionEn = word.definition || '';
    } else if (imageType === 'MNEMONIC') {
      const firstMnemonic = word.mnemonics?.[0];
      if (firstMnemonic?.content) {
        const sceneResult = await extractMnemonicScene(
          word.word,
          word.definition || '',
          firstMnemonic.content,
          firstMnemonic.koreanHint || ''
        );
        prompt = sceneResult.prompt;
        captionKo = sceneResult.captionKo;
        captionEn = sceneResult.captionEn;
      } else {
        prompt = generateMnemonicPrompt(word.word, word.word);
        captionKo = word.definitionKo || '';
        captionEn = `Memory tip for ${word.word}`;
      }
    } else {
      // RHYME
      const rhymingWords = (word.rhymingWords || []) as string[];
      if (rhymingWords.length > 0) {
        const rhymeResult = await generateRhymeScene(
          word.word,
          word.definition || '',
          rhymingWords
        );
        prompt = rhymeResult.prompt;
        captionKo = rhymeResult.captionKo;
        captionEn = rhymeResult.captionEn;
      } else {
        prompt = generateRhymePrompt(word.definition || '', word.word);
        captionKo = `${word.word} 발음 연습`;
        captionEn = `Pronunciation practice for ${word.word}`;
      }
    }

    logger.info(`[Admin/RegenerateImage] Generating ${imageType} for "${word.word}"`);

    // Generate the image
    const result = await generateAndUploadImage(prompt, imageType as VisualType, word.word);

    if (!result) {
      return res.status(500).json({
        success: false,
        error: 'Image generation failed',
      });
    }

    // Upsert the visual
    const visual = await prisma.wordVisual.upsert({
      where: {
        wordId_type: {
          wordId: word.id,
          type: imageType as VisualType,
        },
      },
      update: {
        imageUrl: result.imageUrl,
        promptEn: prompt,
        captionKo,
        captionEn,
      },
      create: {
        wordId: word.id,
        type: imageType as VisualType,
        imageUrl: result.imageUrl,
        promptEn: prompt,
        captionKo,
        captionEn,
      },
    });

    logger.info(`[Admin/RegenerateImage] Successfully generated ${imageType} for "${word.word}"`);

    res.json({
      success: true,
      data: {
        visual: {
          type: visual.type,
          imageUrl: visual.imageUrl,
          prompt,
          captionKo: visual.captionKo,
          captionEn: visual.captionEn,
        },
      },
    });
  } catch (error) {
    logger.error('[Admin/RegenerateImage] Error:', error);

    // Return descriptive error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    // Check for specific error types
    if (errorMessage.includes('STABILITY_API_KEY')) {
      return res.status(503).json({
        success: false,
        error: 'Image generation service not configured (missing API key)',
      });
    }

    if (errorMessage.includes('Supabase')) {
      return res.status(503).json({
        success: false,
        error: 'Image storage service not configured',
      });
    }

    if (errorMessage.includes('Stability AI error')) {
      return res.status(502).json({
        success: false,
        error: `Image generation API error: ${errorMessage}`,
      });
    }

    return res.status(500).json({
      success: false,
      error: `Image generation failed: ${errorMessage}`,
    });
  }
};

/**
 * Upload an image directly for a word
 * POST /admin/words/:wordId/upload-image
 */
export const uploadWordImage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { wordId } = req.params;
    const { imageType, imageBase64, captionKo, captionEn } = req.body;

    if (!imageType || !['CONCEPT', 'MNEMONIC', 'RHYME'].includes(imageType)) {
      return res.status(400).json({
        success: false,
        error: 'Valid imageType (CONCEPT, MNEMONIC, RHYME) is required',
      });
    }

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        error: 'imageBase64 is required',
      });
    }

    // Get the word
    const word = await prisma.word.findUnique({
      where: { id: wordId },
    });

    if (!word) {
      return res.status(404).json({
        success: false,
        error: 'Word not found',
      });
    }

    // Upload to Supabase Storage
    const { uploadToSupabase } = await import('../services/imageGenerator.service');
    const uploadResult = await uploadToSupabase(imageBase64, word.word, imageType);

    // Upsert the visual
    const visual = await prisma.wordVisual.upsert({
      where: {
        wordId_type: {
          wordId: word.id,
          type: imageType as VisualType,
        },
      },
      update: {
        imageUrl: uploadResult.url,
        captionKo: captionKo || null,
        captionEn: captionEn || null,
        promptEn: 'Manually uploaded',
      },
      create: {
        wordId: word.id,
        type: imageType as VisualType,
        imageUrl: uploadResult.url,
        captionKo: captionKo || null,
        captionEn: captionEn || null,
        promptEn: 'Manually uploaded',
      },
    });

    logger.info(`[Admin/UploadImage] Successfully uploaded ${imageType} for "${word.word}"`);

    res.json({
      success: true,
      data: {
        visual: {
          type: visual.type,
          imageUrl: visual.imageUrl,
          captionKo: visual.captionKo,
          captionEn: visual.captionEn,
        },
      },
    });
  } catch (error) {
    logger.error('[Admin/UploadImage] Error:', error);
    next(error);
  }
};

/**
 * Delete an image for a word
 * DELETE /admin/words/:wordId/images/:imageType
 */
export const deleteWordImage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { wordId, imageType } = req.params;

    if (!['CONCEPT', 'MNEMONIC', 'RHYME'].includes(imageType.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: 'Valid imageType (CONCEPT, MNEMONIC, RHYME) is required',
      });
    }

    // Delete the visual
    const deleted = await prisma.wordVisual.deleteMany({
      where: {
        wordId,
        type: imageType.toUpperCase() as VisualType,
      },
    });

    if (deleted.count === 0) {
      return res.status(404).json({
        success: false,
        error: 'Image not found',
      });
    }

    logger.info(`[Admin/DeleteImage] Deleted ${imageType} for word ${wordId}`);

    res.json({
      success: true,
      message: `${imageType} image deleted successfully`,
    });
  } catch (error) {
    logger.error('[Admin/DeleteImage] Error:', error);
    next(error);
  }
};

/**
 * Batch regenerate images for multiple words
 * POST /admin/words/batch-regenerate-images
 */
export const batchRegenerateImages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { wordIds, imageTypes = ['CONCEPT', 'MNEMONIC', 'RHYME'] } = req.body;

    if (!wordIds || !Array.isArray(wordIds) || wordIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'wordIds array is required',
      });
    }

    if (wordIds.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 50 words per batch',
      });
    }

    // Create a job ID for tracking
    const jobId = `batch-img-${Date.now()}`;

    // Initialize job tracking
    imageGenJobs.set(jobId, {
      id: jobId,
      status: 'processing',
      totalWords: wordIds.length,
      processedWords: 0,
      successCount: 0,
      errorCount: 0,
      startedAt: new Date().toISOString(),
      errors: [],
    });

    // Start processing in background
    processBatchImageRegeneration(jobId, wordIds, imageTypes);

    res.json({
      success: true,
      data: {
        jobId,
        message: `Started regenerating images for ${wordIds.length} words`,
        totalWords: wordIds.length,
        imageTypes,
      },
    });
  } catch (error) {
    logger.error('[Admin/BatchRegenerate] Error:', error);
    next(error);
  }
};

// Helper function for batch image regeneration
async function processBatchImageRegeneration(
  jobId: string,
  wordIds: string[],
  imageTypes: string[]
): Promise<void> {
  const job = imageGenJobs.get(jobId);
  if (!job) return;

  for (const wordId of wordIds) {
    if (job.status !== 'processing') break;

    const word = await prisma.word.findUnique({
      where: { id: wordId },
      include: {
        mnemonics: { take: 1, orderBy: { rating: 'desc' } },
        visuals: { select: { type: true } },
      },
    });

    if (!word) {
      job.errors.push({ word: wordId, error: 'Word not found' });
      job.errorCount++;
      job.processedWords++;
      continue;
    }

    job.currentWord = word.word;

    for (const imageType of imageTypes) {
      try {
        // Skip if image already exists
        const existingTypes = new Set(word.visuals.map((v) => v.type));
        if (existingTypes.has(imageType as VisualType)) {
          continue;
        }

        let prompt: string;
        let captionKo: string;
        let captionEn: string;

        if (imageType === 'CONCEPT') {
          prompt = generateConceptPrompt(word.definition || '', word.word);
          captionKo = word.definitionKo || word.definition || '';
          captionEn = word.definition || '';
        } else if (imageType === 'MNEMONIC') {
          const firstMnemonic = word.mnemonics?.[0];
          if (firstMnemonic?.content) {
            const sceneResult = await extractMnemonicScene(
              word.word,
              word.definition || '',
              firstMnemonic.content,
              firstMnemonic.koreanHint || ''
            );
            prompt = sceneResult.prompt;
            captionKo = sceneResult.captionKo;
            captionEn = sceneResult.captionEn;
          } else {
            prompt = generateMnemonicPrompt(word.word, word.word);
            captionKo = word.definitionKo || '';
            captionEn = `Memory tip for ${word.word}`;
          }
        } else {
          // RHYME
          const rhymingWords = (word.rhymingWords || []) as string[];
          if (rhymingWords.length > 0) {
            const rhymeResult = await generateRhymeScene(
              word.word,
              word.definition || '',
              rhymingWords
            );
            prompt = rhymeResult.prompt;
            captionKo = rhymeResult.captionKo;
            captionEn = rhymeResult.captionEn;
          } else {
            prompt = generateRhymePrompt(word.definition || '', word.word);
            captionKo = `${word.word} 발음 연습`;
            captionEn = `Pronunciation practice for ${word.word}`;
          }
        }

        const result = await generateAndUploadImage(prompt, imageType as VisualType, word.word);

        if (result) {
          await prisma.wordVisual.upsert({
            where: {
              wordId_type: {
                wordId: word.id,
                type: imageType as VisualType,
              },
            },
            update: {
              imageUrl: result.imageUrl,
              promptEn: prompt,
              captionKo,
              captionEn,
            },
            create: {
              wordId: word.id,
              type: imageType as VisualType,
              imageUrl: result.imageUrl,
              promptEn: prompt,
              captionKo,
              captionEn,
            },
          });
          job.successCount++;
        }

        // Delay between images
        await new Promise((resolve) => setTimeout(resolve, 5000));
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        job.errors.push({ word: word.word, error: `${imageType}: ${errorMsg}` });
        job.errorCount++;
        logger.error(`[Admin/BatchRegen] Error generating ${imageType} for "${word.word}":`, error);

        await new Promise((resolve) => setTimeout(resolve, 8000));
      }
    }

    job.processedWords++;
  }

  job.status = 'completed';
  job.currentWord = undefined;
  logger.info(`[Admin/BatchRegen] Job ${jobId} completed. Success: ${job.successCount}, Errors: ${job.errorCount}`);
}

// ============================================
// Cloudinary → Supabase Migration
// ============================================

// Migration session state (in-memory)
let cloudinaryMigrationSession: {
  sessionId: string;
  isRunning: boolean;
  processed: number;
  success: number;
  failed: number;
  total: number;
  errors: string[];
  lastProcessedAt: Date | null;
  startedAt: Date | null;
} | null = null;

/**
 * Get Cloudinary migration status
 * GET /admin/migration/cloudinary-status
 */
export const getCloudinaryMigrationStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Count Cloudinary URLs
    const cloudinaryCount = await prisma.wordVisual.count({
      where: { imageUrl: { contains: 'cloudinary' } },
    });

    // Count Supabase URLs
    const supabaseCount = await prisma.wordVisual.count({
      where: { imageUrl: { contains: 'supabase' } },
    });

    // Count by type for Cloudinary
    const cloudinaryByType = await prisma.wordVisual.groupBy({
      by: ['type'],
      where: { imageUrl: { contains: 'cloudinary' } },
      _count: true,
    });

    // Sample URLs
    const samples = await prisma.wordVisual.findMany({
      where: { imageUrl: { contains: 'cloudinary' } },
      select: { imageUrl: true, type: true },
      take: 5,
    });

    res.json({
      totalCloudinaryImages: cloudinaryCount,
      totalSupabaseImages: supabaseCount,
      cloudinaryByType: cloudinaryByType.reduce((acc, item) => {
        acc[item.type] = item._count;
        return acc;
      }, {} as Record<string, number>),
      sampleUrls: samples.map((s) => ({ url: s.imageUrl, type: s.type })),
    });
  } catch (error) {
    logger.error('[Migration] Status error:', error);
    next(error);
  }
};

/**
 * Start Cloudinary to Supabase migration
 * POST /admin/migration/cloudinary-to-supabase
 */
export const startCloudinaryMigration = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { batchSize = 50, startOffset = 0, dryRun = false } = req.body;

    // Check if already running
    if (cloudinaryMigrationSession?.isRunning) {
      return res.status(409).json({
        error: 'Migration already running',
        sessionId: cloudinaryMigrationSession.sessionId,
      });
    }

    // Count total migration targets
    const total = await prisma.wordVisual.count({
      where: { imageUrl: { contains: 'cloudinary' } },
    });

    if (total === 0) {
      return res.json({
        message: 'No Cloudinary images to migrate',
        total: 0,
      });
    }

    // Initialize session
    const sessionId = `migration-${Date.now()}`;
    cloudinaryMigrationSession = {
      sessionId,
      isRunning: true,
      processed: 0,
      success: 0,
      failed: 0,
      total,
      errors: [],
      lastProcessedAt: null,
      startedAt: new Date(),
    };

    // Run migration asynchronously (return response first)
    if (!dryRun) {
      runCloudinaryMigration(batchSize, startOffset).catch((err) => {
        logger.error('[Migration] Fatal error:', err);
        if (cloudinaryMigrationSession) {
          cloudinaryMigrationSession.isRunning = false;
          cloudinaryMigrationSession.errors.push(`Fatal: ${err.message}`);
        }
      });
    }

    res.json({
      sessionId,
      status: dryRun ? 'dry-run' : 'started',
      totalToMigrate: total,
      batchSize,
      startOffset,
      message: dryRun
        ? `Dry run: Would migrate ${total} images`
        : `Migration started for ${total} images`,
    });
  } catch (error) {
    logger.error('[Migration] Start error:', error);
    next(error);
  }
};

/**
 * Get Cloudinary migration progress
 * GET /admin/migration/cloudinary-to-supabase/status
 */
export const getCloudinaryMigrationProgress = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!cloudinaryMigrationSession) {
    return res.json({
      isRunning: false,
      sessionId: null,
      progress: null,
      message: 'No migration session',
    });
  }

  const { processed, success, failed, total, startedAt } = cloudinaryMigrationSession;

  // Calculate estimated time remaining
  let estimatedTimeRemaining = 'calculating...';
  if (startedAt && processed > 0) {
    const elapsed = Date.now() - startedAt.getTime();
    const avgTimePerItem = elapsed / processed;
    const remaining = (total - processed) * avgTimePerItem;
    const minutes = Math.ceil(remaining / 60000);
    estimatedTimeRemaining = `~${minutes} minutes`;
  }

  res.json({
    isRunning: cloudinaryMigrationSession.isRunning,
    sessionId: cloudinaryMigrationSession.sessionId,
    progress: {
      processed,
      success,
      failed,
      total,
      percentage: total > 0 ? Math.round((processed / total) * 100) : 0,
    },
    errors: cloudinaryMigrationSession.errors.slice(-20),
    lastProcessedAt: cloudinaryMigrationSession.lastProcessedAt?.toISOString(),
    startedAt: cloudinaryMigrationSession.startedAt?.toISOString(),
    estimatedTimeRemaining,
  });
};

/**
 * Stop Cloudinary migration
 * POST /admin/migration/cloudinary-to-supabase/stop
 */
export const stopCloudinaryMigration = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!cloudinaryMigrationSession?.isRunning) {
    return res.json({ message: 'No migration running' });
  }

  cloudinaryMigrationSession.isRunning = false;
  res.json({
    message: 'Migration stopped',
    progress: {
      processed: cloudinaryMigrationSession.processed,
      success: cloudinaryMigrationSession.success,
      failed: cloudinaryMigrationSession.failed,
    },
  });
};

/**
 * Internal: Run Cloudinary migration
 */
async function runCloudinaryMigration(batchSize: number, startOffset: number) {
  const { getSupabaseClient } = await import('../lib/supabase');
  const supabase = getSupabaseClient();
  let offset = startOffset;
  const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'word-images';

  logger.info(`[Migration] Starting migration with batchSize=${batchSize}, startOffset=${startOffset}`);

  while (cloudinaryMigrationSession?.isRunning) {
    // Get records with Cloudinary URLs
    const records = await prisma.wordVisual.findMany({
      where: { imageUrl: { contains: 'cloudinary' } },
      include: { word: { select: { word: true } } },
      skip: offset,
      take: batchSize,
    });

    if (records.length === 0) {
      logger.info('[Migration] All records processed');
      break;
    }

    logger.info(`[Migration] Processing batch: ${records.length} records (offset: ${offset})`);

    for (const record of records) {
      if (!cloudinaryMigrationSession.isRunning) break;

      try {
        // Skip if imageUrl is null
        if (!record.imageUrl) {
          throw new Error('Image URL is null');
        }

        // 1. Download image from Cloudinary
        const response = await fetch(record.imageUrl);
        if (!response.ok) {
          throw new Error(`Download failed: ${response.status} ${response.statusText}`);
        }
        const buffer = Buffer.from(await response.arrayBuffer());

        // 2. Generate filename
        const wordName = record.word?.word || 'unknown';
        const sanitizedWord = wordName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const fileName = `${sanitizedWord}-${record.type.toLowerCase()}-${Date.now()}.png`;
        const filePath = `visuals/${fileName}`;

        // 3. Upload to Supabase
        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, buffer, {
            contentType: 'image/png',
            cacheControl: '31536000',
            upsert: true,
          });

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        // 4. Get public URL
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);

        // 5. Update DB
        await prisma.wordVisual.update({
          where: { id: record.id },
          data: { imageUrl: urlData.publicUrl },
        });

        cloudinaryMigrationSession.success++;
        logger.info(`[Migration] ✅ ${wordName} - ${record.type}`);
      } catch (error: any) {
        cloudinaryMigrationSession.failed++;
        const errorMsg = `${record.word?.word || record.id}-${record.type}: ${error.message}`;
        cloudinaryMigrationSession.errors.push(errorMsg);
        logger.error(`[Migration] ❌ ${errorMsg}`);
      }

      cloudinaryMigrationSession.processed++;
      cloudinaryMigrationSession.lastProcessedAt = new Date();

      // Rate limit delay (100ms between images)
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    offset += batchSize;
  }

  if (cloudinaryMigrationSession) {
    cloudinaryMigrationSession.isRunning = false;
    logger.info(
      `[Migration] Completed: ${cloudinaryMigrationSession.success} success, ${cloudinaryMigrationSession.failed} failed`
    );
  }
}

// ============================================
// Concept Image Regeneration by Word Names
// ============================================

/**
 * Regenerate concept images for specific words by name
 * GET /admin/regenerate-concept?words=principle,preliminary,proportion
 */
export const regenerateConceptByWords = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { words } = req.query;

    if (!words || typeof words !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'words query parameter is required (comma-separated word names)',
      });
    }

    const wordNames = words.split(',').map((w) => w.trim().toLowerCase()).filter(Boolean);

    if (wordNames.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid word names provided',
      });
    }

    if (wordNames.length > 20) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 20 words per request',
      });
    }

    // Find words by name (case-insensitive)
    const foundWords = await prisma.word.findMany({
      where: {
        word: {
          in: wordNames,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        word: true,
        definition: true,
        definitionKo: true,
      },
    });

    if (foundWords.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No words found matching the provided names',
        requested: wordNames,
      });
    }

    // Create a job ID for tracking
    const jobId = `concept-regen-${Date.now()}`;

    // Initialize job tracking
    imageGenJobs.set(jobId, {
      id: jobId,
      status: 'processing',
      totalWords: foundWords.length,
      processedWords: 0,
      successCount: 0,
      errorCount: 0,
      startedAt: new Date().toISOString(),
      errors: [],
    });

    // Start processing in background
    processConceptRegeneration(jobId, foundWords);

    const notFound = wordNames.filter(
      (name) => !foundWords.some((w) => w.word.toLowerCase() === name)
    );

    res.json({
      success: true,
      data: {
        jobId,
        message: `Started regenerating concept images for ${foundWords.length} words`,
        words: foundWords.map((w) => w.word),
        notFound: notFound.length > 0 ? notFound : undefined,
      },
    });
  } catch (error) {
    logger.error('[Admin/RegenerateConceptByWords] Error:', error);
    next(error);
  }
};

// Helper function for concept image regeneration
async function processConceptRegeneration(
  jobId: string,
  words: Array<{ id: string; word: string; definition: string | null; definitionKo: string | null }>
): Promise<void> {
  const job = imageGenJobs.get(jobId);
  if (!job) return;

  for (const word of words) {
    if (job.status !== 'processing') break;

    job.currentWord = word.word;

    try {
      const prompt = generateConceptPrompt(word.definition || '', word.word);
      const captionKo = word.definitionKo || word.definition || '';
      const captionEn = word.definition || '';

      logger.info(`[Admin/ConceptRegen] Generating concept image for "${word.word}"...`);

      const result = await generateAndUploadImage(prompt, 'CONCEPT' as VisualType, word.word);

      if (result) {
        await prisma.wordVisual.upsert({
          where: {
            wordId_type: {
              wordId: word.id,
              type: 'CONCEPT',
            },
          },
          update: {
            imageUrl: result.imageUrl,
            promptEn: prompt,
            captionKo,
            captionEn,
          },
          create: {
            wordId: word.id,
            type: 'CONCEPT',
            imageUrl: result.imageUrl,
            promptEn: prompt,
            captionKo,
            captionEn,
          },
        });
        job.successCount++;
        logger.info(`[Admin/ConceptRegen] ✅ "${word.word}" concept image generated`);
      } else {
        job.errors.push({ word: word.word, error: 'Image generation returned null' });
        job.errorCount++;
        logger.warn(`[Admin/ConceptRegen] ⚠️ "${word.word}" returned null result`);
      }

      // Delay between images (2 seconds to respect API rate limits)
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      job.errors.push({ word: word.word, error: errorMsg });
      job.errorCount++;
      logger.error(`[Admin/ConceptRegen] ❌ Error for "${word.word}":`, error);

      // Longer delay after error (5 seconds)
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    job.processedWords++;
  }

  job.status = 'completed';
  job.currentWord = undefined;
  logger.info(`[Admin/ConceptRegen] Job ${jobId} completed. Success: ${job.successCount}, Errors: ${job.errorCount}`);
}

// ============================================
// Bulk Concept Image Generation (by exam/level)
// ============================================

/**
 * Bulk generate concept images for words in a specific exam/level
 * GET /api/admin/generate-concept-bulk
 * Query params: exam, level, start (default 0), limit (default 350), delayMs (default 2000)
 */
export const generateConceptBulk = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      exam,
      level,
      start = '0',
      limit = '350',
      delayMs = '2000',
    } = req.query;

    if (!exam || !level) {
      return res.status(400).json({
        success: false,
        error: 'exam and level query parameters are required',
      });
    }

    const startNum = parseInt(start as string);
    const limitNum = parseInt(limit as string);
    const delayMsNum = parseInt(delayMs as string);

    // Validate params
    if (isNaN(startNum) || startNum < 0) {
      return res.status(400).json({ success: false, error: 'Invalid start parameter' });
    }
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 500) {
      return res.status(400).json({ success: false, error: 'Invalid limit parameter (1-500)' });
    }
    if (isNaN(delayMsNum) || delayMsNum < 500) {
      return res.status(400).json({ success: false, error: 'Invalid delayMs parameter (min 500)' });
    }

    // Create a job ID for tracking
    const jobId = `bulk-concept-${exam}-${level}-${Date.now()}`;

    // Log immediately and respond (don't wait for processing)
    console.log(`[BULK GEN] ========================================`);
    console.log(`[BULK GEN] Starting ${exam} ${level} concept image generation`);
    console.log(`[BULK GEN] Range: ${startNum} to ${startNum + limitNum - 1}`);
    console.log(`[BULK GEN] Job ID: ${jobId}`);
    console.log(`[BULK GEN] ========================================`);

    // Respond immediately
    res.json({
      success: true,
      data: {
        jobId,
        message: `Concept image generation started for ${exam} ${level}`,
        params: {
          exam,
          level,
          start: startNum,
          limit: limitNum,
          delayMs: delayMsNum,
        },
        estimatedTime: `${Math.ceil((limitNum * delayMsNum) / 1000 / 60)} minutes (excluding image generation time)`,
        checkProgress: `Check Railway logs for progress`,
      },
    });

    // Start background processing (after response is sent)
    setImmediate(() => {
      processBulkConceptGeneration(
        jobId,
        exam as string,
        level as string,
        startNum,
        limitNum,
        delayMsNum
      );
    });
  } catch (error) {
    logger.error('[Admin/GenerateConceptBulk] Error:', error);
    next(error);
  }
};

/**
 * Background processor for bulk concept image generation
 */
async function processBulkConceptGeneration(
  jobId: string,
  exam: string,
  level: string,
  start: number,
  limit: number,
  delayMs: number
): Promise<void> {
  const startTime = Date.now();
  let processed = 0;
  let success = 0;
  let failed = 0;
  const failedWords: string[] = [];

  try {
    // 1. Get words for the exam/level
    const words = await prisma.word.findMany({
      where: {
        isActive: true,
        examLevels: {
          some: {
            examCategory: exam as any,
            level: level,
          },
        },
      },
      select: {
        id: true,
        word: true,
        definition: true,
        definitionKo: true,
      },
      orderBy: { word: 'asc' },
      skip: start,
      take: limit,
    });

    console.log(`[BULK GEN] Found ${words.length} words to process`);

    if (words.length === 0) {
      console.log(`[BULK GEN] No words to process. Exiting.`);
      return;
    }

    // 2. Process each word sequentially
    for (const word of words) {
      try {
        // Use Claude API for enhanced concept scene generation
        let prompt: string;
        let captionKo: string;
        let captionEn: string;

        try {
          const conceptScene = await generateConceptScene(
            word.word,
            word.definition || '',
            word.definitionKo || ''
          );
          prompt = conceptScene.prompt;
          captionKo = conceptScene.captionKo;
          captionEn = conceptScene.captionEn;
          console.log(`[BULK GEN] 🎨 Enhanced prompt generated for ${word.word}`);
        } catch (promptError) {
          // Fallback to simple prompt if Claude API fails
          console.warn(`[BULK GEN] ⚠️ Claude API failed for ${word.word}, using fallback prompt`);
          prompt = generateConceptPrompt(word.definition || '', word.word);
          captionKo = word.definitionKo || word.definition || '';
          captionEn = word.definition || '';
        }

        const result = await generateAndUploadImage(prompt, 'CONCEPT' as VisualType, word.word);

        if (result) {
          await prisma.wordVisual.upsert({
            where: {
              wordId_type: {
                wordId: word.id,
                type: 'CONCEPT',
              },
            },
            update: {
              imageUrl: result.imageUrl,
              promptEn: prompt,
              captionKo,
              captionEn,
            },
            create: {
              wordId: word.id,
              type: 'CONCEPT',
              imageUrl: result.imageUrl,
              promptEn: prompt,
              captionKo,
              captionEn,
            },
          });
          success++;

          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          const remaining = words.length - processed - 1;
          const eta = remaining > 0 ? Math.floor((elapsed / (processed + 1)) * remaining) : 0;

          console.log(`[BULK GEN] ✅ ${word.word} (${processed + 1}/${words.length}) - ETA: ${Math.floor(eta / 60)}m ${eta % 60}s`);
        } else {
          failed++;
          failedWords.push(word.word);
          console.log(`[BULK GEN] ⚠️ ${word.word} returned null result`);
        }
      } catch (error: any) {
        failed++;
        failedWords.push(word.word);
        console.error(`[BULK GEN] ❌ ${word.word}: ${error.message}`);

        // Longer delay after error
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }

      processed++;

      // Delay between images
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    // 3. Log completion
    const totalTime = Math.floor((Date.now() - startTime) / 1000);
    console.log(`[BULK GEN] ========================================`);
    console.log(`[BULK GEN] ✅ Complete!`);
    console.log(`[BULK GEN] Job ID: ${jobId}`);
    console.log(`[BULK GEN] Success: ${success}, Failed: ${failed}`);
    console.log(`[BULK GEN] Time: ${Math.floor(totalTime / 60)}m ${totalTime % 60}s`);
    if (failedWords.length > 0) {
      console.log(`[BULK GEN] Failed words: ${failedWords.join(', ')}`);
    }
    console.log(`[BULK GEN] ========================================`);
  } catch (error) {
    console.error(`[BULK GEN] ❌ Fatal error:`, error);
  }
}
