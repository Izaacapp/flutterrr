import { Request, Response } from 'express';
import { notificationService } from '../services/notification.service';

interface CustomRequest extends Request {
  userId?: string;
  user?: any;
}

class NotificationController {
  async getNotifications(req: CustomRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await notificationService.getNotifications(userId, page, limit);
      res.json(result);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  }

  async markAsRead(req: CustomRequest, res: Response) {
    try {
      const userId = req.userId;
      const notificationId = req.params.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const success = await notificationService.markAsRead(notificationId, userId);
      if (!success) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      res.json({ message: 'Notification marked as read' });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: 'Failed to update notification' });
    }
  }

  async markAllAsRead(req: CustomRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const count = await notificationService.markAllAsRead(userId);
      res.json({ message: `${count} notifications marked as read` });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ error: 'Failed to update notifications' });
    }
  }

  async deleteNotification(req: CustomRequest, res: Response) {
    try {
      const userId = req.userId;
      const notificationId = req.params.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const success = await notificationService.deleteNotification(notificationId, userId);
      if (!success) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      res.json({ message: 'Notification deleted' });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ error: 'Failed to delete notification' });
    }
  }

  async getUnreadCount(req: CustomRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const result = await notificationService.getNotifications(userId, 1, 1);
      res.json({ unreadCount: result.unreadCount });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      res.status(500).json({ error: 'Failed to fetch unread count' });
    }
  }
}

export const notificationController = new NotificationController();