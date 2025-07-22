import Notification, { INotification, NotificationType } from '../models/Notification';
import User from '../models/User';
import { Schema } from 'mongoose';

export class NotificationService {
  static async createNotification(
    recipientId: string,
    senderId: string,
    type: NotificationType,
    message: string,
    relatedPostId?: string,
    relatedComment?: string
  ): Promise<INotification | null> {
    try {
      // Don't create notification if sender is the same as recipient
      if (recipientId === senderId) {
        return null;
      }

      // Check if recipient exists and hasn't blocked the sender
      const recipient = await User.findById(recipientId);
      if (!recipient) {
        throw new Error('Recipient not found');
      }

      // Check if recipient has blocked the sender
      if (recipient.blockedUsers?.includes(senderId as any)) {
        return null;
      }

      const notification = new Notification({
        recipient: recipientId,
        sender: senderId,
        type,
        message,
        relatedPost: relatedPostId,
        relatedComment,
        isRead: false
      });

      await notification.save();
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  static async createLikeNotification(
    postAuthorId: string,
    likerId: string,
    postId: string,
    liker: { fullName: string }
  ): Promise<INotification | null> {
    const message = `${liker.fullName} liked your post`;
    return this.createNotification(
      postAuthorId,
      likerId,
      NotificationType.LIKE,
      message,
      postId
    );
  }

  static async createCommentNotification(
    postAuthorId: string,
    commenterId: string,
    postId: string,
    commenter: { fullName: string }
  ): Promise<INotification | null> {
    const message = `${commenter.fullName} commented on your post`;
    return this.createNotification(
      postAuthorId,
      commenterId,
      NotificationType.COMMENT,
      message,
      postId
    );
  }

  static async createFollowNotification(
    followedUserId: string,
    followerId: string,
    follower: { fullName: string }
  ): Promise<INotification | null> {
    const message = `${follower.fullName} started following you`;
    return this.createNotification(
      followedUserId,
      followerId,
      NotificationType.FOLLOW,
      message
    );
  }

  static async getNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ notifications: INotification[]; totalCount: number; unreadCount: number }> {
    try {
      const skip = (page - 1) * limit;

      const [notifications, totalCount, unreadCount] = await Promise.all([
        Notification.find({ recipient: userId })
          .populate('sender', 'fullName username avatar')
          .populate('relatedPost', 'content images')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Notification.countDocuments({ recipient: userId }),
        Notification.countDocuments({ recipient: userId, isRead: false })
      ]);

      return {
        notifications: notifications as INotification[],
        totalCount,
        unreadCount
      };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  static async markAsRead(
    notificationId: string,
    userId: string
  ): Promise<INotification | null> {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: userId },
        { isRead: true },
        { new: true }
      ).populate('sender', 'fullName username avatar');

      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  static async markAllAsRead(userId: string): Promise<{ modifiedCount: number }> {
    try {
      const result = await Notification.updateMany(
        { recipient: userId, isRead: false },
        { isRead: true }
      );

      return { modifiedCount: result.modifiedCount };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  static async deleteNotification(
    notificationId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const result = await Notification.deleteOne({
        _id: notificationId,
        recipient: userId
      });

      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  static async getUnreadCount(userId: string): Promise<number> {
    try {
      return await Notification.countDocuments({
        recipient: userId,
        isRead: false
      });
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }
}