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

// GET /api/notifications - Get all notifications
router.get('/', getNotifications);

// GET /api/notifications/preferences - Get notification preferences
router.get('/preferences', getNotificationPreferences);

// PUT /api/notifications/preferences - Update notification preferences
router.put('/preferences', updateNotificationPreferences);

// PUT /api/notifications/read-all - Mark all as read
router.put('/read-all', markAllAsRead);

// DELETE /api/notifications/clear-all - Clear all notifications
router.delete('/clear-all', clearAllNotifications);

// PUT /api/notifications/:id/read - Mark single notification as read
router.put('/:id/read', markAsRead);

// DELETE /api/notifications/:id - Delete single notification
router.delete('/:id', deleteNotification);

export default router;
