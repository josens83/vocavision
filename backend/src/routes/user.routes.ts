import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { prisma } from '../index';

const router = Router();

// Sample seed words for quick database population
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

/**
 * @swagger
 * /users/run-seed:
 *   post:
 *     summary: 데이터베이스에 샘플 단어 시드 (관리자용)
 *     tags: [Admin]
 */
router.post('/run-seed', async (req: Request, res: Response) => {
  try {
    const { secretKey } = req.body;

    if (secretKey !== process.env.JWT_SECRET) {
      return res.status(403).json({ error: 'Invalid secret key' });
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

    console.log(`[Seed] Inserted ${insertedCount} sample words`);

    res.json({
      message: 'Seed completed successfully',
      insertedCount,
      totalSampleWords: sampleWords.length
    });
  } catch (error) {
    console.error('[Seed] Error:', error);
    res.status(500).json({ error: 'Seed failed' });
  }
});

/**
 * @swagger
 * /users/upgrade-admin:
 *   post:
 *     summary: 사용자를 관리자로 업그레이드 (내부용)
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - secretKey
 *             properties:
 *               email:
 *                 type: string
 *               secretKey:
 *                 type: string
 *     responses:
 *       200:
 *         description: 업그레이드 성공
 */
router.post('/upgrade-admin', async (req: Request, res: Response) => {
  try {
    const { email, secretKey } = req.body;

    // Verify secret key (use JWT_SECRET as admin key)
    if (secretKey !== process.env.JWT_SECRET) {
      return res.status(403).json({ error: 'Invalid secret key' });
    }

    const user = await prisma.user.update({
      where: { email },
      data: {
        role: 'ADMIN',
        subscriptionStatus: 'ACTIVE',
        subscriptionPlan: 'YEARLY',
        subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
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

    console.log('[Admin] User upgraded:', user.email, 'to ADMIN with ACTIVE subscription');

    res.json({
      message: 'User upgraded to admin successfully',
      user
    });
  } catch (error) {
    console.error('[Admin] Upgrade failed:', error);
    res.status(500).json({ error: 'Failed to upgrade user' });
  }
});

/**
 * @swagger
 * /user/stats:
 *   get:
 *     summary: 사용자 통계 조회
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 사용자 통계
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/stats', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user for streak data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        currentStreak: true,
        longestStreak: true,
        lastActiveDate: true,
      }
    });

    // Get all reviews with word level info
    const reviews = await prisma.review.findMany({
      where: { userId },
      include: {
        session: {
          include: {
            reviews: {
              select: { id: true }
            }
          }
        }
      }
    });

    // Get reviews with word levels for byLevel stats
    const reviewsWithWords = await prisma.$queryRaw<Array<{
      level: string | null;
      rating: number;
    }>>`
      SELECT w.level, r.rating
      FROM "Review" r
      JOIN "Word" w ON r."wordId" = w.id
      WHERE r."userId" = ${userId}
    `;

    // Calculate overall stats
    const totalQuestions = reviews.length;
    const correctAnswers = reviews.filter(r => r.rating >= 3).length;
    const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    // Calculate by level stats
    const byLevelMap: Record<string, { total: number; correct: number }> = {
      L1: { total: 0, correct: 0 },
      L2: { total: 0, correct: 0 },
      L3: { total: 0, correct: 0 },
    };

    for (const review of reviewsWithWords) {
      const level = review.level || 'L1';
      if (byLevelMap[level]) {
        byLevelMap[level].total++;
        if (review.rating >= 3) {
          byLevelMap[level].correct++;
        }
      }
    }

    const byLevel = Object.entries(byLevelMap).reduce((acc, [key, value]) => {
      acc[key] = {
        total: value.total,
        correct: value.correct,
        accuracy: value.total > 0 ? Math.round((value.correct / value.total) * 100) : 0,
      };
      return acc;
    }, {} as Record<string, { total: number; correct: number; accuracy: number }>);

    // Calculate weekly activity (last 7 days)
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentReviews = await prisma.review.groupBy({
      by: ['createdAt'],
      where: {
        userId,
        createdAt: {
          gte: sevenDaysAgo,
        }
      },
      _count: true,
    });

    // Aggregate by day
    const dailyActivity: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date(sevenDaysAgo);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dailyActivity[dateStr] = 0;
    }

    // Get daily counts using raw query for proper date grouping
    const dailyCounts = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT DATE("createdAt") as date, COUNT(*) as count
      FROM "Review"
      WHERE "userId" = ${userId}
        AND "createdAt" >= ${sevenDaysAgo}
      GROUP BY DATE("createdAt")
      ORDER BY date
    `;

    for (const row of dailyCounts) {
      const dateStr = new Date(row.date).toISOString().split('T')[0];
      if (dailyActivity[dateStr] !== undefined) {
        dailyActivity[dateStr] = Number(row.count);
      }
    }

    const weeklyActivity = Object.entries(dailyActivity).map(([date, count]) => ({
      date,
      count,
      dayName: new Date(date).toLocaleDateString('ko-KR', { weekday: 'short' }),
    }));

    res.json({
      overall: {
        totalQuestions,
        correctAnswers,
        accuracy,
      },
      byLevel,
      streak: {
        current: user?.currentStreak || 0,
        longest: user?.longestStreak || 0,
      },
      weeklyActivity,
      lastActiveDate: user?.lastActiveDate,
    });
  } catch (error) {
    console.error('[Stats] Error:', error);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

/**
 * @swagger
 * /user/achievements:
 *   get:
 *     summary: 사용자 업적 조회
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 사용자 업적 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/achievements', authenticateToken, (req, res) => {
  res.json({ message: 'User achievements endpoint' });
});

export default router;
