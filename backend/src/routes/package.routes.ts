import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import logger from '../utils/logger';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/packages/check-access
 * 단품 패키지 접근 권한 확인
 */
router.get('/check-access', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { slug } = req.query;
    const userId = req.userId;

    if (!slug || typeof slug !== 'string') {
      return res.status(400).json({ error: 'slug is required' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // 1. 사용자 정보 확인 (프리미엄 체크용)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionPlan: true, subscriptionStatus: true },
    });

    // 2. 프리미엄 회원은 모든 패키지 접근 가능
    const isExpiredOrCancelled = user?.subscriptionStatus === 'EXPIRED' || user?.subscriptionStatus === 'CANCELLED';
    const isPremium = !isExpiredOrCancelled && (user?.subscriptionPlan === 'YEARLY' || user?.subscriptionPlan === 'FAMILY' || user?.subscriptionPlan === 'PREMIUM_MONTHLY' || user?.subscriptionPlan === 'PREMIUM_YEARLY');
    if (isPremium) {
      logger.info(`[Packages] Access check - user: ${userId}, package: ${slug}, hasAccess: true (PREMIUM)`);
      return res.json({ hasAccess: true, reason: 'premium' });
    }

    // 3. 해당 패키지 찾기
    const pkg = await prisma.productPackage.findUnique({
      where: { slug },
    });

    if (!pkg) {
      return res.status(404).json({ error: 'Package not found', hasAccess: false });
    }

    // 4. 구매 내역 확인 (ACTIVE 상태이고 만료되지 않은 것)
    const purchase = await prisma.userPurchase.findFirst({
      where: {
        userId,
        packageId: pkg.id,
        status: 'ACTIVE',
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    logger.info(`[Packages] Access check - user: ${userId}, package: ${slug}, hasAccess: ${!!purchase}`);

    return res.json({ hasAccess: !!purchase });
  } catch (error) {
    logger.error('[Packages] Error checking access:', error);
    return res.status(500).json({ error: 'Internal server error', hasAccess: false });
  }
});

/**
 * GET /api/packages/check-access-bulk
 * 여러 패키지를 한 번에 접근 권한 확인 (DB 쿼리 최소화)
 */
router.get('/check-access-bulk', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { slugs } = req.query;
    const userId = req.userId;

    if (!slugs || typeof slugs !== 'string') {
      return res.status(400).json({ error: 'slugs is required (comma-separated)' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const slugList = slugs.split(',').map(s => s.trim()).filter(Boolean);

    // 1. 사용자 정보 1번만 조회
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionPlan: true, subscriptionStatus: true },
    });

    const isExpiredOrCancelled = user?.subscriptionStatus === 'EXPIRED' || user?.subscriptionStatus === 'CANCELLED';
    const isPremium = !isExpiredOrCancelled && (user?.subscriptionPlan === 'YEARLY' || user?.subscriptionPlan === 'FAMILY' || user?.subscriptionPlan === 'PREMIUM_MONTHLY' || user?.subscriptionPlan === 'PREMIUM_YEARLY');

    // 2. 프리미엄이면 전부 true
    if (isPremium) {
      const result: Record<string, { hasAccess: boolean; reason: string }> = {};
      for (const slug of slugList) {
        result[slug] = { hasAccess: true, reason: 'premium' };
      }
      return res.json({ results: result });
    }

    // 2.5. Basic 구독자: SAT/ACT/IELTS 접근 허용
    const isBasic = !isExpiredOrCancelled && user?.subscriptionPlan === 'MONTHLY' && user?.subscriptionStatus === 'ACTIVE';
    const BASIC_INCLUDED_SLUGS = ['sat-complete', 'act-complete', 'ielts-complete'];

    // 3. 비프리미엄: 패키지 + 구매 내역 일괄 조회
    const packages = await prisma.productPackage.findMany({
      where: { slug: { in: slugList } },
    });

    const purchases = await prisma.userPurchase.findMany({
      where: {
        userId,
        packageId: { in: packages.map(p => p.id) },
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
      },
    });

    const purchasePackageIds = new Set(purchases.map(p => p.packageId));

    const result: Record<string, { hasAccess: boolean; reason: string }> = {};
    for (const slug of slugList) {
      const pkg = packages.find(p => p.slug === slug);
      if (!pkg) {
        result[slug] = { hasAccess: false, reason: 'not_found' };
      } else if (purchasePackageIds.has(pkg.id)) {
        result[slug] = { hasAccess: true, reason: 'purchased' };
      } else if (isBasic && BASIC_INCLUDED_SLUGS.includes(slug)) {
        result[slug] = { hasAccess: true, reason: 'basic_subscription' };
      } else {
        result[slug] = { hasAccess: false, reason: 'not_purchased' };
      }
    }

    return res.json({ results: result });
  } catch (error) {
    logger.error('[Packages] Bulk access check error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/packages
 * 활성화된 단품 패키지 목록 조회
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const packages = await prisma.productPackage.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        displayOrder: 'asc',
      },
      include: {
        _count: {
          select: {
            words: true,
          },
        },
      },
    });

    const result = packages.map((pkg) => ({
      id: pkg.id,
      name: pkg.name,
      nameEn: pkg.nameEn,
      slug: pkg.slug,
      description: pkg.description,
      descriptionEn: pkg.descriptionEn,
      shortDesc: pkg.shortDesc,
      shortDescEn: pkg.shortDescEn,
      price: pkg.price,
      priceGlobal: pkg.priceGlobal,
      originalPrice: pkg.originalPrice,
      durationDays: pkg.durationDays,
      badge: pkg.badge,
      badgeColor: pkg.badgeColor,
      imageUrl: pkg.imageUrl,
      isComingSoon: pkg.isComingSoon,
      wordCount: pkg._count.words,
    }));

    res.json({ packages: result });
  } catch (error) {
    logger.error('[Packages] Error fetching packages:', error);
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
});

/**
 * GET /api/packages/word-counts
 * 시험별 학습 가능 단어 수 (WordExamLevel 기준, 1시간 캐시)
 */
let wordCountsCache: { data: any; cachedAt: number } | null = null;

router.get('/word-counts', async (req: Request, res: Response) => {
  try {
    const CACHE_TTL = 3600 * 1000; // 1시간
    const now = Date.now();

    if (wordCountsCache && now - wordCountsCache.cachedAt < CACHE_TTL) {
      return res.json(wordCountsCache.data);
    }

    const rows = await prisma.$queryRaw<Array<{ examCategory: string; count: bigint }>>`
      SELECT wel."examCategory", COUNT(DISTINCT wel."wordId") as count
      FROM "WordExamLevel" wel
      JOIN "Word" w ON w.id = wel."wordId"
      WHERE w.status = 'PUBLISHED'
      GROUP BY wel."examCategory"
    `;

    const exams: Record<string, number> = {};
    let total = 0;
    for (const row of rows) {
      exams[row.examCategory] = Number(row.count);
      const skip = ['TEPS_ARCHIVE', 'CSAT_ARCHIVE', 'CSAT_BASIC', 'GENERAL'];
      if (!skip.includes(row.examCategory)) {
        total += Number(row.count);
      }
    }

    const packages: Record<string, number> = {
      'gre-complete':    exams['GRE']       || 0,
      'sat-complete':    exams['SAT']       || 0,
      'ebs-vocab':       exams['EBS']       || 0,
      'toefl-complete':  exams['TOEFL']     || 0,
      'toeic-complete':  exams['TOEIC']     || 0,
      'act-complete':    exams['ACT']       || 0,
      'ielts-complete':  exams['IELTS']     || 0,
      '2026-csat-analysis': exams['CSAT_2026'] || 0,
    };

    const data = { total, exams, packages };
    wordCountsCache = { data, cachedAt: now };

    res.json(data);
  } catch (error) {
    logger.error('[WordCounts] Error:', error);
    res.status(500).json({ error: 'Failed to fetch word counts' });
  }
});

/**
 * GET /api/packages/:slug
 * 특정 패키지 상세 정보 조회
 */
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const pkg = await prisma.productPackage.findUnique({
      where: { slug },
      include: {
        words: {
          include: {
            word: {
              select: {
                id: true,
                word: true,
                definition: true,
                definitionKo: true,
                pronunciation: true,
                partOfSpeech: true,
              },
            },
          },
          orderBy: {
            displayOrder: 'asc',
          },
          take: 10, // 미리보기용 10개만
        },
        _count: {
          select: {
            words: true,
          },
        },
      },
    });

    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }

    res.json({
      package: {
        id: pkg.id,
        name: pkg.name,
        nameEn: pkg.nameEn,
        slug: pkg.slug,
        description: pkg.description,
        descriptionEn: pkg.descriptionEn,
        shortDesc: pkg.shortDesc,
        shortDescEn: pkg.shortDescEn,
        price: pkg.price,
        priceGlobal: pkg.priceGlobal,
        originalPrice: pkg.originalPrice,
        durationDays: pkg.durationDays,
        badge: pkg.badge,
        badgeColor: pkg.badgeColor,
        imageUrl: pkg.imageUrl,
        isComingSoon: pkg.isComingSoon,
        wordCount: pkg._count.words,
        previewWords: pkg.words.map((w) => w.word),
      },
    });
  } catch (error) {
    logger.error('[Packages] Error fetching package:', error);
    res.status(500).json({ error: 'Failed to fetch package' });
  }
});

/**
 * GET /api/packages/:slug/words
 * 패키지에 포함된 모든 단어 조회 (구매자만)
 */
router.get('/:slug/words', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { slug } = req.params;
    const userId = req.userId!;

    // 프리미엄 체크
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionPlan: true, subscriptionStatus: true },
    });
    const isExpiredOrCancelled = user?.subscriptionStatus === 'EXPIRED' || user?.subscriptionStatus === 'CANCELLED';
    const isPremium = !isExpiredOrCancelled && (user?.subscriptionPlan === 'YEARLY' || user?.subscriptionPlan === 'FAMILY' || user?.subscriptionPlan === 'PREMIUM_MONTHLY' || user?.subscriptionPlan === 'PREMIUM_YEARLY');

    const pkg = await prisma.productPackage.findUnique({
      where: { slug },
      include: {
        words: {
          include: {
            word: {
              select: {
                id: true,
                word: true,
                definition: true,
                definitionKo: true,
                pronunciation: true,
                ipaUs: true,
                ipaUk: true,
                partOfSpeech: true,
                tips: true,
              },
            },
          },
          orderBy: {
            displayOrder: 'asc',
          },
        },
      },
    });

    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }

    if (!isPremium) {
      const purchase = await prisma.userPurchase.findFirst({
        where: { userId, packageId: pkg.id, status: 'ACTIVE', expiresAt: { gt: new Date() } },
      });
      if (!purchase) return res.status(403).json({ error: 'Purchase required' });
    }

    res.json({
      packageName: pkg.name,
      wordCount: pkg.words.length,
      words: pkg.words.map((w) => w.word),
    });
  } catch (error) {
    logger.error('[Packages] Error fetching package words:', error);
    res.status(500).json({ error: 'Failed to fetch package words' });
  }
});

export default router;
