import { Router } from 'express';
import { getAllAchievements } from '../controllers/achievement.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /achievements:
 *   get:
 *     summary: 모든 업적 및 사용자 진행도 조회
 *     tags: [Achievements]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 업적 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/Achievement'
 *                   - type: object
 *                     properties:
 *                       unlocked:
 *                         type: boolean
 *                       unlockedAt:
 *                         type: string
 *                         format: date-time
 *                       progress:
 *                         type: integer
 *                       percentage:
 *                         type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', authenticateToken, getAllAchievements);

export default router;
