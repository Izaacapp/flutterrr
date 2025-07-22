export enum NotificationType {
  LIKE = 'like',
  COMMENT = 'comment',
  FOLLOW = 'follow',
  POST_MENTION = 'post_mention',
  COMMENT_MENTION = 'comment_mention'
}

export interface NotificationUser {
  _id: string;
  fullName: string;
  username: string;
  avatar?: string;
}

export interface NotificationPost {
  _id: string;
  content: string;
  images: Array<{
    url: string;
    key: string;
    size: number;
    mimetype: string;
  }>;
}

export interface Notification {
  _id: string;
  recipient: string;
  sender: NotificationUser;
  type: NotificationType;
  message: string;
  relatedPost?: NotificationPost;
  relatedComment?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationResponse {
  success: boolean;
  data: {
    notifications: Notification[];
    totalCount: number;
    unreadCount: number;
  };
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface UnreadCountResponse {
  success: boolean;
  data: {
    count: number;
  };
}

export interface MarkAsReadResponse {
  success: boolean;
  data?: Notification;
  message: string;
}

export interface MarkAllAsReadResponse {
  success: boolean;
  data: {
    modifiedCount: number;
  };
  message: string;
}