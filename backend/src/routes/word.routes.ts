import { Router } from 'express';
import {
  getWords,
  getWordById,
  createWord,
  getRandomWords
} from '../controllers/word.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /words:
 *   get:
 *     summary: 단어 목록 조회
 *     tags: [Words]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [BEGINNER, INTERMEDIATE, ADVANCED, EXPERT]
 *         description: 난이도 필터
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 검색어
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 페이지당 단어 수
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: 시작 위치
 *     responses:
 *       200:
 *         description: 단어 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 words:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Word'
 *                 total:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', authenticateToken, getWords);

/**
 * @swagger
 * /words/random:
 *   get:
 *     summary: 무작위 단어 조회
 *     tags: [Words]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: count
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 조회할 단어 수
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [BEGINNER, INTERMEDIATE, ADVANCED, EXPERT]
 *         description: 난이도 필터
 *     responses:
 *       200:
 *         description: 무작위 단어 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Word'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/random', authenticateToken, getRandomWords);

/**
 * @swagger
 * /words/{id}:
 *   get:
 *     summary: 특정 단어 상세 조회
 *     tags: [Words]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 단어 ID
 *     responses:
 *       200:
 *         description: 단어 상세 정보
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Word'
 *                 - type: object
 *                   properties:
 *                     examples:
 *                       type: array
 *                       items:
 *                         type: object
 *                     mnemonics:
 *                       type: array
 *                       items:
 *                         type: object
 *                     etymology:
 *                       type: object
 *                     synonyms:
 *                       type: array
 *                       items:
 *                         type: object
 *                     antonyms:
 *                       type: array
 *                       items:
 *                         type: object
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/:id', authenticateToken, getWordById);

/**
 * @swagger
 * /words:
 *   post:
 *     summary: 새 단어 생성 (관리자 전용)
 *     tags: [Words]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - word
 *               - definition
 *               - partOfSpeech
 *             properties:
 *               word:
 *                 type: string
 *               definition:
 *                 type: string
 *               pronunciation:
 *                 type: string
 *               phonetic:
 *                 type: string
 *               partOfSpeech:
 *                 type: string
 *                 enum: [NOUN, VERB, ADJECTIVE, ADVERB, PRONOUN, PREPOSITION, CONJUNCTION, INTERJECTION]
 *               difficulty:
 *                 type: string
 *                 enum: [BEGINNER, INTERMEDIATE, ADVANCED, EXPERT]
 *     responses:
 *       201:
 *         description: 생성된 단어
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Word'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: 관리자 권한 필요
 */
router.post('/', authenticateToken, requireAdmin, createWord);

export default router;
