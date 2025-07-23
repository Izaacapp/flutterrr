import { Notification, INotification } from '../models/Notification';
import { socketService } from './socket.service';
import { User } from '../models/User';
import { Post } from '../models/Post';

interface CreateNotificationData {
  recipientId: string;
  senderId: string;
  type: 'follow' | 'like' | 'comment' | 'mention' | 'post';
  entityId?: string;
  entityType?: 'post' | 'comment' | 'user';
  message?: string;
}

class NotificationService {
  async createNotification(data: CreateNotificationData): Promise<INotification | null> {
    try {
      // Don't create notification if sender and recipient are the same
      if (data.recipientId === data.senderId) {
        return null;
      }

      // Generate message if not provided
      let message = data.message;
      if (!message) {
        const sender = await User.findById(data.senderId).select('username');
        if (!sender) return null;

        switch (data.type) {
          case 'follow':
            message = `${sender.username} started following you`;
            break;
          case 'like':
            message = `${sender.username} liked your post`;
            break;
          case 'comment':
            message = `${sender.username} commented on your post`;
            break;
          case 'mention':
            message = `${sender.username} mentioned you in a post`;
            break;
          case 'post':
            message = `${sender.username} created a new post`;
            break;
          default:
            message = 'New notification';
        }
      }

      const notification = await Notification.create({
        recipient: data.recipientId,
        sender: data.senderId,
        type: data.type,
        entityId: data.entityId,
        entityType: data.entityType,
        message
      });

      // Populate sender info for real-time notification
      const populatedNotification = await Notification.findById(notification._id)
        .populate('sender', 'username avatar')
        .lean();

      // Send real-time notification
      if (populatedNotification) {
        socketService.sendNotification(data.recipientId, populatedNotification);
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }

  async getNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ recipient: userId })
      .populate('sender', 'username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Notification.countDocuments({ recipient: userId });
    const unreadCount = await Notification.countDocuments({ recipient: userId, read: false });

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      unreadCount
    };
  }

  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const result = await Notification.updateOne(
      { _id: notificationId, recipient: userId },
      { read: true }
    );

    return result.modifiedCount > 0;
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await Notification.updateMany(
      { recipient: userId, read: false },
      { read: true }
    );

    return result.modifiedCount;
  }

  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    const result = await Notification.deleteOne({
      _id: notificationId,
      recipient: userId
    });

    return result.deletedCount > 0;
  }

  async deleteOldNotifications(daysOld = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await Notification.deleteMany({
      createdAt: { $lt: cutoffDate }
    });

    return result.deletedCount;
  }

  // Create notifications for followers when user creates a post
  async notifyFollowersOfNewPost(userId: string, postId: string) {
    const user = await User.findById(userId).populate('followers', '_id');
    if (!user || !user.followers) return;

    const post = await Post.findById(postId);
    if (!post) return;

    // Create notifications for all followers
    const notifications = user.followers.map(follower => ({
      recipientId: (follower as any)._id.toString(),
      senderId: userId,
      type: 'post' as const,
      entityId: postId,
      entityType: 'post' as const,
      message: `${user.username} shared a new post`
    }));

    // Create notifications in batches
    for (const notificationData of notifications) {
      await this.createNotification(notificationData);
    }

    // Emit real-time event to followers
    socketService.notifyFollowers(userId, 'newPost', {
      postId,
      userId,
      username: user.username,
      preview: post.content.substring(0, 100)
    });
  }
}

export const notificationService = new NotificationService();