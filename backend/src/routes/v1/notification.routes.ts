import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { notificationController } from '../../controllers/notification.controller';

const router = Router();

// Get user's notifications
router.get('/', authenticate, notificationController.getNotifications);

// Mark notification as read
router.patch('/:id/read', authenticate, notificationController.markAsRead);

// Mark all notifications as read
router.patch('/read-all', authenticate, notificationController.markAllAsRead);

// Delete a notification
router.delete('/:id', authenticate, notificationController.deleteNotification);

// Get unread count
router.get('/unread-count', authenticate, notificationController.getUnreadCount);

export default router;