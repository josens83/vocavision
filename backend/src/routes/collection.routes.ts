import { Router } from 'express';
import { getAllCollections, getCollectionById } from '../controllers/collection.controller';
import { optionalAuth } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /collections:
 *   get:
 *     summary: 모든 컬렉션 조회
 *     tags: [Collections]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 컬렉션 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/Collection'
 *                   - type: object
 *                     properties:
 *                       wordCount:
 *                         type: integer
 *                       masteredCount:
 *                         type: integer
 *                       progressPercentage:
 *                         type: number
 */
router.get('/', optionalAuth, getAllCollections);

/**
 * @swagger
 * /collections/{id}:
 *   get:
 *     summary: 특정 컬렉션 상세 조회
 *     tags: [Collections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 컬렉션 ID
 *     responses:
 *       200:
 *         description: 컬렉션 상세 정보 (단어 포함)
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Collection'
 *                 - type: object
 *                   properties:
 *                     words:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Word'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', optionalAuth, getCollectionById);

export default router;
