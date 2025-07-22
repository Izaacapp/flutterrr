const API_URL = `${import.meta.env.VITE_API_URL}/api/notifications`;

export interface Notification {
  _id: string;
  recipient: string;
  sender: {
    _id: string;
    fullName: string;
    username: string;
    avatar?: string;
  };
  type: 'like' | 'comment' | 'follow' | 'post_mention' | 'comment_mention';
  message: string;
  relatedPost?: {
    _id: string;
    content: string;
    images?: string[];
  };
  relatedComment?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationResponse {
  success: boolean;
  data?: {
    notifications: Notification[];
    totalCount: number;
    unreadCount: number;
  };
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
  message?: string;
  error?: string;
}

export interface UnreadCountResponse {
  success: boolean;
  data?: {
    count: number;
  };
  message?: string;
  error?: string;
}

class NotificationService {
  private getAuthHeaders() {
    const TOKEN_KEY = import.meta.env.VITE_AUTH_TOKEN_KEY || 'passport_buddy_token';
    const token = localStorage.getItem(TOKEN_KEY);
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  async getNotifications(page: number = 1, limit: number = 20): Promise<NotificationResponse> {
    try {
      const response = await fetch(`${API_URL}?page=${page}&limit=${limit}`, {
        headers: this.getAuthHeaders(),
        credentials: 'include',
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get notifications error:', error);
      return {
        success: false,
        message: 'Failed to fetch notifications',
      };
    }
  }

  async getUnreadCount(): Promise<UnreadCountResponse> {
    try {
      const response = await fetch(`${API_URL}/unread-count`, {
        headers: this.getAuthHeaders(),
        credentials: 'include',
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get unread count error:', error);
      return {
        success: false,
        message: 'Failed to fetch unread count',
      };
    }
  }

  async markAsRead(notificationId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${API_URL}/${notificationId}/read`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        credentials: 'include',
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Mark as read error:', error);
      return {
        success: false,
        message: 'Failed to mark notification as read',
      };
    }
  }

  async markAllAsRead(): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${API_URL}/mark-all-read`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        credentials: 'include',
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Mark all as read error:', error);
      return {
        success: false,
        message: 'Failed to mark all notifications as read',
      };
    }
  }

  async deleteNotification(notificationId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${API_URL}/${notificationId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
        credentials: 'include',
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Delete notification error:', error);
      return {
        success: false,
        message: 'Failed to delete notification',
      };
    }
  }
}

export default new NotificationService();