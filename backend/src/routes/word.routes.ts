import { Router } from 'express';
import {
  getWords,
  getWordById,
  createWord,
  getRandomWords,
  getPublicWords,
  getWordCountsByExam,
  getLevelTestQuestions,
  getQuizQuestions,
  getWordVisuals,
  updateWordVisuals,
  deleteWordVisual,
  importWordVisualsFromTemplate,
  getWordWithVisuals,
} from '../controllers/word.controller';
import { authenticateToken, requireAdmin, optionalAuth } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /words/public:
 *   get:
 *     summary: 공개 단어 목록 조회 (인증 불필요)
 *     tags: [Words]
 *     parameters:
 *       - in: query
 *         name: examCategory
 *         schema:
 *           type: string
 *           enum: [CSAT, TEPS, TOEIC, TOEFL, SAT]
 *         description: 시험 카테고리 필터
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 조회할 단어 수
 *     responses:
 *       200:
 *         description: 단어 목록
 */
router.get('/public', getPublicWords);

/**
 * @swagger
 * /words/counts:
 *   get:
 *     summary: 시험별 단어 수 조회 (인증 불필요)
 *     tags: [Words]
 *     responses:
 *       200:
 *         description: 시험별 단어 수
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 counts:
 *                   type: object
 *                   properties:
 *                     CSAT:
 *                       type: integer
 *                     SAT:
 *                       type: integer
 *                     TOEFL:
 *                       type: integer
 *                     TOEIC:
 *                       type: integer
 *                     TEPS:
 *                       type: integer
 */
router.get('/counts', getWordCountsByExam);

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
 * /words/level-test-questions:
 *   get:
 *     summary: 레벨 테스트 문제 조회 (인증 불필요)
 *     tags: [Words]
 *     parameters:
 *       - in: query
 *         name: examCategory
 *         schema:
 *           type: string
 *           enum: [CSAT, TEPS, TOEIC, TOEFL, SAT]
 *         description: 시험 카테고리
 *       - in: query
 *         name: count
 *         schema:
 *           type: integer
 *           default: 15
 *         description: 문제 수 (최대 30)
 *     responses:
 *       200:
 *         description: 레벨 테스트 문제 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 questions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       word:
 *                         type: string
 *                       level:
 *                         type: string
 *                       options:
 *                         type: array
 *                         items:
 *                           type: string
 *                       correctAnswer:
 *                         type: string
 */
router.get('/level-test-questions', getLevelTestQuestions);

/**
 * @swagger
 * /words/quiz-questions:
 *   get:
 *     summary: 퀴즈 문제 조회 (인증 불필요)
 *     tags: [Words]
 *     parameters:
 *       - in: query
 *         name: examCategory
 *         schema:
 *           type: string
 *           enum: [CSAT, TEPS, TOEIC, TOEFL, SAT]
 *         description: 시험 카테고리
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [L1, L2, L3]
 *         description: 레벨 필터
 *       - in: query
 *         name: mode
 *         schema:
 *           type: string
 *           enum: [eng-to-kor, kor-to-eng]
 *           default: eng-to-kor
 *         description: 퀴즈 모드
 *       - in: query
 *         name: count
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 문제 수 (최대 50)
 *     responses:
 *       200:
 *         description: 퀴즈 문제 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 questions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       question:
 *                         type: string
 *                       options:
 *                         type: array
 *                         items:
 *                           type: string
 *                       correctAnswer:
 *                         type: string
 *                       mnemonic:
 *                         type: string
 */
router.get('/quiz-questions', getQuizQuestions);

/**
 * @swagger
 * /words/visuals/import:
 *   post:
 *     summary: JSON 템플릿에서 시각화 이미지 일괄 가져오기 (관리자 전용)
 *     tags: [Word Visuals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               templates:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     word:
 *                       type: string
 *                       description: 단어 이름
 *                     visuals:
 *                       type: object
 *                       properties:
 *                         concept:
 *                           type: object
 *                         mnemonic:
 *                           type: object
 *                         rhyme:
 *                           type: object
 *     responses:
 *       200:
 *         description: 가져오기 결과
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: 관리자 권한 필요
 */
router.post('/visuals/import', authenticateToken, requireAdmin, importWordVisualsFromTemplate);

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

// ============================================
// 3-이미지 시각화 시스템 (Word Visuals) Routes
// ============================================

/**
 * @swagger
 * /words/{id}/visuals:
 *   get:
 *     summary: 단어 시각화 이미지 조회
 *     tags: [Word Visuals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 단어 ID
 *     responses:
 *       200:
 *         description: 시각화 이미지 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 visuals:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [CONCEPT, MNEMONIC, RHYME]
 *                       labelKo:
 *                         type: string
 *                       captionKo:
 *                         type: string
 *                       imageUrl:
 *                         type: string
 */
router.get('/:id/visuals', getWordVisuals);

/**
 * @swagger
 * /words/{id}/with-visuals:
 *   get:
 *     summary: 단어 상세 조회 (시각화 이미지 포함)
 *     tags: [Word Visuals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 단어 ID
 *     responses:
 *       200:
 *         description: 단어 상세 정보 (시각화 이미지 포함)
 *       404:
 *         description: 단어를 찾을 수 없음
 */
router.get('/:id/with-visuals', getWordWithVisuals);

/**
 * @swagger
 * /words/{id}/visuals:
 *   put:
 *     summary: 단어 시각화 이미지 업데이트 (관리자 전용)
 *     tags: [Word Visuals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *             properties:
 *               visuals:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [CONCEPT, MNEMONIC, RHYME]
 *                     labelKo:
 *                       type: string
 *                     captionEn:
 *                       type: string
 *                     captionKo:
 *                       type: string
 *                     imageUrl:
 *                       type: string
 *                     promptEn:
 *                       type: string
 *     responses:
 *       200:
 *         description: 업데이트된 시각화 이미지
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: 관리자 권한 필요
 */
router.put('/:id/visuals', authenticateToken, requireAdmin, updateWordVisuals);

/**
 * @swagger
 * /words/{id}/visuals/{type}:
 *   delete:
 *     summary: 특정 시각화 이미지 삭제 (관리자 전용)
 *     tags: [Word Visuals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 단어 ID
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [CONCEPT, MNEMONIC, RHYME]
 *         description: 시각화 타입
 *     responses:
 *       200:
 *         description: 삭제 성공
 *       400:
 *         description: 잘못된 타입
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: 관리자 권한 필요
 */
router.delete('/:id/visuals/:type', authenticateToken, requireAdmin, deleteWordVisual);

export default router;
