import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

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
