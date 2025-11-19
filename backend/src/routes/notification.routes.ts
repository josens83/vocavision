import { Router } from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../controllers/notification.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: 알림 목록 조회
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *         description: 읽지 않은 알림만 조회
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: 조회할 알림 수
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: 시작 위치
 *     responses:
 *       200:
 *         description: 알림 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notifications:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 *                 totalCount:
 *                   type: integer
 *                 unreadCount:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', getNotifications);

/**
 * @swagger
 * /notifications/preferences:
 *   get:
 *     summary: 알림 설정 조회
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 알림 설정
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 emailNotifications:
 *                   type: boolean
 *                 pushNotifications:
 *                   type: boolean
 *                 reminderTime:
 *                   type: string
 *                 reminderDays:
 *                   type: string
 */
router.get('/preferences', getNotificationPreferences);

/**
 * @swagger
 * /notifications/preferences:
 *   put:
 *     summary: 알림 설정 업데이트
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emailNotifications:
 *                 type: boolean
 *               pushNotifications:
 *                 type: boolean
 *               reminderTime:
 *                 type: string
 *                 description: "HH:mm 형식"
 *               reminderDays:
 *                 type: string
 *                 description: "요일 (1-7, 쉼표 구분)"
 *     responses:
 *       200:
 *         description: 업데이트된 설정
 */
router.put('/preferences', updateNotificationPreferences);

/**
 * @swagger
 * /notifications/read-all:
 *   put:
 *     summary: 모든 알림 읽음 처리
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 성공
 */
router.put('/read-all', markAllAsRead);

/**
 * @swagger
 * /notifications/clear-all:
 *   delete:
 *     summary: 모든 알림 삭제
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 성공
 */
router.delete('/clear-all', clearAllNotifications);

/**
 * @swagger
 * /notifications/{id}/read:
 *   put:
 *     summary: 특정 알림 읽음 처리
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 성공
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/:id/read', markAsRead);

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     summary: 특정 알림 삭제
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 성공
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:id', deleteNotification);

export default router;
