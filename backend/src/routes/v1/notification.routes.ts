import express from 'express';
import { NotificationController } from '../../controllers/notification.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = express.Router();

// All notification routes require authentication
router.use(authenticate);

// GET /api/notifications - Get user's notifications with pagination
router.get('/', NotificationController.getNotifications);

// GET /api/notifications/unread-count - Get count of unread notifications
router.get('/unread-count', NotificationController.getUnreadCount);

// PUT /api/notifications/:notificationId/read - Mark specific notification as read
router.put('/:notificationId/read', NotificationController.markAsRead);

// PUT /api/notifications/mark-all-read - Mark all notifications as read
router.put('/mark-all-read', NotificationController.markAllAsRead);

// DELETE /api/notifications/:notificationId - Delete specific notification
router.delete('/:notificationId', NotificationController.deleteNotification);

export default router;