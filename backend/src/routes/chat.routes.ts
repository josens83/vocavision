import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  sendMessage,
  getSuggestions,
  getWordHelp,
  getConversations,
  getConversation,
  deleteConversation,
} from '../controllers/chat.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: AI 학습 도우미 챗봇 API
 */

/**
 * @swagger
 * /chat/message:
 *   post:
 *     summary: AI에게 메시지 전송
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: 사용자 메시지
 *               conversationId:
 *                 type: string
 *                 description: 대화 ID (선택)
 *               wordId:
 *                 type: string
 *                 description: 관련 단어 ID (선택)
 *               context:
 *                 type: string
 *                 enum: [general, word_help, quiz, grammar, pronunciation]
 *                 description: 대화 컨텍스트
 *     responses:
 *       200:
 *         description: AI 응답
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 content:
 *                   type: string
 *                 role:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                 suggestions:
 *                   type: array
 *                   items:
 *                     type: string
 *                 relatedWords:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       word:
 *                         type: string
 *                       definition:
 *                         type: string
 */
router.post('/message', authMiddleware, sendMessage);

/**
 * @swagger
 * /chat/suggestions:
 *   get:
 *     summary: 빠른 제안 목록 조회
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: context
 *         schema:
 *           type: string
 *         description: 컨텍스트 (word_help, quiz, general)
 *     responses:
 *       200:
 *         description: 제안 목록
 */
router.get('/suggestions', authMiddleware, getSuggestions);

/**
 * @swagger
 * /chat/word-help/{wordId}:
 *   get:
 *     summary: 단어별 도움말 조회
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: wordId
 *         required: true
 *         schema:
 *           type: string
 *         description: 단어 ID
 *       - in: query
 *         name: helpType
 *         schema:
 *           type: string
 *           enum: [meaning, example, mnemonic, pronunciation]
 *         description: 도움말 유형
 *     responses:
 *       200:
 *         description: 단어 도움말
 */
router.get('/word-help/:wordId', authMiddleware, getWordHelp);

/**
 * @swagger
 * /chat/conversations:
 *   get:
 *     summary: 대화 목록 조회
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: 조회 개수
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: 페이지 번호
 *     responses:
 *       200:
 *         description: 대화 목록
 */
router.get('/conversations', authMiddleware, getConversations);

/**
 * @swagger
 * /chat/conversations/{conversationId}:
 *   get:
 *     summary: 특정 대화 조회
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 대화 내용
 */
router.get('/conversations/:conversationId', authMiddleware, getConversation);

/**
 * @swagger
 * /chat/conversations/{conversationId}:
 *   delete:
 *     summary: 대화 삭제
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 삭제 성공
 */
router.delete('/conversations/:conversationId', authMiddleware, deleteConversation);

export default router;
