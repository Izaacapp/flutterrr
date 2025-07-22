import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';

export class NotificationController {
  static async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await NotificationService.getNotifications(userId, page, limit);

      res.status(200).json({
        success: true,
        data: result,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(result.totalCount / limit),
          hasMore: page * limit < result.totalCount
        }
      });
    } catch (error: any) {
      console.error('Get notifications error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notifications',
        error: error.message
      });
    }
  }

  static async getUnreadCount(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const count = await NotificationService.getUnreadCount(userId);

      res.status(200).json({
        success: true,
        data: { count }
      });
    } catch (error: any) {
      console.error('Get unread count error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch unread count',
        error: error.message
      });
    }
  }

  static async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const { notificationId } = req.params;

      if (!notificationId) {
        res.status(400).json({
          success: false,
          message: 'Notification ID is required'
        });
        return;
      }

      const notification = await NotificationService.markAsRead(notificationId, userId);

      if (!notification) {
        res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: notification,
        message: 'Notification marked as read'
      });
    } catch (error: any) {
      console.error('Mark as read error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read',
        error: error.message
      });
    }
  }

  static async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const result = await NotificationService.markAllAsRead(userId);

      res.status(200).json({
        success: true,
        data: result,
        message: `${result.modifiedCount} notifications marked as read`
      });
    } catch (error: any) {
      console.error('Mark all as read error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark all notifications as read',
        error: error.message
      });
    }
  }

  static async deleteNotification(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const { notificationId } = req.params;

      if (!notificationId) {
        res.status(400).json({
          success: false,
          message: 'Notification ID is required'
        });
        return;
      }

      const deleted = await NotificationService.deleteNotification(notificationId, userId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Notification deleted successfully'
      });
    } catch (error: any) {
      console.error('Delete notification error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete notification',
        error: error.message
      });
    }
  }
}