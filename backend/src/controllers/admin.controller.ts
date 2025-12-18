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
          displayLevel: dbLevelToFrontend[el.level] || 'BEGINNER',
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

    const existingMap = new Map(existingWords.map((w) => [w.word.toLowerCase(), w]));

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
    if (!config.stabilityConfigured || !config.cloudinaryConfigured) {
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

    if (!config.cloudinaryConfigured) {
      return res.status(500).json({ message: 'Cloudinary not configured. Set CLOUDINARY_* variables.' });
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
 * GET /admin/image-generation/status
 */
export const getImageGenerationStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const examType = (req.query.examType as string) || 'CSAT';

    // Get words by level with image counts
    const levels = ['L1', 'L2', 'L3'];
    const levelStats = await Promise.all(
      levels.map(async (level) => {
        // Count total words for this level
        const totalWords = await prisma.word.count({
          where: {
            examCategory: examType as any,
            level,
            status: { in: ['PUBLISHED', 'PENDING_REVIEW'] },
          },
        });

        // Count words with at least one image
        const withImages = await prisma.word.count({
          where: {
            examCategory: examType as any,
            level,
            status: { in: ['PUBLISHED', 'PENDING_REVIEW'] },
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
        examType,
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
 */
export const startImageBatchGeneration = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { examType = 'CSAT', level, limit = 100 } = req.body;

    if (!level || !['L1', 'L2', 'L3'].includes(level)) {
      return res.status(400).json({
        success: false,
        error: 'Valid level (L1, L2, L3) is required',
      });
    }

    const batchLimit = Math.min(Math.max(1, limit), 1100);

    // Find words that need images
    const wordsToProcess = await prisma.word.findMany({
      where: {
        examCategory: examType as any,
        level,
        status: { in: ['PUBLISHED', 'PENDING_REVIEW'] },
        aiGeneratedAt: { not: null },
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

    // Set status to cancelled - the processing loop will check this and stop
    job.status = 'cancelled';
    job.currentWord = undefined;

    logger.info(`[Admin/ImageGen] Job ${jobId} cancelled. Processed: ${job.processedWords}/${job.totalWords}`);

    res.json({
      success: true,
      data: {
        jobId,
        message: 'Job cancelled successfully',
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
          await prisma.wordVisual.create({
            data: {
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
