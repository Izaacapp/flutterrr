import { requestDeduplicator } from '../utils/requestDeduplicator';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function makeRequest(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('passport_buddy_token');
  const url = `${API_BASE}${endpoint}`;
  
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export const notificationService = {
  async getNotifications(page: number = 1, limit: number = 20) {
    return requestDeduplicator.deduplicate(
      `notifications-${page}-${limit}`,
      () => makeRequest(`/api/v1/notifications?page=${page}&limit=${limit}`)
    );
  },

  async markAsRead(notificationId: string) {
    return makeRequest(`/api/v1/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  },

  async markAllAsRead() {
    return makeRequest('/api/v1/notifications/read-all', {
      method: 'PATCH',
    });
  },

  async deleteNotification(notificationId: string) {
    return makeRequest(`/api/v1/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  },

  async getUnreadCount() {
    return makeRequest('/api/v1/notifications/unread-count');
  }
};