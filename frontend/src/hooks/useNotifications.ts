import { useState, useEffect, useRef } from 'react';
import NotificationService, { Notification } from '../services/notification.service';

interface UseNotificationsReturn {
  unreadCount: number;
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  fetchNotifications: (page?: number, limit?: number) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
}

export const useNotifications = (): UseNotificationsReturn => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchUnreadCount = async () => {
    try {
      const response = await NotificationService.getUnreadCount();
      if (response.success && response.data) {
        setUnreadCount(response.data.count);
      } else {
        setError(response.message || 'Failed to fetch unread count');
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      setError('Network error');
    }
  };

  const fetchNotifications = async (page: number = 1, limit: number = 20) => {
    try {
      setLoading(page === 1);
      setError(null);
      
      const response = await NotificationService.getNotifications(page, limit);
      
      if (response.success && response.data) {
        if (page === 1) {
          setNotifications(response.data.notifications);
        } else {
          setNotifications(prev => [...prev, ...response.data!.notifications]);
        }
        setUnreadCount(response.data.unreadCount);
      } else {
        setError(response.message || 'Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await NotificationService.markAsRead(notificationId);
      if (response.success) {
        setNotifications(prev => 
          prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        setError(response.message || 'Failed to mark as read');
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      setError('Network error');
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await NotificationService.markAllAsRead();
      if (response.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      } else {
        setError(response.message || 'Failed to mark all as read');
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      setError('Network error');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const notification = notifications.find(n => n._id === notificationId);
      const response = await NotificationService.deleteNotification(notificationId);
      
      if (response.success) {
        setNotifications(prev => prev.filter(n => n._id !== notificationId));
        if (notification && !notification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      } else {
        setError(response.message || 'Failed to delete notification');
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
      setError('Network error');
    }
  };

  const refreshUnreadCount = async () => {
    await fetchUnreadCount();
  };

  // Set up polling for unread count
  useEffect(() => {
    fetchUnreadCount();
    
    intervalRef.current = setInterval(() => {
      fetchUnreadCount();
    }, 30000); // Poll every 30 seconds
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Listen for visibility change to refresh when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchUnreadCount();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return {
    unreadCount,
    notifications,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshUnreadCount,
  };
};