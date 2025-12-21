import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import {
  checkDuplicates,
  getDeduplicationStats,
  getAllDeduplicationStats,
  COST_PER_WORD,
} from '../utils/wordDeduplication';
import { CSAT_L1_WORDS, CSAT_L2_WORDS, CSAT_L3_WORDS } from '../data/csat-words';
import { processGenerationJob } from '../services/contentGenerator.service';
import logger from '../utils/logger';
import {
  generateAndUploadImage,
  generateConceptPrompt,
  generateMnemonicPrompt,
  generateRhymePrompt,
  VisualType,
} from '../services/imageGenerator.service';
import {
  extractMnemonicScene,
  generateRhymeScene,
} from '../services/smartCaption.service';

const router = Router();

// Sample seed words (same as user.routes.ts)
const sampleWords = [
  // CSAT L1 (10 words)
  { word: 'maintain', partOfSpeech: 'VERB', definitionKo: '유지하다', definition: 'to keep something in existence or continuance', examCategory: 'CSAT', level: 'L1', tags: ['일반', '과학'], frequency: 101 },
  { word: 'increase', partOfSpeech: 'VERB', definitionKo: '증가하다', definition: 'to become or make greater in size, amount, or degree', examCategory: 'CSAT', level: 'L1', tags: ['데이터', '변화'], frequency: 102 },
  { word: 'decrease', partOfSpeech: 'VERB', definitionKo: '감소하다', definition: 'to become smaller or fewer in size, amount, or degree', examCategory: 'CSAT', level: 'L1', tags: ['데이터', '변화'], frequency: 103 },
  { word: 'require', partOfSpeech: 'VERB', definitionKo: '요구하다', definition: 'to need something or make something necessary', examCategory: 'CSAT', level: 'L1', tags: ['조건', '규칙'], frequency: 104 },
  { word: 'provide', partOfSpeech: 'VERB', definitionKo: '제공하다', definition: 'to give something to someone or make it available', examCategory: 'CSAT', level: 'L1', tags: ['일반'], frequency: 105 },
  { word: 'environment', partOfSpeech: 'NOUN', definitionKo: '환경', definition: 'the surroundings or conditions in which a person lives', examCategory: 'CSAT', level: 'L1', tags: ['환경', '사회'], frequency: 121 },
  { word: 'behavior', partOfSpeech: 'NOUN', definitionKo: '행동', definition: 'the way a person or animal acts or conducts oneself', examCategory: 'CSAT', level: 'L1', tags: ['심리', '사회'], frequency: 122 },
  { word: 'relationship', partOfSpeech: 'NOUN', definitionKo: '관계', definition: 'the way in which two or more things are connected', examCategory: 'CSAT', level: 'L1', tags: ['사회', '심리'], frequency: 123 },
  { word: 'therefore', partOfSpeech: 'ADVERB', definitionKo: '그러므로', definition: 'for that reason; consequently', examCategory: 'CSAT', level: 'L1', tags: ['논리'], frequency: 135 },
  { word: 'however', partOfSpeech: 'ADVERB', definitionKo: '그러나', definition: 'used to introduce a contrasting statement', examCategory: 'CSAT', level: 'L1', tags: ['논리'], frequency: 136 },
  // CSAT L2 (5 words)
  { word: 'concept', partOfSpeech: 'NOUN', definitionKo: '개념', definition: 'an abstract idea or general notion', examCategory: 'CSAT', level: 'L2', tags: ['추상', '철학'], frequency: 201 },
  { word: 'significant', partOfSpeech: 'ADJECTIVE', definitionKo: '중요한, 상당한', definition: 'sufficiently great or important', examCategory: 'CSAT', level: 'L2', tags: ['통계', '논리'], frequency: 211 },
  { word: 'perspective', partOfSpeech: 'NOUN', definitionKo: '관점', definition: 'a particular way of viewing things', examCategory: 'CSAT', level: 'L2', tags: ['심리', '철학'], frequency: 223 },
  { word: 'consequence', partOfSpeech: 'NOUN', definitionKo: '결과', definition: 'a result or effect of an action', examCategory: 'CSAT', level: 'L2', tags: ['원인결과'], frequency: 226 },
  { word: 'adapt', partOfSpeech: 'VERB', definitionKo: '적응하다', definition: 'to adjust to new conditions', examCategory: 'CSAT', level: 'L2', tags: ['환경', '진화'], frequency: 240, tips: 'adapt to + 환경/상황' },
  // CSAT L3 (5 words)
  { word: 'inevitable', partOfSpeech: 'ADJECTIVE', definitionKo: '피할 수 없는', definition: 'certain to happen; unavoidable', examCategory: 'CSAT', level: 'L3', tags: ['논리', '역사'], frequency: 301 },
  { word: 'paradox', partOfSpeech: 'NOUN', definitionKo: '역설', definition: 'a contradictory statement that may be true', examCategory: 'CSAT', level: 'L3', tags: ['철학', '논리'], frequency: 310 },
  { word: 'facilitate', partOfSpeech: 'VERB', definitionKo: '촉진하다', definition: 'to make an action or process easier', examCategory: 'CSAT', level: 'L3', tags: ['교육', '기술'], frequency: 323 },
  { word: 'perceive', partOfSpeech: 'VERB', definitionKo: '인식하다', definition: 'to become aware of through the senses', examCategory: 'CSAT', level: 'L3', tags: ['심리'], frequency: 326 },
  { word: 'emerge', partOfSpeech: 'VERB', definitionKo: '나타나다', definition: 'to come into view or existence', examCategory: 'CSAT', level: 'L3', tags: ['사회', '과학'], frequency: 340 },
  // TEPS (5 words)
  { word: 'fluctuate', partOfSpeech: 'VERB', definitionKo: '변동하다', definition: 'to rise and fall irregularly', examCategory: 'TEPS', level: 'L1', tags: ['경제', '데이터'], frequency: 401 },
  { word: 'deteriorate', partOfSpeech: 'VERB', definitionKo: '악화되다', definition: 'to become progressively worse', examCategory: 'TEPS', level: 'L2', tags: ['변화'], frequency: 421 },
  { word: 'ambiguous', partOfSpeech: 'ADJECTIVE', definitionKo: '모호한', definition: 'open to more than one interpretation', examCategory: 'TEPS', level: 'L2', tags: ['언어'], frequency: 422 },
  { word: 'coherent', partOfSpeech: 'ADJECTIVE', definitionKo: '일관된', definition: 'logically consistent', examCategory: 'TEPS', level: 'L3', tags: ['논리', '글쓰기'], frequency: 441 },
  { word: 'meticulous', partOfSpeech: 'ADJECTIVE', definitionKo: '꼼꼼한', definition: 'showing great attention to detail', examCategory: 'TEPS', level: 'L3', tags: ['태도'], frequency: 442 },
  // TOEIC (5 words)
  { word: 'deadline', partOfSpeech: 'NOUN', definitionKo: '마감일', definition: 'the latest time by which something should be completed', examCategory: 'TOEIC', level: 'L1', tags: ['비즈니스', '시간'], frequency: 501 },
  { word: 'negotiate', partOfSpeech: 'VERB', definitionKo: '협상하다', definition: 'to try to reach an agreement through discussion', examCategory: 'TOEIC', level: 'L1', tags: ['비즈니스'], frequency: 502 },
  { word: 'compliance', partOfSpeech: 'NOUN', definitionKo: '준수', definition: 'the action of complying with regulations', examCategory: 'TOEIC', level: 'L2', tags: ['법률', '비즈니스'], frequency: 521 },
  { word: 'implement', partOfSpeech: 'VERB', definitionKo: '실행하다', definition: 'to put into effect', examCategory: 'TOEIC', level: 'L2', tags: ['비즈니스'], frequency: 522 },
  { word: 'subsidiary', partOfSpeech: 'NOUN', definitionKo: '자회사', definition: 'a company controlled by a holding company', examCategory: 'TOEIC', level: 'L3', tags: ['기업'], frequency: 541 },
  // TOEFL (5 words)
  { word: 'hypothesis', partOfSpeech: 'NOUN', definitionKo: '가설', definition: 'a proposed explanation made as a starting point', examCategory: 'TOEFL', level: 'L1', tags: ['과학', '연구'], frequency: 601 },
  { word: 'methodology', partOfSpeech: 'NOUN', definitionKo: '방법론', definition: 'a system of methods used in a particular area', examCategory: 'TOEFL', level: 'L2', tags: ['연구'], frequency: 621 },
  { word: 'anthropology', partOfSpeech: 'NOUN', definitionKo: '인류학', definition: 'the study of human societies and cultures', examCategory: 'TOEFL', level: 'L2', tags: ['학문'], frequency: 622 },
  { word: 'paradigm', partOfSpeech: 'NOUN', definitionKo: '패러다임', definition: 'a typical example or pattern', examCategory: 'TOEFL', level: 'L3', tags: ['과학', '철학'], frequency: 641 },
  { word: 'synthesis', partOfSpeech: 'NOUN', definitionKo: '종합, 합성', definition: 'the combination of ideas to form a theory', examCategory: 'TOEFL', level: 'L3', tags: ['연구', '화학'], frequency: 642 },
  // SAT (5 words)
  { word: 'eloquent', partOfSpeech: 'ADJECTIVE', definitionKo: '유창한', definition: 'fluent or persuasive in speaking or writing', examCategory: 'SAT', level: 'L1', tags: ['언어', '수사'], frequency: 701 },
  { word: 'scrutinize', partOfSpeech: 'VERB', definitionKo: '면밀히 조사하다', definition: 'to examine closely and critically', examCategory: 'SAT', level: 'L2', tags: ['분석'], frequency: 721 },
  { word: 'ubiquitous', partOfSpeech: 'ADJECTIVE', definitionKo: '어디에나 있는', definition: 'present everywhere', examCategory: 'SAT', level: 'L2', tags: ['일반'], frequency: 722 },
  { word: 'ephemeral', partOfSpeech: 'ADJECTIVE', definitionKo: '일시적인', definition: 'lasting for a very short time', examCategory: 'SAT', level: 'L3', tags: ['시간'], frequency: 741 },
  { word: 'sycophant', partOfSpeech: 'NOUN', definitionKo: '아첨꾼', definition: 'a person who flatters someone important', examCategory: 'SAT', level: 'L3', tags: ['인물', '사회'], frequency: 742 },
];

// ============================================
// Helper: Seed CSAT words by level
// ============================================
type DifficultyLevel = 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';

interface SeedResult {
  level: string;
  totalWords: number;
  newWords: number;
  existingWithMapping: number;
  newMappings: number;
  alreadyMapped: number;
}

async function seedCSATLevel(
  words: string[],
  level: 'L1' | 'L2' | 'L3',
  difficulty: DifficultyLevel
): Promise<SeedResult> {
  const examCategory = 'CSAT';

  // Get existing words with their exam mappings
  const existingWords = await prisma.word.findMany({
    where: { word: { in: words.map(w => w.toLowerCase()) } },
    select: {
      id: true,
      word: true,
      aiGeneratedAt: true,
      examLevels: { select: { examCategory: true } },
    },
  });

  const existingMap = new Map(existingWords.map(w => [w.word.toLowerCase(), w]));

  const newWordTexts: string[] = [];
  const mappingsToAdd: { wordId: string; word: string }[] = [];
  const alreadyMapped: string[] = [];

  for (const wordText of words) {
    const normalized = wordText.toLowerCase().trim();
    const existing = existingMap.get(normalized);

    if (!existing) {
      newWordTexts.push(normalized);
    } else {
      const hasMapping = existing.examLevels.some(el => el.examCategory === examCategory);
      if (hasMapping) {
        alreadyMapped.push(normalized);
      } else {
        mappingsToAdd.push({ wordId: existing.id, word: normalized });
      }
    }
  }

  // Create new words in batches
  const batchSize = 100;
  if (newWordTexts.length > 0) {
    for (let i = 0; i < newWordTexts.length; i += batchSize) {
      const batch = newWordTexts.slice(i, i + batchSize);
      await prisma.word.createMany({
        data: batch.map(word => ({
          word,
          definition: '',
          partOfSpeech: 'NOUN' as const,
          examCategory: examCategory as any,
          difficulty: difficulty as any,
          level,
          frequency: 100,
          status: 'DRAFT' as const,
        })),
        skipDuplicates: true,
      });
    }

    // Get newly created words for exam level mapping
    const newlyCreated = await prisma.word.findMany({
      where: { word: { in: newWordTexts } },
      select: { id: true, word: true },
    });

    // Create WordExamLevel mappings for new words
    for (let i = 0; i < newlyCreated.length; i += batchSize) {
      const batch = newlyCreated.slice(i, i + batchSize);
      await prisma.wordExamLevel.createMany({
        data: batch.map(w => ({
          wordId: w.id,
          examCategory: examCategory as any,
          level,
          frequency: 100,
        })),
        skipDuplicates: true,
      });
    }
  }

  // Add exam mappings for existing words (content reuse)
  if (mappingsToAdd.length > 0) {
    for (let i = 0; i < mappingsToAdd.length; i += batchSize) {
      const batch = mappingsToAdd.slice(i, i + batchSize);
      await prisma.wordExamLevel.createMany({
        data: batch.map(m => ({
          wordId: m.wordId,
          examCategory: examCategory as any,
          level,
          frequency: 100,
        })),
        skipDuplicates: true,
      });
    }
  }

  return {
    level,
    totalWords: words.length,
    newWords: newWordTexts.length,
    existingWithMapping: mappingsToAdd.length,
    newMappings: newWordTexts.length + mappingsToAdd.length,
    alreadyMapped: alreadyMapped.length,
  };
}

// ============================================
// CSAT Seed Endpoints
// ============================================

/**
 * GET /internal/seed-csat-l1?key=YOUR_SECRET
 * 수능 L1 (초급) 1000단어 시드
 */
router.get('/seed-csat-l1', async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string;
    if (!key || key !== process.env.INTERNAL_SECRET_KEY) {
      return res.status(403).json({ error: 'Forbidden: Invalid key' });
    }

    console.log('[Internal/Seed] Starting CSAT L1 seed...');
    const result = await seedCSATLevel(CSAT_L1_WORDS, 'L1', 'BASIC');
    console.log('[Internal/Seed] CSAT L1 completed:', result);

    res.json({
      message: 'CSAT L1 seed completed',
      ...result,
    });
  } catch (error) {
    console.error('[Internal/Seed] CSAT L1 error:', error);
    res.status(500).json({ error: 'Seed failed', details: String(error) });
  }
});

/**
 * GET /internal/seed-csat-l2?key=YOUR_SECRET
 * 수능 L2 (중급) 1051단어 시드
 */
router.get('/seed-csat-l2', async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string;
    if (!key || key !== process.env.INTERNAL_SECRET_KEY) {
      return res.status(403).json({ error: 'Forbidden: Invalid key' });
    }

    console.log('[Internal/Seed] Starting CSAT L2 seed...');
    const result = await seedCSATLevel(CSAT_L2_WORDS, 'L2', 'INTERMEDIATE');
    console.log('[Internal/Seed] CSAT L2 completed:', result);

    res.json({
      message: 'CSAT L2 seed completed',
      ...result,
    });
  } catch (error) {
    console.error('[Internal/Seed] CSAT L2 error:', error);
    res.status(500).json({ error: 'Seed failed', details: String(error) });
  }
});

/**
 * GET /internal/seed-csat-l3?key=YOUR_SECRET
 * 수능 L3 (고급) 1053단어 시드
 */
router.get('/seed-csat-l3', async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string;
    if (!key || key !== process.env.INTERNAL_SECRET_KEY) {
      return res.status(403).json({ error: 'Forbidden: Invalid key' });
    }

    console.log('[Internal/Seed] Starting CSAT L3 seed...');
    const result = await seedCSATLevel(CSAT_L3_WORDS, 'L3', 'ADVANCED');
    console.log('[Internal/Seed] CSAT L3 completed:', result);

    res.json({
      message: 'CSAT L3 seed completed',
      ...result,
    });
  } catch (error) {
    console.error('[Internal/Seed] CSAT L3 error:', error);
    res.status(500).json({ error: 'Seed failed', details: String(error) });
  }
});

/**
 * GET /internal/seed-csat-all?key=YOUR_SECRET
 * 수능 전체 (L1+L2+L3) 시드
 */
router.get('/seed-csat-all', async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string;
    if (!key || key !== process.env.INTERNAL_SECRET_KEY) {
      return res.status(403).json({ error: 'Forbidden: Invalid key' });
    }

    console.log('[Internal/Seed] Starting CSAT ALL seed...');

    const l1Result = await seedCSATLevel(CSAT_L1_WORDS, 'L1', 'BASIC');
    console.log('[Internal/Seed] CSAT L1 completed:', l1Result);

    const l2Result = await seedCSATLevel(CSAT_L2_WORDS, 'L2', 'INTERMEDIATE');
    console.log('[Internal/Seed] CSAT L2 completed:', l2Result);

    const l3Result = await seedCSATLevel(CSAT_L3_WORDS, 'L3', 'ADVANCED');
    console.log('[Internal/Seed] CSAT L3 completed:', l3Result);

    const totalNew = l1Result.newWords + l2Result.newWords + l3Result.newWords;
    const totalMappings = l1Result.newMappings + l2Result.newMappings + l3Result.newMappings;

    res.json({
      message: 'CSAT ALL seed completed',
      summary: {
        totalNewWords: totalNew,
        totalNewMappings: totalMappings,
      },
      L1: l1Result,
      L2: l2Result,
      L3: l3Result,
    });
  } catch (error) {
    console.error('[Internal/Seed] CSAT ALL error:', error);
    res.status(500).json({ error: 'Seed failed', details: String(error) });
  }
});

// ============================================
// Existing Endpoints
// ============================================

/**
 * GET /internal/run-seed?key=YOUR_SECRET
 * 브라우저 주소창에서 직접 호출 가능 (CORS 우회)
 */
router.get('/run-seed', async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string;

    // Verify secret key
    if (!key || key !== process.env.INTERNAL_SECRET_KEY) {
      return res.status(403).json({ error: 'Forbidden: Invalid key' });
    }

    // Check if words already exist
    const existingCount = await prisma.word.count();
    if (existingCount > 0) {
      return res.json({
        message: 'Database already has words',
        existingCount,
        skipped: true
      });
    }

    // Insert sample words
    let insertedCount = 0;
    for (const wordData of sampleWords) {
      try {
        await prisma.word.create({
          data: {
            word: wordData.word,
            partOfSpeech: wordData.partOfSpeech as any,
            definitionKo: wordData.definitionKo,
            definition: wordData.definition,
            examCategory: wordData.examCategory as any,
            level: wordData.level,
            tags: wordData.tags,
            frequency: wordData.frequency,
            tips: (wordData as any).tips || null,
            difficulty: 'INTERMEDIATE',
          }
        });
        insertedCount++;
      } catch (e: any) {
        console.log(`Skipping word: ${wordData.word} - ${e.message}`);
      }
    }

    console.log(`[Internal/Seed] Inserted ${insertedCount} sample words`);

    res.json({
      message: 'Seed completed successfully',
      insertedCount,
      totalSampleWords: sampleWords.length
    });
  } catch (error) {
    console.error('[Internal/Seed] Error:', error);
    res.status(500).json({ error: 'Seed failed' });
  }
});

/**
 * GET /internal/upgrade-admin?email=user@example.com&key=YOUR_SECRET
 * 브라우저 주소창에서 직접 호출 가능 (CORS 우회)
 */
router.get('/upgrade-admin', async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string;
    const email = req.query.email as string;

    // Verify secret key
    if (!key || key !== process.env.INTERNAL_SECRET_KEY) {
      return res.status(403).json({ error: 'Forbidden: Invalid key' });
    }

    if (!email) {
      return res.status(400).json({ error: 'Missing email parameter' });
    }

    const user = await prisma.user.update({
      where: { email },
      data: {
        role: 'ADMIN',
        subscriptionStatus: 'ACTIVE',
        subscriptionPlan: 'YEARLY',
        subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        subscriptionEnd: true,
      }
    });

    console.log('[Internal/Admin] User upgraded:', user.email);

    res.json({
      message: 'User upgraded to admin successfully',
      user
    });
  } catch (error) {
    console.error('[Internal/Admin] Upgrade failed:', error);
    res.status(500).json({ error: 'Failed to upgrade user' });
  }
});

/**
 * GET /internal/status?key=YOUR_SECRET
 * 서버 상태 확인
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string;

    if (!key || key !== process.env.INTERNAL_SECRET_KEY) {
      return res.status(403).json({ error: 'Forbidden: Invalid key' });
    }

    const wordCount = await prisma.word.count();
    const userCount = await prisma.user.count();

    // Get word counts by exam and level
    const csatCounts = await prisma.wordExamLevel.groupBy({
      by: ['level'],
      where: { examCategory: 'CSAT' },
      _count: { level: true },
    });

    // Get content generation stats
    const draftWithoutContent = await prisma.word.count({
      where: {
        status: 'DRAFT',
        aiGeneratedAt: null,
      },
    });
    const pendingReview = await prisma.word.count({
      where: { status: 'PENDING_REVIEW' },
    });
    const published = await prisma.word.count({
      where: { status: 'PUBLISHED' },
    });

    res.json({
      status: 'ok',
      database: 'connected',
      counts: {
        totalWords: wordCount,
        users: userCount,
        csat: csatCounts.reduce((acc, c) => {
          acc[c.level] = c._count.level;
          return acc;
        }, {} as Record<string, number>),
      },
      contentStatus: {
        needsGeneration: draftWithoutContent,
        pendingReview,
        published,
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Internal/Status] Error:', error);
    res.status(500).json({ error: 'Status check failed' });
  }
});

// ============================================
// AI Content Generation Endpoints
// ============================================

/**
 * GET /internal/generate-content?key=YOUR_SECRET&limit=50&level=L1
 * DRAFT 상태이고 AI 콘텐츠가 없는 단어들에 대해 콘텐츠 생성 시작
 * - limit: 한 번에 처리할 단어 수 (기본 50, 최대 100)
 * - level: L1, L2, L3 필터 (선택사항)
 */
router.get('/generate-content', async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string;
    if (!key || key !== process.env.INTERNAL_SECRET_KEY) {
      return res.status(403).json({ error: 'Forbidden: Invalid key' });
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const level = req.query.level as string; // L1, L2, L3
    const examCategory = req.query.examCategory as string; // CSAT, TEPS, TOEFL, etc.

    // Find words that need content generation
    const whereClause: any = {
      status: 'DRAFT',
      aiGeneratedAt: null,
    };

    if (level && ['L1', 'L2', 'L3'].includes(level)) {
      whereClause.level = level;
    }

    if (examCategory) {
      whereClause.examCategory = examCategory as any;
    }

    const wordsToGenerate = await prisma.word.findMany({
      where: whereClause,
      select: { id: true, word: true, level: true },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    if (wordsToGenerate.length === 0) {
      return res.json({
        message: 'No words need content generation',
        processed: 0,
        remaining: 0,
      });
    }

    // Get remaining count
    const remainingCount = await prisma.word.count({
      where: whereClause,
    });

    // Create a batch job
    const wordIds = wordsToGenerate.map(w => w.id);

    const job = await prisma.contentGenerationJob.create({
      data: {
        inputWords: wordIds, // Use word IDs
        examCategory: 'CSAT',
        cefrLevel: 'B1',
        status: 'pending',
        progress: 0,
      },
    });

    // Start processing in background
    processGenerationJob(job.id).catch((error) => {
      logger.error(`[Internal/Generate] Background job ${job.id} failed:`, error);
    });

    logger.info(`[Internal/Generate] Started job ${job.id} for ${wordsToGenerate.length} words`);

    res.json({
      message: `Content generation started for ${wordsToGenerate.length} words`,
      jobId: job.id,
      wordsCount: wordsToGenerate.length,
      remaining: remainingCount - wordsToGenerate.length,
      words: wordsToGenerate.map(w => ({ id: w.id, word: w.word, level: w.level })),
    });
  } catch (error) {
    console.error('[Internal/Generate] Error:', error);
    res.status(500).json({ error: 'Content generation failed', details: String(error) });
  }
});

/**
 * GET /internal/generation-status?key=YOUR_SECRET
 * 콘텐츠 생성 작업 상태 확인
 */
router.get('/generation-status', async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string;
    if (!key || key !== process.env.INTERNAL_SECRET_KEY) {
      return res.status(403).json({ error: 'Forbidden: Invalid key' });
    }

    // Get recent jobs
    const jobs = await prisma.contentGenerationJob.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        status: true,
        progress: true,
        inputWords: true,
        errorMessage: true,
        createdAt: true,
        startedAt: true,
        completedAt: true,
      },
    });

    // Get overall content generation stats
    const stats = await Promise.all([
      prisma.word.count({ where: { aiGeneratedAt: null, status: 'DRAFT' } }),
      prisma.word.count({ where: { aiGeneratedAt: { not: null } } }),
      prisma.word.count({ where: { status: 'PENDING_REVIEW' } }),
      prisma.word.count({ where: { status: 'PUBLISHED' } }),
      prisma.contentGenerationJob.count({ where: { status: 'processing' } }),
    ]);

    res.json({
      overallStats: {
        needsGeneration: stats[0],
        hasAiContent: stats[1],
        pendingReview: stats[2],
        published: stats[3],
        activeJobs: stats[4],
      },
      recentJobs: jobs.map(job => ({
        id: job.id,
        status: job.status,
        progress: job.progress,
        wordCount: job.inputWords.length,
        error: job.errorMessage,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Internal/GenerationStatus] Error:', error);
    res.status(500).json({ error: 'Status check failed' });
  }
});

/**
 * GET /internal/job/:jobId?key=YOUR_SECRET
 * 특정 작업 상세 정보
 */
router.get('/job/:jobId', async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string;
    if (!key || key !== process.env.INTERNAL_SECRET_KEY) {
      return res.status(403).json({ error: 'Forbidden: Invalid key' });
    }

    const { jobId } = req.params;

    const job = await prisma.contentGenerationJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({
      job: {
        id: job.id,
        status: job.status,
        progress: job.progress,
        wordCount: job.inputWords.length,
        inputWords: job.inputWords,
        result: job.result,
        errorMessage: job.errorMessage,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
      },
    });
  } catch (error) {
    console.error('[Internal/Job] Error:', error);
    res.status(500).json({ error: 'Job fetch failed' });
  }
});

/**
 * GET /internal/content-stats?key=YOUR_SECRET
 * 콘텐츠 생성 상세 통계
 */
router.get('/content-stats', async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string;
    if (!key || key !== process.env.INTERNAL_SECRET_KEY) {
      return res.status(403).json({ error: 'Forbidden: Invalid key' });
    }

    // Count by status
    const statusCounts = await prisma.word.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    // Count words with AI content
    const withAiContent = await prisma.word.count({
      where: { aiGeneratedAt: { not: null } },
    });

    // Count by level for words needing generation
    const needsGenerationByLevel = await prisma.word.groupBy({
      by: ['level'],
      where: { status: 'DRAFT', aiGeneratedAt: null },
      _count: { level: true },
    });

    // Count related content
    const contentCounts = await Promise.all([
      prisma.etymology.count(),
      prisma.mnemonic.count(),
      prisma.example.count(),
      prisma.collocation.count(),
    ]);

    res.json({
      statusBreakdown: statusCounts.reduce((acc, s) => {
        acc[s.status] = s._count.status;
        return acc;
      }, {} as Record<string, number>),
      aiContentGenerated: withAiContent,
      needsGenerationByLevel: needsGenerationByLevel.reduce((acc, l) => {
        acc[l.level || 'unknown'] = l._count.level;
        return acc;
      }, {} as Record<string, number>),
      relatedContent: {
        etymologies: contentCounts[0],
        mnemonics: contentCounts[1],
        examples: contentCounts[2],
        collocations: contentCounts[3],
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Internal/ContentStats] Error:', error);
    res.status(500).json({ error: 'Stats fetch failed' });
  }
});

// ============================================
// Continuous Generation (Auto-batch)
// ============================================

// Track active continuous generation sessions
const activeContinuousSessions: Map<string, {
  isRunning: boolean;
  batchesCompleted: number;
  wordsProcessed: number;
  errors: string[];
  startedAt: Date;
  lastBatchAt: Date | null;
  level?: string;
  examCategory?: string;
  batchSize: number;
  maxBatches: number;
}> = new Map();

/**
 * GET /internal/generate-continuous?key=YOUR_SECRET&batchSize=50&maxBatches=20&level=L1
 * 자동 연속 콘텐츠 생성
 * - batchSize: 배치당 단어 수 (기본 50, 최대 100)
 * - maxBatches: 최대 배치 수 (기본 20, 최대 100)
 * - level: L1, L2, L3 필터 (선택사항)
 */
router.get('/generate-continuous', async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string;
    if (!key || key !== process.env.INTERNAL_SECRET_KEY) {
      return res.status(403).json({ error: 'Forbidden: Invalid key' });
    }

    const batchSize = Math.min(parseInt(req.query.batchSize as string) || 50, 100);
    const maxBatches = Math.min(parseInt(req.query.maxBatches as string) || 20, 100);
    const level = req.query.level as string;
    const examCategory = req.query.examCategory as string; // CSAT, TEPS, TOEFL, etc.

    // Check if there's already a continuous session running
    const existingSession = Array.from(activeContinuousSessions.entries())
      .find(([_, session]) => session.isRunning);

    if (existingSession) {
      return res.json({
        message: 'Continuous generation already running',
        sessionId: existingSession[0],
        session: existingSession[1],
      });
    }

    // Create session ID
    const sessionId = `continuous-${Date.now()}`;

    // Initialize session
    activeContinuousSessions.set(sessionId, {
      isRunning: true,
      batchesCompleted: 0,
      wordsProcessed: 0,
      errors: [],
      startedAt: new Date(),
      lastBatchAt: null,
      level,
      examCategory,
      batchSize,
      maxBatches,
    });

    // Start the continuous generation process
    runContinuousGeneration(sessionId, batchSize, maxBatches, level, examCategory);

    logger.info(`[Internal/Continuous] Started session ${sessionId}: batchSize=${batchSize}, maxBatches=${maxBatches}, level=${level || 'all'}, examCategory=${examCategory || 'all'}`);

    res.json({
      message: 'Continuous generation started',
      sessionId,
      config: {
        batchSize,
        maxBatches,
        level: level || 'all',
        estimatedWords: batchSize * maxBatches,
      },
    });
  } catch (error) {
    console.error('[Internal/Continuous] Error:', error);
    res.status(500).json({ error: 'Failed to start continuous generation', details: String(error) });
  }
});

/**
 * GET /internal/continuous-status?key=YOUR_SECRET
 * 연속 생성 세션 상태 확인
 */
router.get('/continuous-status', async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string;
    if (!key || key !== process.env.INTERNAL_SECRET_KEY) {
      return res.status(403).json({ error: 'Forbidden: Invalid key' });
    }

    const sessions = Array.from(activeContinuousSessions.entries()).map(([id, session]) => ({
      sessionId: id,
      ...session,
      runningTime: session.isRunning
        ? Math.round((Date.now() - session.startedAt.getTime()) / 1000) + 's'
        : null,
    }));

    // Get remaining words count
    const remainingWords = await prisma.word.count({
      where: { status: 'DRAFT', aiGeneratedAt: null },
    });

    res.json({
      activeSessions: sessions.filter(s => s.isRunning),
      completedSessions: sessions.filter(s => !s.isRunning).slice(-5),
      remainingWords,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Internal/ContinuousStatus] Error:', error);
    res.status(500).json({ error: 'Status check failed' });
  }
});

/**
 * GET /internal/stop-continuous?key=YOUR_SECRET&sessionId=xxx
 * 연속 생성 중지
 */
router.get('/stop-continuous', async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string;
    if (!key || key !== process.env.INTERNAL_SECRET_KEY) {
      return res.status(403).json({ error: 'Forbidden: Invalid key' });
    }

    const sessionId = req.query.sessionId as string;

    if (sessionId) {
      const session = activeContinuousSessions.get(sessionId);
      if (session) {
        session.isRunning = false;
        return res.json({ message: `Session ${sessionId} stopped`, session });
      }
      return res.status(404).json({ error: 'Session not found' });
    }

    // Stop all sessions
    let stoppedCount = 0;
    activeContinuousSessions.forEach((session) => {
      if (session.isRunning) {
        session.isRunning = false;
        stoppedCount++;
      }
    });

    res.json({ message: `Stopped ${stoppedCount} sessions` });
  } catch (error) {
    console.error('[Internal/StopContinuous] Error:', error);
    res.status(500).json({ error: 'Failed to stop' });
  }
});

// Helper function to run continuous generation
async function runContinuousGeneration(
  sessionId: string,
  batchSize: number,
  maxBatches: number,
  level?: string,
  examCategory?: string
): Promise<void> {
  const session = activeContinuousSessions.get(sessionId);
  if (!session) return;

  while (session.isRunning && session.batchesCompleted < maxBatches) {
    try {
      // Build where clause
      const whereClause: any = {
        status: 'DRAFT',
        aiGeneratedAt: null,
      };
      if (level && ['L1', 'L2', 'L3'].includes(level)) {
        whereClause.level = level;
      }
      if (examCategory) {
        whereClause.examCategory = examCategory as any;
      }

      // Find words to generate
      const wordsToGenerate = await prisma.word.findMany({
        where: whereClause,
        select: { id: true, word: true },
        orderBy: { createdAt: 'asc' },
        take: batchSize,
      });

      if (wordsToGenerate.length === 0) {
        logger.info(`[Internal/Continuous] Session ${sessionId}: No more words to generate`);
        session.isRunning = false;
        break;
      }

      // Create batch job
      const job = await prisma.contentGenerationJob.create({
        data: {
          inputWords: wordsToGenerate.map(w => w.id),
          examCategory: (examCategory || 'CSAT') as any,
          cefrLevel: 'B1',
          status: 'pending',
          progress: 0,
        },
      });

      logger.info(`[Internal/Continuous] Session ${sessionId}: Starting batch ${session.batchesCompleted + 1}/${maxBatches} (Job: ${job.id}, Words: ${wordsToGenerate.length})`);

      // Process the job (this will take time)
      await processGenerationJob(job.id);

      // Update session stats
      session.batchesCompleted++;
      session.wordsProcessed += wordsToGenerate.length;
      session.lastBatchAt = new Date();

      logger.info(`[Internal/Continuous] Session ${sessionId}: Batch ${session.batchesCompleted} completed. Total words: ${session.wordsProcessed}`);

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`[Internal/Continuous] Session ${sessionId} error:`, error);
      session.errors.push(`Batch ${session.batchesCompleted + 1}: ${errorMsg}`);

      // Continue despite errors, but add a longer delay
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  session.isRunning = false;
  logger.info(`[Internal/Continuous] Session ${sessionId} finished. Batches: ${session.batchesCompleted}, Words: ${session.wordsProcessed}`);
}

// ============================================
// Bulk Publish Words
// ============================================

/**
 * GET /internal/publish-ai-words?key=YOUR_SECRET&examCategory=CSAT
 * AI 생성된 단어들을 PUBLISHED 상태로 일괄 변경
 */
router.get('/publish-ai-words', async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string;
    if (!key || key !== process.env.INTERNAL_SECRET_KEY) {
      return res.status(403).json({ error: 'Forbidden: Invalid key' });
    }

    const examCategory = req.query.examCategory as string;

    // Build where clause
    const whereClause: any = {
      status: 'PENDING_REVIEW',
      aiGeneratedAt: { not: null },
    };

    if (examCategory) {
      whereClause.examCategory = examCategory as any;
    }

    // Count before update
    const countBefore = await prisma.word.count({ where: whereClause });

    if (countBefore === 0) {
      return res.json({
        message: 'No words to publish',
        updated: 0,
      });
    }

    // Bulk update to PUBLISHED
    const result = await prisma.word.updateMany({
      where: whereClause,
      data: {
        status: 'PUBLISHED',
        humanReviewed: true,
      },
    });

    logger.info(`[Internal/Publish] Published ${result.count} words${examCategory ? ` for ${examCategory}` : ''}`);

    res.json({
      message: `Successfully published ${result.count} words`,
      updated: result.count,
      examCategory: examCategory || 'all',
    });
  } catch (error) {
    console.error('[Internal/Publish] Error:', error);
    res.status(500).json({ error: 'Publish failed', details: String(error) });
  }
});

/**
 * GET /internal/word-status-stats?key=YOUR_SECRET
 * 단어 상태별 통계 조회
 */
router.get('/word-status-stats', async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string;
    if (!key || key !== process.env.INTERNAL_SECRET_KEY) {
      return res.status(403).json({ error: 'Forbidden: Invalid key' });
    }

    // Group by status
    const statusStats = await prisma.word.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    // Group by status and examCategory
    const examStats = await prisma.word.groupBy({
      by: ['status', 'examCategory'],
      _count: { status: true },
    });

    // Count with AI content
    const withAiContent = await prisma.word.count({
      where: { aiGeneratedAt: { not: null } },
    });

    res.json({
      byStatus: statusStats.reduce((acc, s) => {
        acc[s.status] = s._count.status;
        return acc;
      }, {} as Record<string, number>),
      byExamAndStatus: examStats.map(e => ({
        exam: e.examCategory,
        status: e.status,
        count: e._count.status,
      })),
      totalWithAiContent: withAiContent,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Internal/StatusStats] Error:', error);
    res.status(500).json({ error: 'Stats failed' });
  }
});

// ============================================
// Word Deduplication Endpoints
// ============================================

/**
 * GET /internal/deduplication-stats?key=SECRET&source=CSAT&target=TOEFL
 * 두 시험 간 중복 통계 조회
 */
router.get('/deduplication-stats', async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string;
    if (!key || key !== process.env.INTERNAL_SECRET_KEY) {
      return res.status(403).json({ error: 'Forbidden: Invalid key' });
    }

    const { source = 'CSAT', target } = req.query;

    if (!target) {
      return res.status(400).json({ error: 'target exam required' });
    }

    const stats = await getDeduplicationStats(
      source as string,
      target as string
    );

    res.json(stats);
  } catch (error) {
    console.error('[Internal/Deduplication] Stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

/**
 * GET /internal/deduplication-stats-all?key=SECRET&source=CSAT
 * 모든 시험에 대한 중복 통계 일괄 조회
 */
router.get('/deduplication-stats-all', async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string;
    if (!key || key !== process.env.INTERNAL_SECRET_KEY) {
      return res.status(403).json({ error: 'Forbidden: Invalid key' });
    }

    const { source = 'CSAT' } = req.query;

    const stats = await getAllDeduplicationStats(source as string);

    // Calculate totals
    const totals = {
      totalOverlap: 0,
      totalNew: 0,
      totalSavings: 0,
      totalCost: 0,
    };

    for (const exam of Object.keys(stats)) {
      totals.totalOverlap += stats[exam].overlapCount;
      totals.totalNew += stats[exam].newWordsNeeded;
      totals.totalSavings += stats[exam].estimatedSavings;
      totals.totalCost += stats[exam].estimatedCost;
    }

    res.json({
      source,
      byExam: stats,
      totals,
      costPerWord: COST_PER_WORD,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Internal/Deduplication] Stats all error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

/**
 * POST /internal/check-duplicates
 * 단어 목록 중복 체크
 */
router.post('/check-duplicates', async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string || req.body.key;
    if (!key || key !== process.env.INTERNAL_SECRET_KEY) {
      return res.status(403).json({ error: 'Forbidden: Invalid key' });
    }

    const { words, targetExam } = req.body;

    if (!words || !Array.isArray(words)) {
      return res.status(400).json({ error: 'words array required' });
    }

    const results = await checkDuplicates(words, targetExam || 'CSAT');

    const newWords = results.filter((r) => r.isNew);
    const existingWords = results.filter((r) => !r.isNew);

    res.json({
      total: results.length,
      newCount: newWords.length,
      existingCount: existingWords.length,
      estimatedCost: Number((newWords.length * COST_PER_WORD).toFixed(2)),
      estimatedSavings: Number((existingWords.length * COST_PER_WORD).toFixed(2)),
      results,
    });
  } catch (error) {
    console.error('[Internal/Deduplication] Check error:', error);
    res.status(500).json({ error: 'Failed to check duplicates' });
  }
});

/**
 * POST /internal/seed-exam
 * 시험별 단어 시드 (중복 체크 포함)
 */
router.post('/seed-exam', async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string || req.body.key;
    if (!key || key !== process.env.INTERNAL_SECRET_KEY) {
      return res.status(403).json({ error: 'Forbidden: Invalid key' });
    }

    const { exam, wordList, reuseContent = true, dryRun = true } = req.body;

    if (!exam) {
      return res.status(400).json({ error: 'exam required' });
    }

    if (!wordList || !Array.isArray(wordList)) {
      return res.status(400).json({ error: 'wordList array required' });
    }

    // Import seed function dynamically to avoid circular dependency
    const { seedExamWords } = await import('../scripts/seedExamWords');

    const result = await seedExamWords({
      exam,
      wordList,
      reuseContent,
      dryRun,
    });

    res.json({
      success: true,
      message: `${exam} seed ${dryRun ? '(dry run)' : ''} completed`,
      result,
    });
  } catch (error) {
    console.error('[Internal/Seed] Exam seed error:', error);
    res.status(500).json({ error: 'Failed to seed exam', details: String(error) });
  }
});

// ============================================
// Continuous Image Generation
// ============================================

// Track active continuous image generation sessions
const activeImageSessions: Map<string, {
  isRunning: boolean;
  batchesCompleted: number;
  imagesGenerated: number;
  wordsProcessed: number;
  errors: string[];
  startedAt: Date;
  lastBatchAt: Date | null;
  level?: string;
  examCategory?: string;
  types: VisualType[];
  skipExisting: boolean;
}> = new Map();

/**
 * GET /internal/generate-images-continuous?key=YOUR_SECRET&level=L1&examCategory=CSAT
 * 자동 연속 이미지 생성 (CONCEPT, MNEMONIC, RHYME 전부)
 * - level: L1, L2, L3 필터 (선택사항)
 * - examCategory: CSAT, TEPS, TOEFL 등 (선택사항)
 * - types: CONCEPT,MNEMONIC,RHYME (쉼표 구분, 선택사항)
 * - skipExisting: true/false (기존 이미지 스킵, 기본값 true)
 */
router.get('/generate-images-continuous', async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string;
    if (!key || key !== process.env.INTERNAL_SECRET_KEY) {
      return res.status(403).json({ error: 'Forbidden: Invalid key' });
    }

    const level = req.query.level as string;
    const examCategory = req.query.examCategory as string;
    const typesParam = req.query.types as string;
    const skipExisting = req.query.skipExisting !== 'false'; // Default true

    // Parse visual types
    const types: VisualType[] = typesParam
      ? (typesParam.split(',').filter(t => ['CONCEPT', 'MNEMONIC', 'RHYME'].includes(t)) as VisualType[])
      : ['CONCEPT', 'MNEMONIC', 'RHYME'];

    // Check if there's already an image generation session running
    const existingSession = Array.from(activeImageSessions.entries())
      .find(([_, session]) => session.isRunning);

    if (existingSession) {
      return res.json({
        message: 'Image generation already running',
        sessionId: existingSession[0],
        session: existingSession[1],
      });
    }

    // Create session ID
    const sessionId = `image-${Date.now()}`;

    // Initialize session
    activeImageSessions.set(sessionId, {
      isRunning: true,
      batchesCompleted: 0,
      imagesGenerated: 0,
      wordsProcessed: 0,
      errors: [],
      startedAt: new Date(),
      lastBatchAt: null,
      level,
      examCategory,
      types,
      skipExisting,
    });

    // Start the continuous image generation process
    runContinuousImageGeneration(sessionId, level, examCategory, types, skipExisting);

    logger.info(`[Internal/ImageGen] Started session ${sessionId}: level=${level || 'all'}, examCategory=${examCategory || 'all'}, types=${types.join(',')}, skipExisting=${skipExisting}`);

    res.json({
      message: 'Continuous image generation started',
      sessionId,
      config: {
        level: level || 'all',
        examCategory: examCategory || 'all',
        types,
        skipExisting,
      },
    });
  } catch (error) {
    console.error('[Internal/ImageGen] Error:', error);
    res.status(500).json({ error: 'Failed to start image generation', details: String(error) });
  }
});

/**
 * GET /internal/image-generation-status?key=YOUR_SECRET
 * 이미지 생성 세션 상태 확인
 */
router.get('/image-generation-status', async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string;
    if (!key || key !== process.env.INTERNAL_SECRET_KEY) {
      return res.status(403).json({ error: 'Forbidden: Invalid key' });
    }

    const sessions = Array.from(activeImageSessions.entries()).map(([id, session]) => ({
      sessionId: id,
      ...session,
      runningTime: session.isRunning
        ? Math.round((Date.now() - session.startedAt.getTime()) / 1000) + 's'
        : null,
    }));

    // Get image stats from database
    const [totalVisuals, visualsByType] = await Promise.all([
      prisma.wordVisual.count(),
      prisma.wordVisual.groupBy({
        by: ['type'],
        _count: { type: true },
      }),
    ]);

    // Get words that need images (PUBLISHED + PENDING_REVIEW with aiGeneratedAt)
    const wordsWithContent = await prisma.word.count({
      where: {
        aiGeneratedAt: { not: null },
        status: { in: ['PUBLISHED', 'PENDING_REVIEW'] },
      },
    });

    // Get words that have all 3 image types
    const wordsWithAllImages = await prisma.word.count({
      where: {
        aiGeneratedAt: { not: null },
        visuals: {
          some: { type: 'CONCEPT' },
        },
        AND: [
          { visuals: { some: { type: 'MNEMONIC' } } },
          { visuals: { some: { type: 'RHYME' } } },
        ],
      },
    });

    res.json({
      activeSessions: sessions.filter(s => s.isRunning),
      completedSessions: sessions.filter(s => !s.isRunning).slice(-5),
      imageStats: {
        totalVisuals,
        byType: visualsByType.reduce((acc, v) => {
          acc[v.type] = v._count.type;
          return acc;
        }, {} as Record<string, number>),
        wordsWithContent,
        wordsWithAllImages,
        wordsNeedingImages: wordsWithContent - wordsWithAllImages,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Internal/ImageGenStatus] Error:', error);
    res.status(500).json({ error: 'Status check failed' });
  }
});

/**
 * GET /internal/stop-image-generation?key=YOUR_SECRET&sessionId=xxx
 * 이미지 생성 중지
 */
router.get('/stop-image-generation', async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string;
    if (!key || key !== process.env.INTERNAL_SECRET_KEY) {
      return res.status(403).json({ error: 'Forbidden: Invalid key' });
    }

    const sessionId = req.query.sessionId as string;

    if (sessionId) {
      const session = activeImageSessions.get(sessionId);
      if (session) {
        session.isRunning = false;
        return res.json({ message: `Session ${sessionId} stopped`, session });
      }
      return res.status(404).json({ error: 'Session not found' });
    }

    // Stop all sessions
    let stoppedCount = 0;
    activeImageSessions.forEach((session) => {
      if (session.isRunning) {
        session.isRunning = false;
        stoppedCount++;
      }
    });

    res.json({ message: `Stopped ${stoppedCount} image generation sessions` });
  } catch (error) {
    console.error('[Internal/StopImageGen] Error:', error);
    res.status(500).json({ error: 'Failed to stop' });
  }
});

// Helper function to run continuous image generation
async function runContinuousImageGeneration(
  sessionId: string,
  level?: string,
  examCategory?: string,
  types: VisualType[] = ['CONCEPT', 'MNEMONIC', 'RHYME'],
  skipExisting: boolean = true
): Promise<void> {
  const session = activeImageSessions.get(sessionId);
  if (!session) return;

  // Process words one at a time to avoid rate limits
  while (session.isRunning) {
    try {
      // Build where clause for words that have AI content
      const whereClause: any = {
        aiGeneratedAt: { not: null },
        status: { in: ['PUBLISHED', 'PENDING_REVIEW'] },
      };

      if (level && ['L1', 'L2', 'L3'].includes(level)) {
        whereClause.level = level;
      }
      if (examCategory) {
        whereClause.examCategory = examCategory as any;
      }

      // Find next word that needs images
      const words = await prisma.word.findMany({
        where: whereClause,
        include: {
          visuals: { select: { type: true } },
          mnemonics: { take: 1, orderBy: { rating: 'desc' } },
        },
        orderBy: { frequency: 'desc' }, // High frequency first
        take: 10, // Get a batch to check
      });

      // Find the first word that needs at least one image type
      let wordToProcess: typeof words[number] | null = null;
      let typesToGenerate: VisualType[] = [];

      for (const word of words) {
        const existingTypes = new Set(word.visuals.map(v => v.type));
        const missingTypes = types.filter(t => !existingTypes.has(t));

        if (missingTypes.length > 0) {
          wordToProcess = word;
          typesToGenerate = skipExisting ? missingTypes : types;
          break;
        }
      }

      if (!wordToProcess) {
        // Try to find more words
        const totalRemaining = await prisma.word.count({
          where: {
            ...whereClause,
            visuals: {
              none: {
                type: { in: types },
              },
            },
          },
        });

        if (totalRemaining === 0) {
          logger.info(`[Internal/ImageGen] Session ${sessionId}: No more words need images`);
          session.isRunning = false;
          break;
        }

        // Find word without any required images
        const wordWithoutImages = await prisma.word.findFirst({
          where: {
            ...whereClause,
            visuals: {
              none: {
                type: { in: types },
              },
            },
          },
          include: {
            visuals: { select: { type: true } },
            mnemonics: { take: 1, orderBy: { rating: 'desc' } },
          },
          orderBy: { frequency: 'desc' },
        });

        if (!wordWithoutImages) {
          logger.info(`[Internal/ImageGen] Session ${sessionId}: All images generated`);
          session.isRunning = false;
          break;
        }

        wordToProcess = wordWithoutImages;
        const existingTypes = new Set(wordWithoutImages.visuals.map(v => v.type));
        typesToGenerate = skipExisting
          ? types.filter(t => !existingTypes.has(t))
          : types;
      }

      // Ensure we have a word to process
      if (!wordToProcess) {
        logger.info(`[Internal/ImageGen] Session ${sessionId}: No word found to process`);
        session.isRunning = false;
        break;
      }

      const currentWord = wordToProcess; // TypeScript guard
      logger.info(`[Internal/ImageGen] Session ${sessionId}: Processing "${currentWord.word}" - types: ${typesToGenerate.join(', ')}`);

      // Generate images for each type
      for (const visualType of typesToGenerate) {
        if (!session.isRunning) break;

        try {
          let prompt: string;
          let captionKo: string;
          let captionEn: string;

          if (visualType === 'CONCEPT') {
            prompt = generateConceptPrompt(currentWord.definition || '', currentWord.word);
            captionKo = currentWord.definitionKo || currentWord.definition || '';
            captionEn = currentWord.definition || '';
          } else if (visualType === 'MNEMONIC') {
            const firstMnemonic = currentWord.mnemonics?.[0];
            const mnemonicContent = firstMnemonic?.content;
            const mnemonicKorean = firstMnemonic?.koreanHint;

            if (mnemonicContent) {
              // Use Claude to extract a scene for better image quality
              const sceneResult = await extractMnemonicScene(
                currentWord.word,
                currentWord.definition || '',
                mnemonicContent,
                mnemonicKorean || ''
              );
              prompt = sceneResult.prompt;
              captionKo = sceneResult.captionKo;
              captionEn = sceneResult.captionEn;
            } else {
              prompt = generateMnemonicPrompt(currentWord.word, currentWord.word);
              captionKo = currentWord.definitionKo || '';
              captionEn = `Memory tip for ${currentWord.word}`;
            }
          } else {
            // RHYME
            const rhymingWords = (currentWord.rhymingWords || []) as string[];

            if (rhymingWords.length > 0) {
              const rhymeResult = await generateRhymeScene(
                currentWord.word,
                currentWord.definition || '',
                rhymingWords
              );
              prompt = rhymeResult.prompt;
              captionKo = rhymeResult.captionKo;
              captionEn = rhymeResult.captionEn;
            } else {
              prompt = generateRhymePrompt(currentWord.definition || '', currentWord.word);
              captionKo = `${currentWord.word} 발음 연습`;
              captionEn = `Pronunciation practice for ${currentWord.word}`;
            }
          }

          // Generate and upload the image
          const result = await generateAndUploadImage(prompt, visualType, currentWord.word);

          if (result) {
            // Delete existing visual if replacing
            if (!skipExisting) {
              await prisma.wordVisual.deleteMany({
                where: { wordId: currentWord.id, type: visualType },
              });
            }

            // Create visual record
            await prisma.wordVisual.create({
              data: {
                wordId: currentWord.id,
                type: visualType,
                imageUrl: result.imageUrl,
                promptEn: prompt,
                captionKo,
                captionEn,
              },
            });

            session.imagesGenerated++;
            logger.info(`[Internal/ImageGen] Session ${sessionId}: Generated ${visualType} for "${currentWord.word}"`);
          }

          // Add delay between image generations to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 3000));

        } catch (imageError) {
          const errorMsg = imageError instanceof Error ? imageError.message : String(imageError);
          logger.error(`[Internal/ImageGen] Session ${sessionId}: Error generating ${visualType} for "${currentWord.word}":`, imageError);
          session.errors.push(`${currentWord.word}-${visualType}: ${errorMsg}`);

          // Continue with next type despite error
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }

      session.wordsProcessed++;
      session.batchesCompleted++;
      session.lastBatchAt = new Date();

      logger.info(`[Internal/ImageGen] Session ${sessionId}: Completed "${currentWord.word}". Total: ${session.wordsProcessed} words, ${session.imagesGenerated} images`);

      // Delay between words
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`[Internal/ImageGen] Session ${sessionId} error:`, error);
      session.errors.push(`Batch ${session.batchesCompleted + 1}: ${errorMsg}`);

      // Continue despite errors, but add a longer delay
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }

  session.isRunning = false;
  logger.info(`[Internal/ImageGen] Session ${sessionId} finished. Words: ${session.wordsProcessed}, Images: ${session.imagesGenerated}`);
}

// ============================================
// TEPS Smart Seed (Archive + Content Copy)
// ============================================

// Load TEPS words from JSON file
import * as fs from 'fs';
import * as path from 'path';

interface TepsWordsData {
  exam: string;
  totalWords: number;
  levels: {
    L1: { count: number; description: string; words: string[] };
    L2: { count: number; description: string; words: string[] };
    L3: { count: number; description: string; words: string[] };
  };
}

function loadTepsWords(): TepsWordsData {
  const dataPath = path.join(__dirname, '../../data/teps-words.json');
  return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
}

/**
 * GET /internal/archive-old-teps?key=YOUR_SECRET
 * 구버전 TEPS 단어들을 ARCHIVED 상태로 변경 (콘텐츠는 보존)
 */
router.get('/archive-old-teps', async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string;
    if (!key || key !== process.env.INTERNAL_SECRET_KEY) {
      return res.status(403).json({ error: 'Forbidden: Invalid key' });
    }

    const dryRun = req.query.dryRun === 'true';

    // Count current TEPS words
    const currentCount = await prisma.word.count({
      where: {
        examCategory: 'TEPS',
        status: { not: 'ARCHIVED' },
      },
    });

    if (currentCount === 0) {
      return res.json({
        message: 'No TEPS words to archive',
        archivedCount: 0,
      });
    }

    if (dryRun) {
      return res.json({
        message: '[DRY RUN] Would archive TEPS words',
        wouldArchive: currentCount,
        dryRun: true,
      });
    }

    // Archive old TEPS words by changing status
    const result = await prisma.word.updateMany({
      where: {
        examCategory: 'TEPS',
        status: { not: 'ARCHIVED' },
      },
      data: {
        status: 'ARCHIVED',
      },
    });

    logger.info(`[Internal/Archive] Archived ${result.count} old TEPS words`);

    res.json({
      message: `Successfully archived ${result.count} old TEPS words`,
      archivedCount: result.count,
    });
  } catch (error) {
    console.error('[Internal/Archive] Error:', error);
    res.status(500).json({ error: 'Archive failed', details: String(error) });
  }
});

/**
 * GET /internal/seed-teps-smart?key=YOUR_SECRET&level=L1&batchSize=100
 * 스마트 TEPS 시드 (배치 처리 지원):
 * - 기존 DB 전체에서 단어 검색 (CSAT, 구 TEPS, 모든 상태)
 * - 있으면: 콘텐츠 복사해서 새 TEPS 생성
 * - 없으면: DRAFT로 생성
 * - batchSize: 한 번에 처리할 단어 수 (기본 100, 타임아웃 방지)
 * - 이미 존재하는 단어는 자동 스킵 → 여러 번 호출해도 안전
 */
router.get('/seed-teps-smart', async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string;
    if (!key || key !== process.env.INTERNAL_SECRET_KEY) {
      return res.status(403).json({ error: 'Forbidden: Invalid key' });
    }

    const level = (req.query.level as string) || 'L1';
    const dryRun = req.query.dryRun === 'true';
    const batchSize = Math.min(parseInt(req.query.batchSize as string) || 100, 200); // 기본 100, 최대 200

    if (!['L1', 'L2', 'L3'].includes(level)) {
      return res.status(400).json({ error: 'Invalid level. Use L1, L2, or L3' });
    }

    // Load TEPS words
    const tepsData = loadTepsWords();
    const levelKey = level as 'L1' | 'L2' | 'L3';
    const allWords = tepsData.levels[levelKey].words;

    logger.info(`[Internal/SmartSeed] Starting TEPS ${level} smart seed: ${allWords.length} total words, batchSize=${batchSize}`);

    // Check which words already exist in TEPS (INCLUDING archived ones to avoid duplicates)
    // 직접 rawQuery 사용으로 확실하게 체크
    logger.info(`[Internal/SmartSeed] Querying existing TEPS words...`);

    const existingTepsWords = await prisma.word.findMany({
      where: {
        examCategory: 'TEPS',
      },
      select: { word: true },
    });

    logger.info(`[Internal/SmartSeed] Found ${existingTepsWords.length} existing TEPS words in DB`);

    // Create set with lowercase normalized words
    const existingTepsSet = new Set<string>();
    for (const w of existingTepsWords) {
      if (w.word) {
        existingTepsSet.add(w.word.toLowerCase().trim());
      }
    }

    // Log some sample words for debugging
    const sampleExisting = Array.from(existingTepsSet).slice(0, 5);
    logger.info(`[Internal/SmartSeed] existingTepsSet size: ${existingTepsSet.size}, samples: ${sampleExisting.join(', ')}`);

    // Filter out words that already exist in TEPS (including archived), then take batchSize
    const allWordsToProcess: string[] = [];
    for (const w of allWords) {
      const normalized = w.toLowerCase().trim();
      if (!existingTepsSet.has(normalized)) {
        allWordsToProcess.push(w);
      }
    }
    const wordsToProcess = allWordsToProcess.slice(0, batchSize);

    logger.info(`[Internal/SmartSeed] After filtering: ${allWordsToProcess.length} words to process, taking ${wordsToProcess.length} for this batch`);

    if (wordsToProcess.length === 0) {
      return res.json({
        message: `All ${level} words already exist in TEPS`,
        alreadyExist: existingTepsWords.length,
        processed: 0,
      });
    }

    // Find all matching words from ANY source (CSAT, archived TEPS, etc.)
    const sourceWords = await prisma.word.findMany({
      where: {
        word: { in: wordsToProcess.map(w => w.toLowerCase()), mode: 'insensitive' },
      },
      include: {
        etymology: true,
        mnemonics: true,
        examples: true,
        collocations: true,
        synonyms: true,
        antonyms: true,
        rhymes: true,
        visuals: true,
      },
      orderBy: [
        { aiGeneratedAt: 'desc' }, // Prefer words with AI content
        { status: 'asc' }, // PUBLISHED first
      ],
    });

    // Create a map of source words by lowercase word
    const sourceWordMap = new Map<string, typeof sourceWords[number]>();
    for (const word of sourceWords) {
      const key = word.word.toLowerCase();
      // Only add if not already in map (first one wins, which should be best quality)
      if (!sourceWordMap.has(key)) {
        sourceWordMap.set(key, word);
      }
    }

    const result = {
      level,
      totalWords: allWords.length,
      alreadyExist: existingTepsSet.size,
      remaining: allWordsToProcess.length - wordsToProcess.length, // 이번 배치 이후 남은 단어
      batchSize: wordsToProcess.length,
      copiedFromCsat: 0,
      copiedFromTepsArchive: 0,
      copiedFromOther: 0,
      createdNew: 0,
      errors: [] as string[],
      details: [] as { word: string; action: string; source?: string }[],
    };

    const difficultyMap: Record<string, 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'> = {
      L1: 'INTERMEDIATE',
      L2: 'INTERMEDIATE',
      L3: 'ADVANCED',
    };

    let skippedDuplicates = 0;

    for (const wordText of wordsToProcess) {
      const normalized = wordText.toLowerCase().trim();
      const sourceWord = sourceWordMap.get(normalized);

      if (dryRun) {
        if (sourceWord) {
          result.details.push({
            word: normalized,
            action: 'would_copy',
            source: `${sourceWord.examCategory} (${sourceWord.status})`,
          });
          if (sourceWord.examCategory === 'CSAT') result.copiedFromCsat++;
          else if (sourceWord.examCategory === 'TEPS') result.copiedFromTepsArchive++;
          else result.copiedFromOther++;
        } else {
          result.details.push({ word: normalized, action: 'would_create_draft' });
          result.createdNew++;
        }
        continue;
      }

      // CRITICAL: Double-check that word doesn't already exist in TEPS before creating
      // This catches any race conditions or filtering issues
      const existingCheck = await prisma.word.findFirst({
        where: {
          word: { equals: normalized, mode: 'insensitive' },
          examCategory: 'TEPS',
        },
        select: { id: true, word: true },
      });

      if (existingCheck) {
        skippedDuplicates++;
        result.details.push({
          word: normalized,
          action: 'skipped_exists',
          source: `Already exists: ${existingCheck.word}`,
        });
        continue;
      }

      try {
        if (sourceWord) {
          // Copy content from source word
          const newWord = await prisma.word.create({
            data: {
              word: normalized,
              definition: sourceWord.definition,
              definitionKo: sourceWord.definitionKo,
              pronunciation: sourceWord.pronunciation,
              phonetic: sourceWord.phonetic,
              partOfSpeech: sourceWord.partOfSpeech,
              difficulty: difficultyMap[level],
              cefrLevel: sourceWord.cefrLevel,
              examCategory: 'TEPS',
              level,
              frequency: sourceWord.frequency,
              tags: sourceWord.tags,
              tips: sourceWord.tips,
              commonMistakes: sourceWord.commonMistakes,
              ipaUs: sourceWord.ipaUs,
              ipaUk: sourceWord.ipaUk,
              audioUrlUs: sourceWord.audioUrlUs,
              audioUrlUk: sourceWord.audioUrlUk,
              prefix: sourceWord.prefix,
              root: sourceWord.root,
              suffix: sourceWord.suffix,
              morphologyNote: sourceWord.morphologyNote,
              synonymList: sourceWord.synonymList,
              antonymList: sourceWord.antonymList,
              rhymingWords: sourceWord.rhymingWords,
              relatedWords: sourceWord.relatedWords,
              status: sourceWord.aiGeneratedAt ? 'PENDING_REVIEW' : 'DRAFT',
              aiModel: sourceWord.aiModel,
              aiGeneratedAt: sourceWord.aiGeneratedAt,
              aiPromptVersion: sourceWord.aiPromptVersion,
            },
          });

          // Copy related content
          if (sourceWord.etymology) {
            await prisma.etymology.create({
              data: {
                wordId: newWord.id,
                origin: sourceWord.etymology.origin,
                language: sourceWord.etymology.language,
                evolution: sourceWord.etymology.evolution,
                breakdown: sourceWord.etymology.breakdown,
              },
            });
          }

          if (sourceWord.mnemonics.length > 0) {
            await prisma.mnemonic.createMany({
              data: sourceWord.mnemonics.map(m => ({
                wordId: newWord.id,
                title: m.title,
                content: m.content,
                koreanHint: m.koreanHint,
                imageUrl: m.imageUrl,
                whiskPrompt: m.whiskPrompt,
                source: m.source,
                rating: m.rating,
              })),
            });
          }

          if (sourceWord.examples.length > 0) {
            await prisma.example.createMany({
              data: sourceWord.examples.map(e => ({
                wordId: newWord.id,
                sentence: e.sentence,
                translation: e.translation,
                audioUrl: e.audioUrl,
                source: e.source,
                isFunny: e.isFunny,
                isReal: e.isReal,
                order: e.order,
              })),
            });
          }

          if (sourceWord.collocations.length > 0) {
            await prisma.collocation.createMany({
              data: sourceWord.collocations.map(c => ({
                wordId: newWord.id,
                phrase: c.phrase,
                translation: c.translation,
                type: c.type,
                exampleEn: c.exampleEn,
                exampleKo: c.exampleKo,
                order: c.order,
              })),
            });
          }

          if (sourceWord.synonyms.length > 0) {
            await prisma.synonym.createMany({
              data: sourceWord.synonyms.map(s => ({
                wordId: newWord.id,
                synonym: s.synonym,
              })),
            });
          }

          if (sourceWord.antonyms.length > 0) {
            await prisma.antonym.createMany({
              data: sourceWord.antonyms.map(a => ({
                wordId: newWord.id,
                antonym: a.antonym,
              })),
            });
          }

          if (sourceWord.rhymes.length > 0) {
            await prisma.rhyme.createMany({
              data: sourceWord.rhymes.map(r => ({
                wordId: newWord.id,
                rhymingWord: r.rhymingWord,
                similarity: r.similarity,
                example: r.example,
              })),
            });
          }

          // Copy visuals (images)
          if (sourceWord.visuals.length > 0) {
            await prisma.wordVisual.createMany({
              data: sourceWord.visuals.map(v => ({
                wordId: newWord.id,
                type: v.type,
                imageUrl: v.imageUrl,
                promptEn: v.promptEn,
                captionKo: v.captionKo,
                captionEn: v.captionEn,
                labelKo: v.labelKo,
                labelEn: v.labelEn,
                order: v.order,
              })),
            });
          }

          // Create WordExamLevel mapping
          await prisma.wordExamLevel.create({
            data: {
              wordId: newWord.id,
              examCategory: 'TEPS',
              level,
              frequency: sourceWord.frequency,
            },
          });

          result.details.push({
            word: normalized,
            action: 'copied',
            source: `${sourceWord.examCategory} (${sourceWord.status})`,
          });

          if (sourceWord.examCategory === 'CSAT') result.copiedFromCsat++;
          else if (sourceWord.examCategory === 'TEPS') result.copiedFromTepsArchive++;
          else result.copiedFromOther++;

        } else {
          // Create new DRAFT word
          const newWord = await prisma.word.create({
            data: {
              word: normalized,
              definition: '',
              partOfSpeech: 'NOUN',
              difficulty: difficultyMap[level],
              examCategory: 'TEPS',
              level,
              frequency: 100,
              status: 'DRAFT',
            },
          });

          // Create WordExamLevel mapping
          await prisma.wordExamLevel.create({
            data: {
              wordId: newWord.id,
              examCategory: 'TEPS',
              level,
              frequency: 100,
            },
          });

          result.details.push({ word: normalized, action: 'created_draft' });
          result.createdNew++;
        }
      } catch (error: any) {
        const errorMsg = error.code === 'P2002' ? 'duplicate' : error.message;
        result.errors.push(`${normalized}: ${errorMsg}`);
        logger.error(`[Internal/SmartSeed] Error processing ${normalized}:`, error);
      }
    }

    const totalCopied = result.copiedFromCsat + result.copiedFromTepsArchive + result.copiedFromOther;
    const estimatedSavings = totalCopied * 0.03; // $0.03 per word

    logger.info(`[Internal/SmartSeed] TEPS ${level} completed: copied=${totalCopied}, new=${result.createdNew}, skipped=${skippedDuplicates}, errors=${result.errors.length}`);

    const hasMore = result.remaining > 0;

    res.json({
      message: `TEPS ${level} smart seed ${dryRun ? '(DRY RUN) ' : ''}completed`,
      dryRun,
      summary: {
        totalWords: result.totalWords,
        alreadyExist: result.alreadyExist,
        processedThisBatch: wordsToProcess.length,
        skippedDuplicates, // 중복 체크로 스킵된 단어 수
        remaining: result.remaining,
        copied: totalCopied,
        copiedFromCsat: result.copiedFromCsat,
        copiedFromTepsArchive: result.copiedFromTepsArchive,
        copiedFromOther: result.copiedFromOther,
        createdNew: result.createdNew,
        errors: result.errors.length,
        estimatedSavings: `$${estimatedSavings.toFixed(2)}`,
      },
      progress: {
        done: result.alreadyExist + wordsToProcess.length,
        total: result.totalWords,
        percent: Math.round(((result.alreadyExist + wordsToProcess.length) / result.totalWords) * 100),
      },
      hasMore,
      nextStep: hasMore
        ? `남은 ${result.remaining}개 처리: 같은 URL 다시 호출`
        : `${level} 완료! 다음 레벨 진행`,
      errors: result.errors.slice(0, 20),
      details: dryRun ? result.details.slice(0, 50) : undefined,
    });
  } catch (error) {
    console.error('[Internal/SmartSeed] Error:', error);
    res.status(500).json({ error: 'Smart seed failed', details: String(error) });
  }
});

/**
 * GET /internal/activate-teps-words?key=YOUR_SECRET&level=L1
 * ARCHIVED 상태인 TEPS 단어들을 활성화 (DRAFT로 변경)
 * - 새 TEPS 리스트에 있는 단어 중 ARCHIVED 상태인 것만 활성화
 * - level 설정 및 examCategory 유지
 */
router.get('/activate-teps-words', async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string;
    if (!key || key !== process.env.INTERNAL_SECRET_KEY) {
      return res.status(403).json({ error: 'Forbidden: Invalid key' });
    }

    const level = (req.query.level as string) || 'L1';
    const dryRun = req.query.dryRun === 'true';

    if (!['L1', 'L2', 'L3'].includes(level)) {
      return res.status(400).json({ error: 'Invalid level. Use L1, L2, or L3' });
    }

    // Load TEPS words for this level
    const tepsData = loadTepsWords();
    const levelKey = level as 'L1' | 'L2' | 'L3';
    const targetWords = tepsData.levels[levelKey].words.map(w => w.toLowerCase().trim());

    logger.info(`[Internal/Activate] Starting TEPS ${level} activation: ${targetWords.length} target words`);

    // Find ARCHIVED TEPS words that are in the target list
    const archivedWords = await prisma.word.findMany({
      where: {
        examCategory: 'TEPS',
        status: 'ARCHIVED',
        word: { in: targetWords, mode: 'insensitive' },
      },
      select: { id: true, word: true, aiGeneratedAt: true },
    });

    logger.info(`[Internal/Activate] Found ${archivedWords.length} ARCHIVED words to activate`);

    // Find already active words (for reporting)
    const activeWords = await prisma.word.findMany({
      where: {
        examCategory: 'TEPS',
        status: { not: 'ARCHIVED' },
        level,
        word: { in: targetWords, mode: 'insensitive' },
      },
      select: { id: true, word: true },
    });

    if (dryRun) {
      return res.json({
        message: `[DRY RUN] Would activate ${archivedWords.length} ARCHIVED words for ${level}`,
        dryRun: true,
        summary: {
          targetWords: targetWords.length,
          archivedToActivate: archivedWords.length,
          alreadyActive: activeWords.length,
          withContent: archivedWords.filter(w => w.aiGeneratedAt).length,
        },
        sampleWords: archivedWords.slice(0, 20).map(w => w.word),
      });
    }

    // Activate: change status from ARCHIVED to DRAFT (or PENDING_REVIEW if has content)
    let activatedCount = 0;
    let withContentCount = 0;
    const errors: string[] = [];

    for (const word of archivedWords) {
      try {
        const newStatus = word.aiGeneratedAt ? 'PENDING_REVIEW' : 'DRAFT';

        await prisma.word.update({
          where: { id: word.id },
          data: {
            status: newStatus,
            level,
          },
        });

        // Check if WordExamLevel mapping exists, create if not
        const existingMapping = await prisma.wordExamLevel.findFirst({
          where: {
            wordId: word.id,
            examCategory: 'TEPS',
          },
        });

        if (existingMapping) {
          // Update level
          await prisma.wordExamLevel.update({
            where: { id: existingMapping.id },
            data: { level },
          });
        } else {
          // Create new mapping
          await prisma.wordExamLevel.create({
            data: {
              wordId: word.id,
              examCategory: 'TEPS',
              level,
              frequency: 100,
            },
          });
        }

        activatedCount++;
        if (word.aiGeneratedAt) withContentCount++;

      } catch (error: any) {
        errors.push(`${word.word}: ${error.message}`);
        logger.error(`[Internal/Activate] Error activating ${word.word}:`, error);
      }
    }

    logger.info(`[Internal/Activate] TEPS ${level} activation completed: ${activatedCount} activated, ${withContentCount} with content`);

    // Get final counts
    const finalActiveCount = await prisma.word.count({
      where: {
        examCategory: 'TEPS',
        status: { not: 'ARCHIVED' },
        level,
      },
    });

    res.json({
      message: `TEPS ${level} activation completed`,
      summary: {
        targetWords: targetWords.length,
        archivedFound: archivedWords.length,
        activated: activatedCount,
        withContent: withContentCount,
        alreadyActive: activeWords.length,
        totalActiveNow: finalActiveCount,
        errors: errors.length,
      },
      nextStep: finalActiveCount < targetWords.length
        ? `아직 ${targetWords.length - finalActiveCount}개 부족. seed-teps-smart 호출 필요`
        : `${level} 완료! 총 ${finalActiveCount}개 활성화됨`,
      errors: errors.slice(0, 20),
    });
  } catch (error) {
    console.error('[Internal/Activate] Error:', error);
    res.status(500).json({ error: 'Activation failed', details: String(error) });
  }
});

/**
 * GET /internal/reassign-teps-levels?key=YOUR_SECRET
 * 균형 배분 리스트 기반 TEPS 레벨 재배정 (콘텐츠/이미지 유지)
 * - teps-words-balanced.json 파일 사용 (L1: 853, L2: 853, L3: 883)
 */
router.get('/reassign-teps-levels', async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string;
    if (!key || key !== process.env.INTERNAL_SECRET_KEY) {
      return res.status(403).json({ error: 'Forbidden: Invalid key' });
    }

    const dryRun = req.query.dryRun === 'true';

    // Load balanced TEPS words
    const balancedDataPath = path.join(__dirname, '../../data/teps-words-balanced.json');
    const balancedData = JSON.parse(fs.readFileSync(balancedDataPath, 'utf-8'));

    const l1Words = new Set(balancedData.L1.words.map((w: string) => w.toLowerCase().trim()));
    const l2Words = new Set(balancedData.L2.words.map((w: string) => w.toLowerCase().trim()));
    const l3Words = new Set(balancedData.L3.words.map((w: string) => w.toLowerCase().trim()));

    logger.info(`[Internal/Reassign] Starting TEPS level reassignment with balanced list (dryRun=${dryRun})`);
    logger.info(`[Internal/Reassign] Balanced list: L1=${l1Words.size}, L2=${l2Words.size}, L3=${l3Words.size}`);

    // Get all active TEPS words
    const tepsWords = await prisma.word.findMany({
      where: {
        examCategory: 'TEPS',
        status: { not: 'ARCHIVED' },
      },
      select: { id: true, word: true, level: true },
    });

    logger.info(`[Internal/Reassign] Found ${tepsWords.length} active TEPS words`);

    const result = {
      totalWords: tepsWords.length,
      updated: { L1: 0, L2: 0, L3: 0 },
      unchanged: 0,
      notInList: 0,
      errors: [] as string[],
      details: [] as { word: string; from: string | null; to: string }[],
    };

    for (const word of tepsWords) {
      const normalized = word.word.toLowerCase().trim();

      // Determine target level from balanced list (no priority needed - each word is in exactly one level)
      let targetLevel: string | null = null;

      if (l1Words.has(normalized)) targetLevel = 'L1';
      else if (l2Words.has(normalized)) targetLevel = 'L2';
      else if (l3Words.has(normalized)) targetLevel = 'L3';

      if (!targetLevel) {
        result.notInList++;
        continue;
      }

      if (word.level === targetLevel) {
        result.unchanged++;
        continue;
      }

      if (dryRun) {
        result.details.push({ word: normalized, from: word.level, to: targetLevel });
        result.updated[targetLevel as 'L1' | 'L2' | 'L3']++;
        continue;
      }

      try {
        // Update word level
        await prisma.word.update({
          where: { id: word.id },
          data: { level: targetLevel },
        });

        // Also update WordExamLevel if exists
        await prisma.wordExamLevel.updateMany({
          where: { wordId: word.id, examCategory: 'TEPS' },
          data: { level: targetLevel },
        });

        result.updated[targetLevel as 'L1' | 'L2' | 'L3']++;
        result.details.push({ word: normalized, from: word.level, to: targetLevel });

      } catch (error: any) {
        result.errors.push(`${normalized}: ${error.message}`);
      }
    }

    logger.info(`[Internal/Reassign] Completed: L1=${result.updated.L1}, L2=${result.updated.L2}, L3=${result.updated.L3}, unchanged=${result.unchanged}`);

    // Get final counts by level
    const finalCounts = await prisma.word.groupBy({
      by: ['level'],
      where: { examCategory: 'TEPS', status: { not: 'ARCHIVED' } },
      _count: { level: true },
    });

    res.json({
      message: `TEPS level reassignment ${dryRun ? '(DRY RUN) ' : ''}completed`,
      dryRun,
      balancedList: {
        L1: l1Words.size,
        L2: l2Words.size,
        L3: l3Words.size,
      },
      summary: {
        totalWords: result.totalWords,
        updated: result.updated,
        totalUpdated: result.updated.L1 + result.updated.L2 + result.updated.L3,
        unchanged: result.unchanged,
        notInList: result.notInList,
        errors: result.errors.length,
      },
      finalCounts: finalCounts.reduce((acc, c) => {
        acc[c.level || 'unknown'] = c._count.level;
        return acc;
      }, {} as Record<string, number>),
      errors: result.errors.slice(0, 20),
      details: dryRun ? result.details.slice(0, 50) : undefined,
    });
  } catch (error) {
    console.error('[Internal/Reassign] Error:', error);
    res.status(500).json({ error: 'Reassignment failed', details: String(error) });
  }
});

/**
 * GET /internal/generate-teps-content-smart?key=YOUR_SECRET&level=L1&batchSize=20
 * 스마트 TEPS 콘텐츠 생성:
 * - CSAT(또는 다른 시험)에 같은 단어가 있고 콘텐츠가 있으면 복사
 * - 없으면 Claude API로 생성
 * - 배치 처리로 타임아웃 방지
 *
 * copyOnly=true일 때: API 호출 없음, 배치 크기 제한 완화 (기본 500, 최대 1000)
 * processAll=true (copyOnly와 함께): 전체 한 번에 처리
 */
router.get('/generate-teps-content-smart', async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string;
    if (!key || key !== process.env.INTERNAL_SECRET_KEY) {
      return res.status(403).json({ error: 'Forbidden: Invalid key' });
    }

    const level = (req.query.level as string) || 'L1';
    const dryRun = req.query.dryRun === 'true';
    const copyOnly = req.query.copyOnly === 'true'; // Only copy, don't generate
    const processAll = req.query.processAll === 'true'; // Process all at once (only with copyOnly)

    // copyOnly=true: no API calls, can handle larger batches (default 500, max 1000)
    // copyOnly=false: API calls, smaller batches (default 20, max 50)
    let batchSize: number;
    if (copyOnly) {
      if (processAll) {
        batchSize = 10000; // Effectively unlimited for single level
      } else {
        batchSize = Math.min(parseInt(req.query.batchSize as string) || 500, 1000);
      }
    } else {
      batchSize = Math.min(parseInt(req.query.batchSize as string) || 20, 50);
    }

    if (!['L1', 'L2', 'L3'].includes(level)) {
      return res.status(400).json({ error: 'Invalid level. Use L1, L2, or L3' });
    }

    logger.info(`[Internal/SmartContent] Starting TEPS ${level} smart content (batchSize=${batchSize}, dryRun=${dryRun}, copyOnly=${copyOnly})`);

    // Get DRAFT TEPS words that need content
    const draftWords = await prisma.word.findMany({
      where: {
        examCategory: 'TEPS',
        level,
        status: 'DRAFT',
        aiGeneratedAt: null,
      },
      select: { id: true, word: true },
      orderBy: { word: 'asc' },
      take: batchSize,
    });

    if (draftWords.length === 0) {
      const remainingTotal = await prisma.word.count({
        where: {
          examCategory: 'TEPS',
          status: 'DRAFT',
          aiGeneratedAt: null,
        },
      });

      return res.json({
        message: `No DRAFT words in ${level} need content`,
        level,
        processed: 0,
        remaining: remainingTotal,
        hasMore: remainingTotal > 0,
        nextLevel: level === 'L1' ? 'L2' : level === 'L2' ? 'L3' : null,
      });
    }

    // Get remaining count for this level
    const remainingCount = await prisma.word.count({
      where: {
        examCategory: 'TEPS',
        level,
        status: 'DRAFT',
        aiGeneratedAt: null,
      },
    });

    // Find matching words in CSAT (or other exams) with content
    const wordTexts = draftWords.map(w => w.word.toLowerCase().trim());

    const sourceWords = await prisma.word.findMany({
      where: {
        word: { in: wordTexts, mode: 'insensitive' },
        examCategory: { not: 'TEPS' },
        aiGeneratedAt: { not: null },
      },
      include: {
        etymology: true,
        mnemonics: true,
        examples: true,
        collocations: true,
        synonyms: true,
        antonyms: true,
        rhymes: true,
      },
    });

    // Create a map for quick lookup
    const sourceMap = new Map<string, typeof sourceWords[0]>();
    for (const sw of sourceWords) {
      sourceMap.set(sw.word.toLowerCase().trim(), sw);
    }

    logger.info(`[Internal/SmartContent] Found ${sourceWords.length} source words with content`);

    const result = {
      processed: 0,
      copied: 0,
      queued: 0,
      skipped: 0,
      errors: [] as string[],
      details: [] as { word: string; action: string; source?: string }[],
    };

    const wordsToGenerate: string[] = [];

    for (const word of draftWords) {
      const normalized = word.word.toLowerCase().trim();
      const sourceWord = sourceMap.get(normalized);

      if (dryRun) {
        if (sourceWord) {
          result.details.push({
            word: normalized,
            action: 'would_copy',
            source: sourceWord.examCategory,
          });
          result.copied++;
        } else if (!copyOnly) {
          result.details.push({ word: normalized, action: 'would_generate' });
          result.queued++;
        } else {
          result.details.push({ word: normalized, action: 'would_skip' });
          result.skipped++;
        }
        result.processed++;
        continue;
      }

      if (sourceWord) {
        // Copy content from source word
        try {
          await prisma.word.update({
            where: { id: word.id },
            data: {
              definition: sourceWord.definition,
              pronunciation: sourceWord.pronunciation,
              phonetic: sourceWord.phonetic,
              ipaUs: sourceWord.ipaUs,
              ipaUk: sourceWord.ipaUk,
              tips: sourceWord.tips,
              commonMistakes: sourceWord.commonMistakes,
              prefix: sourceWord.prefix,
              root: sourceWord.root,
              suffix: sourceWord.suffix,
              morphologyNote: sourceWord.morphologyNote,
              synonymList: sourceWord.synonymList,
              antonymList: sourceWord.antonymList,
              rhymingWords: sourceWord.rhymingWords,
              relatedWords: sourceWord.relatedWords,
              status: 'PENDING_REVIEW',
              aiGeneratedAt: new Date(),
              aiModel: `copied_from_${sourceWord.examCategory}`,
              aiPromptVersion: 'copy_v1',
            },
          });

          // Copy related records
          if (sourceWord.etymology) {
            await prisma.etymology.upsert({
              where: { wordId: word.id },
              create: {
                wordId: word.id,
                origin: sourceWord.etymology.origin,
                language: sourceWord.etymology.language,
                rootWords: sourceWord.etymology.rootWords || [],
                evolution: sourceWord.etymology.evolution,
                relatedWords: sourceWord.etymology.relatedWords || [],
                breakdown: sourceWord.etymology.breakdown,
              },
              update: {
                origin: sourceWord.etymology.origin,
                language: sourceWord.etymology.language,
                rootWords: sourceWord.etymology.rootWords || [],
                evolution: sourceWord.etymology.evolution,
                relatedWords: sourceWord.etymology.relatedWords || [],
                breakdown: sourceWord.etymology.breakdown,
              },
            });
          }

          // Copy mnemonics
          for (const mnemonic of sourceWord.mnemonics) {
            await prisma.mnemonic.create({
              data: {
                wordId: word.id,
                title: mnemonic.title,
                content: mnemonic.content,
                koreanHint: mnemonic.koreanHint,
                source: mnemonic.source,
              },
            });
          }

          // Copy examples
          for (const example of sourceWord.examples) {
            await prisma.example.create({
              data: {
                wordId: word.id,
                sentence: example.sentence,
                translation: example.translation,
                source: example.source,
              },
            });
          }

          // Copy collocations
          for (const collocation of sourceWord.collocations) {
            await prisma.collocation.create({
              data: {
                wordId: word.id,
                phrase: collocation.phrase,
                translation: collocation.translation,
                exampleEn: collocation.exampleEn,
              },
            });
          }

          result.copied++;
          result.details.push({
            word: normalized,
            action: 'copied',
            source: sourceWord.examCategory,
          });

        } catch (error: any) {
          result.errors.push(`${normalized}: ${error.message}`);
          logger.error(`[Internal/SmartContent] Error copying ${normalized}:`, error);
        }
      } else if (!copyOnly) {
        // Queue for generation
        wordsToGenerate.push(word.id);
        result.queued++;
        result.details.push({ word: normalized, action: 'queued' });
      } else {
        result.skipped++;
        result.details.push({ word: normalized, action: 'skipped' });
      }

      result.processed++;
    }

    // If there are words to generate, create a job
    let jobId: string | null = null;
    if (wordsToGenerate.length > 0 && !dryRun) {
      const job = await prisma.contentGenerationJob.create({
        data: {
          inputWords: wordsToGenerate,
          examCategory: 'TEPS',
          cefrLevel: level === 'L1' ? 'B1' : level === 'L2' ? 'B2' : 'C1',
          status: 'pending',
          progress: 0,
        },
      });
      jobId = job.id;

      // Start processing in background
      processGenerationJob(job.id).catch((error) => {
        logger.error(`[Internal/SmartContent] Background job ${job.id} failed:`, error);
      });

      logger.info(`[Internal/SmartContent] Started generation job ${job.id} for ${wordsToGenerate.length} words`);
    }

    const hasMore = remainingCount - result.processed > 0;

    logger.info(`[Internal/SmartContent] TEPS ${level} completed: copied=${result.copied}, queued=${result.queued}, skipped=${result.skipped}`);

    res.json({
      message: `TEPS ${level} smart content ${dryRun ? '(DRY RUN) ' : ''}completed`,
      dryRun,
      copyOnly,
      level,
      summary: {
        processed: result.processed,
        copied: result.copied,
        queued: result.queued,
        skipped: result.skipped,
        errors: result.errors.length,
      },
      remaining: remainingCount - result.processed,
      hasMore,
      jobId,
      nextStep: hasMore
        ? `남은 ${remainingCount - result.processed}개 처리: 같은 URL 다시 호출`
        : `${level} 완료! 다음 레벨 진행`,
      errors: result.errors.slice(0, 20),
      details: dryRun ? result.details : undefined,
    });
  } catch (error) {
    console.error('[Internal/SmartContent] Error:', error);
    res.status(500).json({ error: 'Smart content generation failed', details: String(error) });
  }
});

/**
 * POST /internal/start-teps-copy-job?key=YOUR_SECRET&level=L1
 * TEPS 콘텐츠 복사 백그라운드 Job 시작
 * - 한 번 호출로 전체 레벨 처리
 * - 진행 상황은 /internal/copy-job-status로 확인
 */
router.get('/start-teps-copy-job', async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string;
    if (!key || key !== process.env.INTERNAL_SECRET_KEY) {
      return res.status(403).json({ error: 'Forbidden: Invalid key' });
    }

    const level = (req.query.level as string) || 'all'; // L1, L2, L3, or 'all'
    const dryRun = req.query.dryRun === 'true';

    // Get all DRAFT TEPS words that need content
    const whereClause: any = {
      examCategory: 'TEPS',
      status: 'DRAFT',
      aiGeneratedAt: null,
    };

    if (level !== 'all') {
      if (!['L1', 'L2', 'L3'].includes(level)) {
        return res.status(400).json({ error: 'Invalid level. Use L1, L2, L3, or all' });
      }
      whereClause.level = level;
    }

    const draftWords = await prisma.word.findMany({
      where: whereClause,
      select: { id: true, word: true, level: true },
      orderBy: [{ level: 'asc' }, { word: 'asc' }],
    });

    if (draftWords.length === 0) {
      return res.json({
        message: `No DRAFT words need content for ${level}`,
        total: 0,
      });
    }

    if (dryRun) {
      // Group by level for summary
      const byLevel = draftWords.reduce((acc, w) => {
        const lvl = w.level || 'unknown';
        acc[lvl] = (acc[lvl] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return res.json({
        message: 'DRY RUN - Job not started',
        dryRun: true,
        level,
        total: draftWords.length,
        byLevel,
        sampleWords: draftWords.slice(0, 10).map(w => w.word),
      });
    }

    // Create job record
    const job = await prisma.contentGenerationJob.create({
      data: {
        inputWords: draftWords.map(w => w.id),
        examCategory: 'TEPS',
        status: 'pending',
        progress: 0,
        aiModel: 'copy_from_csat',
        generateFields: ['etymology', 'mnemonic', 'examples', 'collocations'],
      },
    });

    // Start background processing
    processCopyJob(job.id).catch((error) => {
      logger.error(`[Internal/CopyJob] Background job ${job.id} failed:`, error);
    });

    logger.info(`[Internal/CopyJob] Started copy job ${job.id} for ${draftWords.length} words`);

    res.json({
      message: `TEPS ${level} copy job started`,
      jobId: job.id,
      total: draftWords.length,
      checkStatus: `/internal/copy-job-status?key=${key}&jobId=${job.id}`,
    });
  } catch (error) {
    console.error('[Internal/CopyJob] Error:', error);
    res.status(500).json({ error: 'Failed to start copy job', details: String(error) });
  }
});

/**
 * GET /internal/copy-job-status?key=YOUR_SECRET&jobId=xxx
 * 복사 Job 진행 상황 확인
 */
router.get('/copy-job-status', async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string;
    if (!key || key !== process.env.INTERNAL_SECRET_KEY) {
      return res.status(403).json({ error: 'Forbidden: Invalid key' });
    }

    const jobId = req.query.jobId as string;
    if (!jobId) {
      // List recent jobs
      const recentJobs = await prisma.contentGenerationJob.findMany({
        where: { aiModel: 'copy_from_csat' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          status: true,
          progress: true,
          inputWords: true,
          createdAt: true,
          completedAt: true,
          errorMessage: true,
        },
      });

      return res.json({
        message: 'Recent copy jobs',
        jobs: recentJobs.map(j => ({
          id: j.id,
          status: j.status,
          progress: j.progress,
          total: j.inputWords.length,
          createdAt: j.createdAt,
          completedAt: j.completedAt,
          error: j.errorMessage,
        })),
      });
    }

    const job = await prisma.contentGenerationJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const result = job.result as any;

    res.json({
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      total: job.inputWords.length,
      processed: result?.processed || 0,
      copied: result?.copied || 0,
      skipped: result?.skipped || 0,
      errors: result?.errorCount || 0,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      errorMessage: job.errorMessage,
      recentErrors: result?.recentErrors?.slice(0, 5),
    });
  } catch (error) {
    console.error('[Internal/CopyJobStatus] Error:', error);
    res.status(500).json({ error: 'Failed to get job status', details: String(error) });
  }
});

/**
 * Background processor for copy jobs
 * - Copies content from CSAT to TEPS
 * - Updates progress in real-time
 */
async function processCopyJob(jobId: string): Promise<void> {
  const job = await prisma.contentGenerationJob.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new Error(`Job not found: ${jobId}`);
  }

  try {
    await prisma.contentGenerationJob.update({
      where: { id: jobId },
      data: { status: 'processing', startedAt: new Date() },
    });

    const wordIds = job.inputWords;
    const result = {
      processed: 0,
      copied: 0,
      skipped: 0,
      errorCount: 0,
      recentErrors: [] as string[],
    };

    // Process in chunks to update progress regularly
    const chunkSize = 50;

    for (let i = 0; i < wordIds.length; i += chunkSize) {
      const chunk = wordIds.slice(i, i + chunkSize);

      for (const wordId of chunk) {
        try {
          // Get TEPS word
          const word = await prisma.word.findUnique({
            where: { id: wordId },
            select: { id: true, word: true },
          });

          if (!word) {
            result.skipped++;
            result.processed++;
            continue;
          }

          const normalized = word.word.toLowerCase().trim();

          // Find matching CSAT word with content
          const sourceWord = await prisma.word.findFirst({
            where: {
              word: { equals: normalized, mode: 'insensitive' },
              examCategory: { not: 'TEPS' },
              aiGeneratedAt: { not: null },
            },
            include: {
              etymology: true,
              mnemonics: true,
              examples: true,
              collocations: true,
            },
          });

          if (!sourceWord) {
            result.skipped++;
            result.processed++;
            continue;
          }

          // Copy content from source word
          await prisma.word.update({
            where: { id: word.id },
            data: {
              definition: sourceWord.definition,
              definitionKo: sourceWord.definitionKo,
              partOfSpeech: sourceWord.partOfSpeech,
              pronunciation: sourceWord.pronunciation,
              phonetic: sourceWord.phonetic,
              ipaUs: sourceWord.ipaUs,
              ipaUk: sourceWord.ipaUk,
              tips: sourceWord.tips,
              commonMistakes: sourceWord.commonMistakes,
              prefix: sourceWord.prefix,
              root: sourceWord.root,
              suffix: sourceWord.suffix,
              morphologyNote: sourceWord.morphologyNote,
              synonymList: sourceWord.synonymList,
              antonymList: sourceWord.antonymList,
              rhymingWords: sourceWord.rhymingWords,
              relatedWords: sourceWord.relatedWords,
              status: 'PENDING_REVIEW',
              aiGeneratedAt: new Date(),
              aiModel: `copied_from_${sourceWord.examCategory}`,
              aiPromptVersion: 'copy_v1',
            },
          });

          // Copy related records
          if (sourceWord.etymology) {
            await prisma.etymology.upsert({
              where: { wordId: word.id },
              create: {
                wordId: word.id,
                origin: sourceWord.etymology.origin,
                language: sourceWord.etymology.language,
                rootWords: sourceWord.etymology.rootWords || [],
                evolution: sourceWord.etymology.evolution,
                relatedWords: sourceWord.etymology.relatedWords || [],
                breakdown: sourceWord.etymology.breakdown,
              },
              update: {
                origin: sourceWord.etymology.origin,
                language: sourceWord.etymology.language,
                rootWords: sourceWord.etymology.rootWords || [],
                evolution: sourceWord.etymology.evolution,
                relatedWords: sourceWord.etymology.relatedWords || [],
                breakdown: sourceWord.etymology.breakdown,
              },
            });
          }

          // Copy mnemonics
          for (const mnemonic of sourceWord.mnemonics) {
            await prisma.mnemonic.create({
              data: {
                wordId: word.id,
                title: mnemonic.title,
                content: mnemonic.content,
                koreanHint: mnemonic.koreanHint,
                source: mnemonic.source,
              },
            });
          }

          // Copy examples
          for (const example of sourceWord.examples) {
            await prisma.example.create({
              data: {
                wordId: word.id,
                sentence: example.sentence,
                translation: example.translation,
                source: example.source,
              },
            });
          }

          // Copy collocations
          for (const collocation of sourceWord.collocations) {
            await prisma.collocation.create({
              data: {
                wordId: word.id,
                phrase: collocation.phrase,
                translation: collocation.translation,
                exampleEn: collocation.exampleEn,
              },
            });
          }

          result.copied++;
          result.processed++;

        } catch (error: any) {
          result.errorCount++;
          result.processed++;
          if (result.recentErrors.length < 20) {
            result.recentErrors.push(`${wordId}: ${error.message}`);
          }
          logger.error(`[CopyJob] Error processing ${wordId}:`, error);
        }
      }

      // Update progress after each chunk
      const progress = Math.round((result.processed / wordIds.length) * 100);
      await prisma.contentGenerationJob.update({
        where: { id: jobId },
        data: { progress, result: result as any },
      });

      logger.info(`[CopyJob] ${jobId} progress: ${progress}% (${result.copied} copied, ${result.skipped} skipped)`);
    }

    // Mark as completed
    await prisma.contentGenerationJob.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        progress: 100,
        result: result as any,
        completedAt: new Date(),
      },
    });

    logger.info(`[CopyJob] ${jobId} completed: ${result.copied} copied, ${result.skipped} skipped, ${result.errorCount} errors`);

  } catch (error) {
    await prisma.contentGenerationJob.update({
      where: { id: jobId },
      data: {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date(),
      },
    });
    throw error;
  }
}

/**
 * GET /internal/start-teps-generate-job?key=YOUR_SECRET&level=all
 * TEPS AI 콘텐츠 생성 백그라운드 Job 시작
 * - DRAFT 상태인 TEPS 단어에 대해 Claude API로 콘텐츠 생성
 * - 진행 상황은 /internal/generate-job-status로 확인
 */
router.get('/start-teps-generate-job', async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string;
    if (!key || key !== process.env.INTERNAL_SECRET_KEY) {
      return res.status(403).json({ error: 'Forbidden: Invalid key' });
    }

    const level = (req.query.level as string) || 'all';
    const dryRun = req.query.dryRun === 'true';
    const limit = parseInt(req.query.limit as string) || 0; // 0 = no limit

    // Build where clause
    const whereClause: any = {
      examCategory: 'TEPS',
      status: 'DRAFT',
      aiGeneratedAt: null,
    };

    if (level !== 'all') {
      if (!['L1', 'L2', 'L3'].includes(level)) {
        return res.status(400).json({ error: 'Invalid level. Use L1, L2, L3, or all' });
      }
      whereClause.level = level;
    }

    // Get DRAFT words that need AI generation
    const query: any = {
      where: whereClause,
      select: { id: true, word: true, level: true },
      orderBy: [{ level: 'asc' }, { word: 'asc' }],
    };

    if (limit > 0) {
      query.take = limit;
    }

    const draftWords = await prisma.word.findMany(query);

    if (draftWords.length === 0) {
      return res.json({
        message: `No DRAFT words need AI generation for ${level}`,
        total: 0,
      });
    }

    if (dryRun) {
      const byLevel = draftWords.reduce((acc, w) => {
        const lvl = w.level || 'unknown';
        acc[lvl] = (acc[lvl] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const estimatedCost = (draftWords.length * 0.03).toFixed(2);

      return res.json({
        message: 'DRY RUN - Job not started',
        dryRun: true,
        level,
        total: draftWords.length,
        byLevel,
        estimatedCost: `~$${estimatedCost}`,
        sampleWords: draftWords.slice(0, 10).map(w => w.word),
      });
    }

    // Create job record
    const job = await prisma.contentGenerationJob.create({
      data: {
        inputWords: draftWords.map(w => w.id),
        examCategory: 'TEPS',
        cefrLevel: level === 'L1' ? 'B1' : level === 'L2' ? 'B2' : 'C1',
        status: 'pending',
        progress: 0,
        aiModel: 'claude-sonnet-4-20250514',
        generateFields: ['definition', 'etymology', 'mnemonic', 'examples', 'collocations'],
      },
    });

    // Start background processing using existing processGenerationJob
    processGenerationJob(job.id).catch((error) => {
      logger.error(`[Internal/GenerateJob] Background job ${job.id} failed:`, error);
    });

    const estimatedCost = (draftWords.length * 0.03).toFixed(2);
    const estimatedMinutes = Math.ceil(draftWords.length * 1.5 / 60); // ~1.5 sec per word

    logger.info(`[Internal/GenerateJob] Started AI generation job ${job.id} for ${draftWords.length} words`);

    res.json({
      message: `TEPS ${level} AI generation job started`,
      jobId: job.id,
      total: draftWords.length,
      estimatedCost: `~$${estimatedCost}`,
      estimatedTime: `~${estimatedMinutes} minutes`,
      checkStatus: `/internal/generate-job-status?key=${key}&jobId=${job.id}`,
      warning: 'This will call Claude API and incur costs!',
    });
  } catch (error) {
    console.error('[Internal/GenerateJob] Error:', error);
    res.status(500).json({ error: 'Failed to start generate job', details: String(error) });
  }
});

/**
 * GET /internal/generate-job-status?key=YOUR_SECRET&jobId=xxx
 * AI 생성 Job 진행 상황 확인
 */
router.get('/generate-job-status', async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string;
    if (!key || key !== process.env.INTERNAL_SECRET_KEY) {
      return res.status(403).json({ error: 'Forbidden: Invalid key' });
    }

    const jobId = req.query.jobId as string;
    if (!jobId) {
      // List recent AI generation jobs
      const recentJobs = await prisma.contentGenerationJob.findMany({
        where: {
          aiModel: { not: 'copy_from_csat' },
          examCategory: 'TEPS',
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          status: true,
          progress: true,
          inputWords: true,
          createdAt: true,
          startedAt: true,
          completedAt: true,
          errorMessage: true,
        },
      });

      return res.json({
        message: 'Recent AI generation jobs',
        jobs: recentJobs.map(j => ({
          id: j.id,
          status: j.status,
          progress: j.progress,
          total: j.inputWords.length,
          createdAt: j.createdAt,
          startedAt: j.startedAt,
          completedAt: j.completedAt,
          error: j.errorMessage,
        })),
      });
    }

    const job = await prisma.contentGenerationJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const result = job.result as any;
    const successCount = Array.isArray(result)
      ? result.filter((r: any) => r.success).length
      : 0;
    const failCount = Array.isArray(result)
      ? result.filter((r: any) => !r.success).length
      : 0;

    // Calculate elapsed time
    let elapsedMinutes = 0;
    if (job.startedAt) {
      const endTime = job.completedAt || new Date();
      elapsedMinutes = Math.round((endTime.getTime() - job.startedAt.getTime()) / 60000);
    }

    // Estimate remaining time
    let estimatedRemaining = 'calculating...';
    if (job.progress > 0 && job.progress < 100) {
      const totalWords = job.inputWords.length;
      const processedWords = Math.round(totalWords * job.progress / 100);
      const remainingWords = totalWords - processedWords;
      const avgSecsPerWord = (elapsedMinutes * 60) / processedWords;
      const remainingMins = Math.ceil(remainingWords * avgSecsPerWord / 60);
      estimatedRemaining = `~${remainingMins} minutes`;
    }

    res.json({
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      total: job.inputWords.length,
      success: successCount,
      failed: failCount,
      elapsedMinutes,
      estimatedRemaining: job.status === 'processing' ? estimatedRemaining : undefined,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      errorMessage: job.errorMessage,
      // Show recent failures
      recentFailures: Array.isArray(result)
        ? result.filter((r: any) => !r.success).slice(-5).map((r: any) => ({ word: r.word, error: r.error }))
        : [],
    });
  } catch (error) {
    console.error('[Internal/GenerateJobStatus] Error:', error);
    res.status(500).json({ error: 'Failed to get job status', details: String(error) });
  }
});

/**
 * GET /internal/seed-teps-package?key=YOUR_SECRET
 * TEPS 빈출 100 단품 상품 생성
 */
router.get('/seed-teps-package', async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string;
    if (!key || key !== process.env.INTERNAL_SECRET_KEY) {
      return res.status(403).json({ error: 'Forbidden: Invalid key' });
    }

    const dryRun = req.query.dryRun === 'true';

    // TEPS 최다 빈출 105개 단어
    const tepsTop100Words = [
      'abate', 'abdicate', 'aberration', 'abhorrence', 'acquit',
      'adherent', 'admonition', 'adulation', 'agitate', 'altruistic',
      'ambivalent', 'amnesty', 'apathetic', 'appease', 'audacity',
      'belligerence', 'beneficiary', 'benign', 'bereavement', 'brandish',
      'cajole', 'circumspect', 'circumvent', 'clandestine', 'coercion',
      'complacency', 'concession', 'confiscate', 'congenial', 'consolidate',
      'contemplate', 'contravene', 'corroborate', 'covert', 'cumbersome',
      'daunt', 'decadence', 'deference', 'deleterious', 'destitute',
      'deteriorate', 'devour', 'dexterity', 'disperse', 'divulge',
      'dormant', 'ebullience', 'elucidate', 'emancipation', 'embezzlement',
      'emulate', 'endemic', 'enigmatic', 'envisage', 'esoteric',
      'euphoria', 'exonerate', 'exorbitant', 'expunge', 'fabricate',
      'fallible', 'felicitous', 'fiasco', 'fidelity', 'fluctuate',
      'frugal', 'genocide', 'glitch', 'gregarious', 'harbinger',
      'heinous', 'hiatus', 'hierarchy', 'ignominious', 'impetuous',
      'incarcerate', 'inculcate', 'infatuated', 'insinuation', 'insurgency',
      'jurisdiction', 'lethargic', 'loathe', 'lucid', 'malleable',
      'mortify', 'nonchalant', 'nullify', 'obdurate', 'oppressive',
      'panacea', 'perpetuate', 'plausible', 'plummet', 'precarious',
      'predilection', 'promulgate', 'prosecute', 'ratify', 'rebuke',
      'redundant', 'reimburse', 'reiterate', 'relinquish', 'remorse',
      'resilient', 'reticent', 'sabotage', 'scrutiny', 'sporadic',
      'squander', 'stringent', 'substantiate', 'tenacious', 'thwart',
      'ubiquitous', 'undermine', 'unruly', 'vindictive', 'volatile',
      'wade', 'walkout', 'wheedle', 'windfall', 'withstand', 'wrath', 'yield'
    ];

    // Find words in database
    const foundWords = await prisma.word.findMany({
      where: {
        word: { in: tepsTop100Words, mode: 'insensitive' },
        examCategory: 'TEPS',
      },
      select: { id: true, word: true },
    });

    const foundWordMap = new Map(foundWords.map(w => [w.word.toLowerCase(), w.id]));
    const missingWords = tepsTop100Words.filter(w => !foundWordMap.has(w.toLowerCase()));

    if (dryRun) {
      return res.json({
        message: 'DRY RUN - Package not created',
        dryRun: true,
        totalWords: tepsTop100Words.length,
        foundInDB: foundWords.length,
        missing: missingWords.length,
        missingWords: missingWords.slice(0, 20),
        sampleFound: foundWords.slice(0, 10).map(w => w.word),
      });
    }

    // Check if package already exists
    const existingPackage = await prisma.productPackage.findUnique({
      where: { slug: 'teps-top-100' },
    });

    if (existingPackage) {
      // Update word mappings if needed
      const existingMappings = await prisma.productPackageWord.count({
        where: { packageId: existingPackage.id },
      });

      return res.json({
        message: 'Package already exists',
        package: {
          id: existingPackage.id,
          name: existingPackage.name,
          slug: existingPackage.slug,
          price: existingPackage.price,
          wordCount: existingMappings,
        },
      });
    }

    // Create package
    const newPackage = await prisma.productPackage.create({
      data: {
        name: 'TEPS 최다 빈출 100',
        slug: 'teps-top-100',
        description: 'TEPS 시험에 가장 자주 출제되는 핵심 어휘 105개를 엄선했습니다. 고득점을 위한 필수 단어장!',
        shortDesc: 'TEPS 고득점 필수 어휘',
        price: 3900,
        durationDays: 365,
        badge: 'BEST',
        badgeColor: '#10B981', // green
        displayOrder: 1,
        isActive: true,
      },
    });

    // Create word mappings
    const wordMappings = foundWords.map((word, index) => ({
      packageId: newPackage.id,
      wordId: word.id,
      displayOrder: index,
    }));

    await prisma.productPackageWord.createMany({
      data: wordMappings,
    });

    logger.info(`[Internal/SeedPackage] Created package ${newPackage.id} with ${wordMappings.length} words`);

    res.json({
      message: 'Package created successfully',
      package: {
        id: newPackage.id,
        name: newPackage.name,
        slug: newPackage.slug,
        price: newPackage.price,
      },
      words: {
        total: tepsTop100Words.length,
        linked: wordMappings.length,
        missing: missingWords.length,
        missingWords: missingWords,
      },
    });
  } catch (error) {
    console.error('[Internal/SeedPackage] Error:', error);
    res.status(500).json({ error: 'Failed to seed package', details: String(error) });
  }
});

/**
 * GET /internal/teps-seed-status?key=YOUR_SECRET
 * TEPS 시드 현황 확인
 */
router.get('/teps-seed-status', async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string;
    if (!key || key !== process.env.INTERNAL_SECRET_KEY) {
      return res.status(403).json({ error: 'Forbidden: Invalid key' });
    }

    // Load TEPS words to compare
    const tepsData = loadTepsWords();

    // Get current TEPS stats by level
    const tepsStats = await prisma.word.groupBy({
      by: ['level', 'status'],
      where: { examCategory: 'TEPS' },
      _count: { level: true },
    });

    // Get archived count
    const archivedCount = await prisma.word.count({
      where: { examCategory: 'TEPS', status: 'ARCHIVED' },
    });

    // Get content stats
    const contentStats = await prisma.word.groupBy({
      by: ['level'],
      where: {
        examCategory: 'TEPS',
        status: { not: 'ARCHIVED' },
        aiGeneratedAt: { not: null },
      },
      _count: { level: true },
    });

    // Get image stats
    const imageStats = await prisma.wordVisual.count({
      where: {
        word: {
          examCategory: 'TEPS',
          status: { not: 'ARCHIVED' },
        },
      },
    });

    res.json({
      targetCounts: {
        L1: tepsData.levels.L1.count,
        L2: tepsData.levels.L2.count,
        L3: tepsData.levels.L3.count,
        total: tepsData.totalWords,
      },
      currentStats: {
        byLevelAndStatus: tepsStats.map(s => ({
          level: s.level,
          status: s.status,
          count: s._count.level,
        })),
        archived: archivedCount,
      },
      contentGenerated: contentStats.reduce((acc, c) => {
        acc[c.level || 'unknown'] = c._count.level;
        return acc;
      }, {} as Record<string, number>),
      imagesGenerated: imageStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Internal/TepsSeedStatus] Error:', error);
    res.status(500).json({ error: 'Status check failed' });
  }
});

export default router;
