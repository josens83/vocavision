import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { prisma } from '../index';

const router = Router();

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
router.get('/stats', authenticateToken, (req, res) => {
  res.json({ message: 'User stats endpoint' });
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
