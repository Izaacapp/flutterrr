import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { socketService } from '../services/socket.service';
import { notificationService } from '../services/notification.service';

interface SocketContextType {
  isConnected: boolean;
  notifications: any[];
  unreadCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated && user) {
      const token = localStorage.getItem(import.meta.env.VITE_AUTH_TOKEN_KEY || 'passport_buddy_token');
      if (token) {
        socketService.connect(token);

        const unsubscribeConnected = socketService.on('socketConnected', async () => {
          setIsConnected(true);
          // Fetch initial unread count
          try {
            const { unreadCount: count } = await notificationService.getUnreadCount();
            setUnreadCount(count);
          } catch (error) {
            console.error('Error fetching unread count:', error);
          }
        });

        const unsubscribeDisconnected = socketService.on('socketDisconnected', () => {
          setIsConnected(false);
        });

        const unsubscribeNotification = socketService.on('newNotification', (notification: any) => {
          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Show browser notification if permitted
          if (Notification.permission === 'granted') {
            new Notification(`New notification from ${notification.sender.username}`, {
              body: notification.message,
              icon: notification.sender.avatar || '/default-avatar.png'
            });
          }
        });

        return () => {
          unsubscribeConnected();
          unsubscribeDisconnected();
          unsubscribeNotification();
          socketService.disconnect();
        };
      }
    } else {
      socketService.disconnect();
      setIsConnected(false);
    }
  }, [isAuthenticated, user]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif._id === id ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <SocketContext.Provider value={{
      isConnected,
      notifications,
      unreadCount,
      markNotificationAsRead,
      markAllAsRead,
      clearNotifications
    }}>
      {children}
    </SocketContext.Provider>
  );
};