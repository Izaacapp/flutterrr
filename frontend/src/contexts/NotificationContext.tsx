import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Notification } from '../types/notification.types';
import { notificationService } from '../services/notification.service';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  hasMore: boolean;
  totalCount: number;
  fetchNotifications: (page?: number, limit?: number) => Promise<{ hasMore: boolean; totalCount: number } | void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const { isAuthenticated } = useAuth();

  // Fetch notifications
  const fetchNotifications = async (page: number = 1, limit: number = 20) => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoading(true);
      const response = await notificationService.getNotifications(page, limit);
      
      if (response.success) {
        if (page === 1) {
          setNotifications(response.data.notifications);
        } else {
          setNotifications(prev => [...prev, ...response.data.notifications]);
        }
        setUnreadCount(response.data.unreadCount);
        setTotalCount(response.data.totalCount);
        setHasMore(response.pagination.hasMore);
        
        return {
          hasMore: response.pagination.hasMore,
          totalCount: response.data.totalCount
        };
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark single notification as read
  const markAsRead = async (notificationId: string) => {
    // Find the notification to check if it's already read
    const notification = notifications.find(n => n._id === notificationId);
    if (!notification || notification.isRead) {
      return; // Already read or not found
    }

    // Optimistic update - immediately update UI
    setNotifications(prev => 
      prev.map(n => 
        n._id === notificationId 
          ? { ...n, isRead: true }
          : n
      )
    );
    
    // Optimistically update unread count
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      // Make API call in background
      const response = await notificationService.markAsRead(notificationId);
      
      if (!response.success) {
        // Revert optimistic update on failure
        setNotifications(prev => 
          prev.map(n => 
            n._id === notificationId 
              ? { ...n, isRead: false }
              : n
          )
        );
        setUnreadCount(prev => prev + 1);
        console.error('Failed to mark notification as read');
      }
    } catch (error) {
      // Revert optimistic update on error
      setNotifications(prev => 
        prev.map(n => 
          n._id === notificationId 
            ? { ...n, isRead: false }
            : n
        )
      );
      setUnreadCount(prev => prev + 1);
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    // Store original state for potential rollback
    const originalNotifications = [...notifications];
    const originalUnreadCount = unreadCount;

    // Optimistic update - immediately update UI
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
    setUnreadCount(0);

    try {
      const response = await notificationService.markAllAsRead();
      
      if (!response.success) {
        // Revert optimistic update on failure
        setNotifications(originalNotifications);
        setUnreadCount(originalUnreadCount);
        console.error('Failed to mark all notifications as read');
      }
    } catch (error) {
      // Revert optimistic update on error
      setNotifications(originalNotifications);
      setUnreadCount(originalUnreadCount);
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    // Find the notification to check if it was unread
    const notificationToDelete = notifications.find(n => n._id === notificationId);
    if (!notificationToDelete) return;

    // Optimistic update - immediately remove from UI
    setNotifications(prev => 
      prev.filter(notification => notification._id !== notificationId)
    );
    
    // Optimistically update unread count if notification was unread
    if (!notificationToDelete.isRead) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    try {
      const response = await notificationService.deleteNotification(notificationId);
      
      if (!response.success) {
        // Revert optimistic update on failure
        setNotifications(prev => [...prev, notificationToDelete].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
        
        if (!notificationToDelete.isRead) {
          setUnreadCount(prev => prev + 1);
        }
        console.error('Failed to delete notification');
      }
    } catch (error) {
      // Revert optimistic update on error
      setNotifications(prev => [...prev, notificationToDelete].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
      
      if (!notificationToDelete.isRead) {
        setUnreadCount(prev => prev + 1);
      }
      console.error('Error deleting notification:', error);
    }
  };

  // Refresh unread count
  const refreshUnreadCount = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await notificationService.getUnreadCount();
      if (response.success) {
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error('Error refreshing unread count:', error);
    }
  };

  // Initial load and periodic refresh of unread count
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      setHasMore(true);
      setTotalCount(0);
      return;
    }

    refreshUnreadCount();
    
    // Refresh unread count every 30 seconds
    const interval = setInterval(refreshUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const value = {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    totalCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshUnreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};