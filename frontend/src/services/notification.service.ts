import { 
  Notification, 
  NotificationResponse, 
  UnreadCountResponse, 
  MarkAsReadResponse, 
  MarkAllAsReadResponse 
} from '../types/notification.types';

class NotificationService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  }

  private getAuthToken(): string | null {
    const tokenKey = import.meta.env.VITE_AUTH_TOKEN_KEY || 'passport_buddy_token';
    return localStorage.getItem(tokenKey);
  }

  private getAuthHeaders(): Record<string, string> {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  private async makeRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getNotifications(page: number = 1, limit: number = 20): Promise<NotificationResponse> {
    const url = `${this.baseUrl}/api/notifications?page=${page}&limit=${limit}`;
    return this.makeRequest<NotificationResponse>(url, {
      method: 'GET',
    });
  }

  async getUnreadCount(): Promise<UnreadCountResponse> {
    const url = `${this.baseUrl}/api/notifications/unread-count`;
    return this.makeRequest<UnreadCountResponse>(url, {
      method: 'GET',
    });
  }

  async markAsRead(notificationId: string): Promise<MarkAsReadResponse> {
    const url = `${this.baseUrl}/api/notifications/${notificationId}/read`;
    return this.makeRequest<MarkAsReadResponse>(url, {
      method: 'PUT',
    });
  }

  async markAllAsRead(): Promise<MarkAllAsReadResponse> {
    const url = `${this.baseUrl}/api/notifications/mark-all-read`;
    return this.makeRequest<MarkAllAsReadResponse>(url, {
      method: 'PUT',
    });
  }

  async deleteNotification(notificationId: string): Promise<{ success: boolean; message: string }> {
    const url = `${this.baseUrl}/api/notifications/${notificationId}`;
    return this.makeRequest<{ success: boolean; message: string }>(url, {
      method: 'DELETE',
    });
  }

  // Utility method to format notification time
  formatNotificationTime(createdAt: string): string {
    const now = new Date();
    const notificationTime = new Date(createdAt);
    const diffInMs = now.getTime() - notificationTime.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return notificationTime.toLocaleDateString();
    }
  }

  // Get notification icon based on type
  getNotificationIcon(type: string): string {
    switch (type) {
      case 'like':
        return '❤️';
      case 'comment':
        return '💬';
      case 'follow':
        return '👤';
      case 'post_mention':
        return '📝';
      case 'comment_mention':
        return '💭';
      default:
        return '🔔';
    }
  }
}

export const notificationService = new NotificationService();