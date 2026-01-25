import { Router, Request, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../index';
import bcrypt from 'bcrypt';

const router = Router();

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: 현재 로그인한 사용자 정보 조회
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 사용자 정보
 */
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        provider: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        subscriptionStart: true,
        subscriptionEnd: true,
        trialEnd: true,
        totalWordsLearned: true,
        currentStreak: true,
        longestStreak: true,
        lastActiveDate: true,
        dailyGoal: true,
        dailyProgress: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('[Users/me] Error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * @swagger
 * /users/profile:
 *   patch:
 *     summary: 프로필 업데이트 (이름 변경)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: 프로필 업데이트 성공
 */
router.patch('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId;
    const { name } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { name: name.trim() },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    res.json({ success: true, user });
  } catch (error) {
    console.error('[Users/profile] Error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * @swagger
 * /users/change-password:
 *   post:
 *     summary: 비밀번호 변경
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: 비밀번호 변경 성공
 *       400:
 *         description: 잘못된 입력
 *       401:
 *         description: 현재 비밀번호 불일치
 */
router.post('/change-password', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
        provider: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user uses social login
    if (user.provider !== 'LOCAL' || !user.password) {
      return res.status(400).json({ error: 'Password change is not available for social login users' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('[Users/change-password] Error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

/**
 * @swagger
 * /users/account:
 *   delete:
 *     summary: 회원 탈퇴 (계정 삭제)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 회원 탈퇴 성공
 *       400:
 *         description: 구독 활성 상태에서 탈퇴 불가
 *       401:
 *         description: 인증 실패
 */
router.delete('/account', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user with subscription status
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        subscriptionStatus: true,
        subscriptionEnd: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Block deletion if subscription is active
    if (user.subscriptionStatus === 'ACTIVE' || user.subscriptionStatus === 'PREMIUM') {
      return res.status(400).json({
        error: '구독 활성 상태에서는 탈퇴할 수 없습니다. 구독 만료 후 다시 시도해주세요.',
      });
    }

    // Delete user and all related data (cascade)
    // Prisma cascade will handle related records based on schema
    await prisma.$transaction(async (tx) => {
      // Delete UserProgress
      await tx.userProgress.deleteMany({ where: { userId } });

      // Delete LearningRecord
      await tx.learningRecord.deleteMany({ where: { userId } });

      // Delete LearningSession
      await tx.learningSession.deleteMany({ where: { userId } });

      // Delete UserAchievement
      await tx.userAchievement.deleteMany({ where: { userId } });

      // Delete UserStats
      await tx.userStats.deleteMany({ where: { userId } });

      // Delete Payment
      await tx.payment.deleteMany({ where: { userId } });

      // Finally delete the user
      await tx.user.delete({ where: { id: userId } });
    });

    console.log('[Users/delete] Account deleted:', user.email);

    res.json({ success: true, message: '회원 탈퇴가 완료되었습니다.' });
  } catch (error) {
    console.error('[Users/delete] Error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

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
    const { exam } = req.query;

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
        totalWordsLearned: true,
      }
    });

    // ===== 1. 전체 정답률 (UserProgress 기반) =====
    const progressStats = await prisma.userProgress.aggregate({
      where: { userId },
      _sum: {
        correctCount: true,
        incorrectCount: true,
      }
    });

    const totalCorrect = progressStats._sum.correctCount || 0;
    const totalIncorrect = progressStats._sum.incorrectCount || 0;
    const totalQuestions = totalCorrect + totalIncorrect;
    const overallAccuracy = totalQuestions > 0
      ? Math.round((totalCorrect / totalQuestions) * 100)
      : 0;

    // ===== 2. 레벨별 정답률 (WordExamLevel 조인) =====
    const examFilter = exam && exam !== 'all' ? exam as string : null;

    let levelStats: Array<{ level: string; correct: bigint; incorrect: bigint; wordsCount: bigint }>;

    if (examFilter) {
      levelStats = await prisma.$queryRaw<Array<{
        level: string;
        correct: bigint;
        incorrect: bigint;
        wordsCount: bigint;
      }>>`
        SELECT
          COALESCE(wel.level, w.level, 'L1') as level,
          COALESCE(SUM(up."correctCount"), 0)::bigint as correct,
          COALESCE(SUM(up."incorrectCount"), 0)::bigint as incorrect,
          COUNT(DISTINCT up."wordId")::bigint as "wordsCount"
        FROM "UserProgress" up
        JOIN "Word" w ON up."wordId" = w.id
        LEFT JOIN "WordExamLevel" wel ON w.id = wel."wordId"
        WHERE up."userId" = ${userId}
          AND w."examCategory" != 'CSAT_ARCHIVE'
          AND (w."examCategory" = ${examFilter} OR wel."examCategory" = ${examFilter})
        GROUP BY COALESCE(wel.level, w.level, 'L1')
      `;
    } else {
      levelStats = await prisma.$queryRaw<Array<{
        level: string;
        correct: bigint;
        incorrect: bigint;
        wordsCount: bigint;
      }>>`
        SELECT
          COALESCE(wel.level, w.level, 'L1') as level,
          COALESCE(SUM(up."correctCount"), 0)::bigint as correct,
          COALESCE(SUM(up."incorrectCount"), 0)::bigint as incorrect,
          COUNT(DISTINCT up."wordId")::bigint as "wordsCount"
        FROM "UserProgress" up
        JOIN "Word" w ON up."wordId" = w.id
        LEFT JOIN "WordExamLevel" wel ON w.id = wel."wordId"
        WHERE up."userId" = ${userId}
          AND w."examCategory" != 'CSAT_ARCHIVE'
        GROUP BY COALESCE(wel.level, w.level, 'L1')
      `;
    }

    const byLevel: Record<string, { totalQuestions: number; correctAnswers: number; accuracy: number; wordsCount: number }> = {
      L1: { totalQuestions: 0, correctAnswers: 0, accuracy: 0, wordsCount: 0 },
      L2: { totalQuestions: 0, correctAnswers: 0, accuracy: 0, wordsCount: 0 },
      L3: { totalQuestions: 0, correctAnswers: 0, accuracy: 0, wordsCount: 0 },
    };

    for (const row of levelStats) {
      const level = row.level || 'L1';
      if (byLevel[level]) {
        const correct = Number(row.correct) || 0;
        const incorrect = Number(row.incorrect) || 0;
        const total = correct + incorrect;
        byLevel[level] = {
          totalQuestions: total,
          correctAnswers: correct,
          accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
          wordsCount: Number(row.wordsCount) || 0,
        };
      }
    }

    // ===== 3. 모드별 정답률 (LearningRecord 기반) =====
    // 모드별 정답 수 쿼리
    const modeCorrectCounts = await prisma.$queryRaw<Array<{
      quizType: string;
      total: bigint;
      correct: bigint;
    }>>`
      SELECT
        "quizType",
        COUNT(*)::bigint as total,
        SUM(CASE WHEN "isCorrect" = true THEN 1 ELSE 0 END)::bigint as correct
      FROM "LearningRecord"
      WHERE "userId" = ${userId}
      GROUP BY "quizType"
    `;

    const byMode: Record<string, { totalQuestions: number; correctAnswers: number; accuracy: number }> = {
      flashcard: { totalQuestions: 0, correctAnswers: 0, accuracy: 0 },
      engToKor: { totalQuestions: 0, correctAnswers: 0, accuracy: 0 },
      korToEng: { totalQuestions: 0, correctAnswers: 0, accuracy: 0 },
    };

    // QuizType enum 매핑: FLASHCARD, ENG_TO_KOR, KOR_TO_ENG
    for (const row of modeCorrectCounts) {
      const total = Number(row.total) || 0;
      const correct = Number(row.correct) || 0;
      const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

      if (row.quizType === 'FLASHCARD') {
        byMode.flashcard = { totalQuestions: total, correctAnswers: correct, accuracy };
      } else if (row.quizType === 'ENG_TO_KOR') {
        byMode.engToKor = { totalQuestions: total, correctAnswers: correct, accuracy };
      } else if (row.quizType === 'KOR_TO_ENG') {
        byMode.korToEng = { totalQuestions: total, correctAnswers: correct, accuracy };
      }
    }

    // ===== 4. 이번 주 학습 현황 (월~일, KST 기준) =====
    const today = new Date();
    // KST 기준 현재 요일 (0=일, 1=월, ..., 6=토)
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstToday = new Date(today.getTime() + kstOffset);
    const dayOfWeek = kstToday.getUTCDay();

    // 이번 주 월요일 계산 (월요일 시작)
    const monday = new Date(kstToday);
    monday.setUTCDate(monday.getUTCDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setUTCHours(0, 0, 0, 0);
    // KST → UTC 변환
    const mondayUTC = new Date(monday.getTime() - kstOffset);

    const dayNames = ['월', '화', '수', '목', '금', '토', '일'];

    // 일별 학습 단어 수 쿼리 (UserProgress.updatedAt 기준)
    const dailyWordCounts = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
      SELECT
        DATE("updatedAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul') as date,
        COUNT(DISTINCT "wordId")::bigint as count
      FROM "UserProgress"
      WHERE "userId" = ${userId}
        AND "updatedAt" >= ${mondayUTC}
      GROUP BY DATE("updatedAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul')
      ORDER BY date
    `;

    // 일별 퀴즈/리뷰 정답률 쿼리
    const dailyQuizStats = await prisma.$queryRaw<Array<{ date: Date; total: bigint; correct: bigint }>>`
      SELECT
        DATE("createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul') as date,
        COUNT(*)::bigint as total,
        SUM(CASE WHEN "isCorrect" = true THEN 1 ELSE 0 END)::bigint as correct
      FROM "LearningRecord"
      WHERE "userId" = ${userId}
        AND "createdAt" >= ${mondayUTC}
      GROUP BY DATE("createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul')
      ORDER BY date
    `;

    const weeklyActivity: Array<{
      date: string;
      dayOfWeek: string;
      wordsStudied: number;
      questionsAnswered: number;
      accuracy: number;
    }> = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setUTCDate(monday.getUTCDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      // 해당 날짜의 데이터 찾기
      const wordCount = dailyWordCounts.find(d => {
        const dStr = new Date(d.date).toISOString().split('T')[0];
        return dStr === dateStr;
      });
      const quizStat = dailyQuizStats.find(d => {
        const dStr = new Date(d.date).toISOString().split('T')[0];
        return dStr === dateStr;
      });

      const wordsStudied = Number(wordCount?.count) || 0;
      const questionsAnswered = Number(quizStat?.total) || 0;
      const questionsCorrect = Number(quizStat?.correct) || 0;
      const dayAccuracy = questionsAnswered > 0
        ? Math.round((questionsCorrect / questionsAnswered) * 100)
        : 0;

      weeklyActivity.push({
        date: dateStr,
        dayOfWeek: dayNames[i],
        wordsStudied,
        questionsAnswered,
        accuracy: dayAccuracy,
      });
    }

    // ===== 5. 학습 단어 분류 (mastered/learning/new) =====
    const masteryStats = await prisma.userProgress.groupBy({
      by: ['masteryLevel'],
      where: { userId },
      _count: { _all: true },
    });

    const wordsLearned = {
      total: user?.totalWordsLearned || 0,
      mastered: 0,
      learning: 0,
      new: 0,
    };

    for (const stat of masteryStats) {
      const count = stat._count._all;
      if (stat.masteryLevel === 'MASTERED') {
        wordsLearned.mastered = count;
      } else if (stat.masteryLevel === 'FAMILIAR' || stat.masteryLevel === 'LEARNING') {
        wordsLearned.learning += count;
      } else if (stat.masteryLevel === 'NEW') {
        wordsLearned.new = count;
      }
    }

    res.json({
      overall: {
        totalQuestions,
        correctAnswers: totalCorrect,
        accuracy: overallAccuracy,
      },
      byLevel,
      byMode,
      weeklyActivity,
      streak: {
        current: user?.currentStreak || 0,
        longest: user?.longestStreak || 0,
      },
      wordsLearned,
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

/**
 * @swagger
 * /users/daily-goal:
 *   patch:
 *     summary: Update daily goal
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dailyGoal:
 *                 type: integer
 *                 minimum: 10
 *                 maximum: 200
 *     responses:
 *       200:
 *         description: Daily goal updated
 */
router.patch('/daily-goal', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId;
    const { dailyGoal } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validation
    if (!dailyGoal || typeof dailyGoal !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'dailyGoal is required and must be a number',
      });
    }

    if (dailyGoal < 10 || dailyGoal > 200) {
      return res.status(400).json({
        success: false,
        error: 'dailyGoal must be between 10 and 200',
      });
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: { dailyGoal },
      select: {
        id: true,
        dailyGoal: true,
      },
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('[DailyGoal] Update failed:', error);
    res.status(500).json({ error: 'Failed to update daily goal' });
  }
});

export default router;
