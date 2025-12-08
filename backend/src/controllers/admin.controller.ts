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

    // Content coverage - use safe try/catch for optional models
    let hasEtymology = 0;
    let hasMnemonic = 0;
    let hasExamples = 0;
    let hasMedia = 0;

    try {
      [hasEtymology, hasMnemonic, hasExamples, hasMedia] = await Promise.all([
        prisma.etymology.count(),
        prisma.mnemonic.count(),
        prisma.example.count(),
        prisma.wordImage.count(),
      ]);
    } catch {
      // Models might not exist or have data - that's okay
    }

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
      mnemonicKorean: word.mnemonics?.[0]?.koreanHint,
      mnemonicImage: word.mnemonics?.[0]?.imageUrl,

      // Examples (funnyExamples for frontend compatibility)
      funnyExamples: word.examples?.map(e => ({
        id: e.id,
        sentenceEn: e.sentence,
        sentenceKo: e.translation,
        isFunny: e.isFunny || false,
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
// Convert Pronunciation Format (한국어 발음 강세 일괄 변환)
// ============================================

// 한글 유니코드 범위
const HANGUL_START = 0xAC00;
const HANGUL_END = 0xD7A3;

function isHangul(char: string): boolean {
  const code = char.charCodeAt(0);
  return code >= HANGUL_START && code <= HANGUL_END;
}

function splitKoreanSyllables(korean: string): string[] {
  const syllables: string[] = [];
  for (const char of korean) {
    if (isHangul(char)) {
      syllables.push(char);
    }
  }
  return syllables;
}

function findStressPosition(ipa: string, totalSyllables: number): number {
  if (!ipa || totalSyllables <= 1) return 0;

  const primaryStressIndex = ipa.indexOf('ˈ');
  if (primaryStressIndex === -1) return 0;

  const beforeStress = ipa.substring(0, primaryStressIndex);
  const vowelPattern = /[aeiouəɪʊɛɔæɑʌɒɜɐ]/gi;
  const diphthongPattern = /eɪ|aɪ|ɔɪ|aʊ|oʊ|ɪə|eə|ʊə/gi;

  const cleanedBefore = beforeStress.replace(diphthongPattern, 'V');
  const vowelsBefore = (cleanedBefore.match(vowelPattern) || []).length;

  return Math.min(vowelsBefore, totalSyllables - 1);
}

function convertPronunciationFormat(ipa: string, koreanPron: string): {
  converted: string;
  changed: boolean;
  stressSyllable: string;
} {
  if (!koreanPron) {
    return { converted: koreanPron, changed: false, stressSyllable: '' };
  }

  // 이미 변환된 경우 스킵
  if (koreanPron.includes('강세:')) {
    return { converted: koreanPron, changed: false, stressSyllable: '' };
  }

  // 이미 하이픈으로 분리된 경우 (강세 표시만 추가)
  if (koreanPron.includes('-')) {
    const syllables = koreanPron.split('-');
    const stressIndex = findStressPosition(ipa, syllables.length);
    const stressSyllable = syllables[stressIndex] || syllables[0];
    const result = `${koreanPron} (강세: ${stressSyllable})`;
    return { converted: result, changed: true, stressSyllable };
  }

  const syllables = splitKoreanSyllables(koreanPron);

  if (syllables.length === 0) {
    return { converted: koreanPron, changed: false, stressSyllable: '' };
  }

  if (syllables.length === 1) {
    const result = `${syllables[0]} (강세: ${syllables[0]})`;
    return { converted: result, changed: true, stressSyllable: syllables[0] };
  }

  const stressIndex = findStressPosition(ipa, syllables.length);
  const stressSyllable = syllables[stressIndex];
  const hyphenated = syllables.join('-');
  const result = `${hyphenated} (강세: ${stressSyllable})`;

  return { converted: result, changed: true, stressSyllable };
}

export const convertPronunciations = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { dryRun = true, limit } = req.body;
    const maxLimit = limit ? parseInt(limit, 10) : undefined;

    console.log(`[Pronunciation Convert] Mode: ${dryRun ? 'DRY RUN' : 'EXECUTE'}, Limit: ${maxLimit || 'ALL'}`);

    // Get words with pronunciation
    const words = await prisma.word.findMany({
      ...(maxLimit ? { take: maxLimit } : {}),
      where: {
        pronunciation: { not: null }
      },
      select: {
        id: true,
        word: true,
        pronunciation: true,
        ipaUs: true,
        ipaUk: true,
      },
    });

    console.log(`[Pronunciation Convert] Found ${words.length} words with pronunciation`);

    let updated = 0;
    let skipped = 0;
    const examples: Array<{ word: string; before: string; after: string }> = [];

    for (const wordData of words) {
      const ipa = wordData.ipaUs || wordData.ipaUk || '';
      const korean = wordData.pronunciation || '';

      const { converted, changed } = convertPronunciationFormat(ipa, korean);

      if (!changed) {
        skipped++;
        continue;
      }

      // Collect examples (first 10)
      if (examples.length < 10) {
        examples.push({
          word: wordData.word,
          before: korean,
          after: converted,
        });
      }

      if (!dryRun) {
        await prisma.word.update({
          where: { id: wordData.id },
          data: { pronunciation: converted },
        });
      }

      updated++;
    }

    console.log(`[Pronunciation Convert] Complete: ${updated} updated, ${skipped} skipped`);

    res.json({
      success: true,
      mode: dryRun ? 'dry_run' : 'executed',
      stats: {
        total: words.length,
        updated,
        skipped,
      },
      examples,
      message: dryRun
        ? `테스트 모드: ${updated}개 변환 예정 (DB 미변경)`
        : `완료: ${updated}개 변환됨`,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// Regenerate Pronunciation with AI (한국어 발음 AI 재생성)
// ============================================

import { regeneratePronunciations } from '../services/pronunciationGenerator.service';

export const regeneratePronunciationsHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { dryRun = true, limit = 100, batchSize = 20, offset = 0 } = req.body;
    const limitNum = parseInt(limit, 10) || 100;
    const batchSizeNum = parseInt(batchSize, 10) || 20;
    const offsetNum = parseInt(offset, 10) || 0;

    console.log(`[Admin] Regenerate Pronunciation: dryRun=${dryRun}, limit=${limitNum}, offset=${offsetNum}, batchSize=${batchSizeNum}`);

    const result = await regeneratePronunciations(dryRun, limitNum, batchSizeNum, offsetNum);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// ============================================
// Exam Words Seeding (시험별 단어 시드)
// ============================================

import { checkDuplicates, copyWordContent } from '../utils/wordDeduplication';

type ExamCategory = 'CSAT' | 'TOEFL' | 'TOEIC' | 'TEPS' | 'SAT';

interface WordEntry {
  word: string;
  level?: string;
}

interface SeedExamWordsRequest {
  examCategory: ExamCategory;
  words?: string[] | WordEntry[];
  level?: string;  // L1, L2, L3 - if provided without words, loads from file
  dryRun?: boolean;
  reuseContent?: boolean;
  limit?: number;   // Batch size (default 50)
  offset?: number;  // Starting offset (default 0)
}

// Word list files for each exam
import * as fs from 'fs';
import * as path from 'path';

function loadWordsFromFile(examCategory: string, level?: string): WordEntry[] {
  const fileName = `${examCategory.toLowerCase()}-words.json`;
  const filePath = path.join(__dirname, '../../data', fileName);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Word list file not found: ${fileName}`);
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  if (level && data.levels && data.levels[level]) {
    // Return words for specific level
    return data.levels[level].words.map((w: string) => ({ word: w, level }));
  } else if (data.levels) {
    // Return all words from all levels
    const allWords: WordEntry[] = [];
    for (const [lvl, levelData] of Object.entries(data.levels)) {
      const words = (levelData as any).words || [];
      allWords.push(...words.map((w: string) => ({ word: w, level: lvl })));
    }
    return allWords;
  }

  return [];
}

export const seedExamWordsHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      examCategory,
      words: inputWords,
      level,
      dryRun = true,
      reuseContent = true,
      limit = 50,
      offset = 0,
    } = req.body as SeedExamWordsRequest;

    const limitNum = parseInt(String(limit), 10) || 50;
    const offsetNum = parseInt(String(offset), 10) || 0;

    // Validate exam category
    const validCategories: ExamCategory[] = ['CSAT', 'TOEFL', 'TOEIC', 'TEPS', 'SAT'];
    if (!validCategories.includes(examCategory)) {
      return res.status(400).json({
        success: false,
        error: `Invalid examCategory. Must be one of: ${validCategories.join(', ')}`,
      });
    }

    // Load words from file if not provided
    let allWords: WordEntry[];

    if (!inputWords || !Array.isArray(inputWords) || inputWords.length === 0) {
      // Try to load from file
      try {
        allWords = loadWordsFromFile(examCategory, level);
        if (allWords.length === 0) {
          return res.status(400).json({
            success: false,
            error: `No words found for ${examCategory}${level ? ` level ${level}` : ''}. Either provide 'words' array or ensure the word list file exists.`,
          });
        }
        console.log(`[Admin] Loaded ${allWords.length} words from file for ${examCategory}${level ? ` ${level}` : ''}`);
      } catch (error: any) {
        return res.status(400).json({
          success: false,
          error: error.message || 'Failed to load words from file',
        });
      }
    } else {
      // Normalize input - support both string[] and WordEntry[]
      allWords = inputWords.map((w) =>
        typeof w === 'string' ? { word: w, level: level || 'L1' } : w
      );
    }

    // Apply limit/offset for batch processing
    const totalWords = allWords.length;
    const wordList = allWords.slice(offsetNum, offsetNum + limitNum);
    const nextOffset = offsetNum + limitNum < totalWords ? offsetNum + limitNum : null;
    const remaining = Math.max(0, totalWords - offsetNum - limitNum);

    console.log(`[Admin] Seed Exam Words: exam=${examCategory}, total=${totalWords}, processing=${wordList.length}, offset=${offsetNum}, dryRun=${dryRun}`);

    const stats = {
      total: wordList.length,
      duplicates: 0,
      newWords: 0,
      skipped: 0,
      copied: 0,
      errors: 0,
      examples: [] as Array<{
        word: string;
        action: 'copied' | 'new' | 'skipped' | 'error';
        from?: string;
        message?: string;
      }>,
    };

    // Check duplicates
    const words = wordList.map((w) => w.word);
    const duplicateResults = await checkDuplicates(words, examCategory);

    console.log(`[Admin] Processing ${duplicateResults.length} words for ${examCategory}`);

    for (const result of duplicateResults) {
      const wordData = wordList.find(
        (w) => w.word.toLowerCase() === result.word.toLowerCase()
      );
      const targetLevel = wordData?.level || 'L1';

      // Case 1: Word already exists in target exam (TEPS) - skip
      if (!result.isNew && result.existingExam === examCategory) {
        stats.skipped++;
        if (stats.examples.length < 10) {
          stats.examples.push({
            word: result.word,
            action: 'skipped',
            message: `Already exists in ${examCategory}`,
          });
        }
        continue;
      }

      // Case 2: Word exists in another exam (CSAT) - copy content
      if (!result.isNew && result.existingWordId && result.existingExam !== examCategory) {
        stats.duplicates++;
        console.log(`[Admin] Found duplicate: ${result.word} from ${result.existingExam}`);

        if (reuseContent && !dryRun) {
          // Copy content from existing word
          console.log(`[Admin] Copying content for: ${result.word}`);
          const copyResult = await copyWordContent(
            result.existingWordId,
            examCategory,
            targetLevel
          );

          if (copyResult.success) {
            stats.copied++;
            console.log(`[Admin] Successfully copied: ${result.word}`);
            if (stats.examples.length < 10) {
              stats.examples.push({
                word: result.word,
                action: 'copied',
                from: result.existingExam || undefined,
              });
            }
          } else if (copyResult.error?.includes('already exists')) {
            stats.skipped++;
            console.log(`[Admin] Skipped (already exists): ${result.word}`);
            if (stats.examples.length < 10) {
              stats.examples.push({
                word: result.word,
                action: 'skipped',
                message: 'Already exists in target exam',
              });
            }
          } else {
            stats.errors++;
            console.error(`[Admin] Copy error for ${result.word}: ${copyResult.error}`);
            if (stats.examples.length < 10) {
              stats.examples.push({
                word: result.word,
                action: 'error',
                message: copyResult.error,
              });
            }
          }
        } else if (reuseContent && dryRun) {
          // Dry run - would copy
          stats.copied++;
          if (stats.examples.length < 10) {
            stats.examples.push({
              word: result.word,
              action: 'copied',
              from: result.existingExam || undefined,
              message: '[DRY RUN] Would copy',
            });
          }
        }
        continue;
      }

      // Case 3: New word - needs AI generation
      stats.newWords++;

      if (!dryRun) {
        // Create word as DRAFT
        try {
          const existing = await prisma.word.findFirst({
            where: {
              word: { equals: result.word, mode: 'insensitive' },
              examCategory,
            },
          });

          if (existing) {
            stats.skipped++;
            stats.newWords--;
            continue;
          }

          await prisma.word.create({
            data: {
              word: result.word,
              definition: '',
              partOfSpeech: 'NOUN',
              examCategory,
              level: targetLevel,
              status: 'DRAFT',
            },
          });

          if (stats.examples.length < 10) {
            stats.examples.push({
              word: result.word,
              action: 'new',
              message: 'Created as DRAFT - needs AI content',
            });
          }
        } catch (error: any) {
          if (error.code === 'P2002') {
            stats.skipped++;
            stats.newWords--;
          } else {
            stats.errors++;
            if (stats.examples.length < 10) {
              stats.examples.push({
                word: result.word,
                action: 'error',
                message: error.message,
              });
            }
          }
        }
      } else {
        // Dry run
        if (stats.examples.length < 10) {
          stats.examples.push({
            word: result.word,
            action: 'new',
            message: '[DRY RUN] Would create as DRAFT',
          });
        }
      }
    }

    console.log(`[Admin] Seed complete: duplicates=${stats.duplicates}, copied=${stats.copied}, newWords=${stats.newWords}, skipped=${stats.skipped}`);

    // Calculate cost savings
    const COST_PER_WORD = 0.03;
    const estimatedSavings = stats.copied * COST_PER_WORD;
    const estimatedCost = stats.newWords * COST_PER_WORD;

    res.json({
      success: true,
      mode: dryRun ? 'dry_run' : 'executed',
      examCategory,
      level: level || 'all',
      stats: {
        ...stats,
        totalInFile: totalWords,
        processed: wordList.length,
        offset: offsetNum,
        nextOffset,
        remaining,
        estimatedSavings: Number(estimatedSavings.toFixed(2)),
        estimatedCost: Number(estimatedCost.toFixed(2)),
        savingsPercentage: stats.total > 0
          ? Math.round((stats.duplicates / stats.total) * 100)
          : 0,
      },
      message: dryRun
        ? `테스트 모드: ${stats.duplicates}개 재사용 가능, ${stats.newWords}개 신규 (offset: ${offsetNum}, 남은 수: ${remaining})`
        : `완료: ${stats.copied}개 복사됨, ${stats.newWords}개 생성됨 (offset: ${offsetNum}, 남은 수: ${remaining})`,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// Delete Exam Words (시험별 단어 삭제 - 테스트 데이터 정리용)
// ============================================

export const deleteExamWordsHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { examCategory, level, dryRun = true } = req.body;

    // Validate exam category
    const validCategories: ExamCategory[] = ['TOEFL', 'TOEIC', 'TEPS', 'SAT'];  // CSAT는 삭제 불가
    if (!validCategories.includes(examCategory)) {
      return res.status(400).json({
        success: false,
        error: `Invalid examCategory. Must be one of: ${validCategories.join(', ')} (CSAT cannot be deleted)`,
      });
    }

    // Count words to delete
    const whereClause: any = { examCategory };
    if (level) {
      whereClause.level = level;
    }

    const count = await prisma.word.count({ where: whereClause });

    if (dryRun) {
      return res.json({
        success: true,
        mode: 'dry_run',
        examCategory,
        level: level || 'all',
        count,
        message: `테스트 모드: ${examCategory}${level ? ` ${level}` : ''} 단어 ${count}개 삭제 예정`,
      });
    }

    // Delete words (cascade will delete related content)
    const deleteResult = await prisma.word.deleteMany({ where: whereClause });

    console.log(`[Admin] Deleted ${deleteResult.count} ${examCategory} words${level ? ` (level: ${level})` : ''}`);

    res.json({
      success: true,
      mode: 'executed',
      examCategory,
      level: level || 'all',
      deleted: deleteResult.count,
      message: `완료: ${examCategory}${level ? ` ${level}` : ''} 단어 ${deleteResult.count}개 삭제됨`,
    });
  } catch (error) {
    next(error);
  }
};
