import { Router } from 'express';
import {
  getBookmarks,
  addBookmark,
  removeBookmark,
  updateBookmarkNotes,
} from '../controllers/bookmark.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /bookmarks:
 *   get:
 *     summary: 북마크 목록 조회
 *     tags: [Bookmarks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 북마크 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   wordId:
 *                     type: string
 *                   notes:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   word:
 *                     $ref: '#/components/schemas/Word'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', authenticateToken, getBookmarks);

/**
 * @swagger
 * /bookmarks:
 *   post:
 *     summary: 북마크 추가
 *     tags: [Bookmarks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - wordId
 *             properties:
 *               wordId:
 *                 type: string
 *                 description: 북마크할 단어 ID
 *               notes:
 *                 type: string
 *                 description: 메모
 *     responses:
 *       201:
 *         description: 북마크 추가 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 wordId:
 *                   type: string
 *                 notes:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/', authenticateToken, addBookmark);

/**
 * @swagger
 * /bookmarks/{wordId}:
 *   delete:
 *     summary: 북마크 삭제
 *     tags: [Bookmarks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: wordId
 *         required: true
 *         schema:
 *           type: string
 *         description: 삭제할 단어 ID
 *     responses:
 *       200:
 *         description: 북마크 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.delete('/:wordId', authenticateToken, removeBookmark);

/**
 * @swagger
 * /bookmarks/{wordId}/notes:
 *   patch:
 *     summary: 북마크 메모 수정
 *     tags: [Bookmarks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: wordId
 *         required: true
 *         schema:
 *           type: string
 *         description: 단어 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - notes
 *             properties:
 *               notes:
 *                 type: string
 *                 description: 새 메모 내용
 *     responses:
 *       200:
 *         description: 메모 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 wordId:
 *                   type: string
 *                 notes:
 *                   type: string
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.patch('/:wordId/notes', authenticateToken, updateBookmarkNotes);

export default router;
