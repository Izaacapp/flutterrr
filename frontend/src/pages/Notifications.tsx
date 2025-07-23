import React, { useEffect, useState, useCallback, useMemo, memo } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { notificationService } from '../services/notification.service';
import { useToast } from '../contexts/ToastContext';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import './Notifications.css';

// Memoized notification item component
interface NotificationItemProps {
  notification: any;
  onClick: () => void;
  onSenderClick: (e: React.MouseEvent) => void;
  icon: React.ReactNode;
}

const NotificationItem = memo<NotificationItemProps>(({ notification, onClick, onSenderClick, icon }) => {
  return (
    <div 
      className={`notification-item ${!notification.read ? 'unread' : ''}`}
      onClick={onClick}
    >
      <div className="notification-left">
        {notification.sender?.avatar ? (
          <img 
            src={notification.sender.avatar} 
            alt={notification.sender.username}
            className="sender-avatar"
          />
        ) : (
          <div className="sender-avatar-placeholder">
            {notification.sender?.username?.charAt(0).toUpperCase() || '?'}
          </div>
        )}
        {icon}
      </div>
      
      <div className="notification-content">
        <p className="notification-message">
          <span 
            className="clickable-username"
            onClick={onSenderClick}
          >
            {notification.sender?.username}
          </span>
          {' '}
          <span className="action-text">
            {notification.type === 'follow' && 'started following you'}
            {notification.type === 'like' && 'liked your post'}
            {notification.type === 'comment' && 'commented on your post'}
            {notification.type === 'post' && 'shared a new post'}
          </span>
        </p>
        <span className="notification-time">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </span>
      </div>

      {!notification.read && <div className="unread-dot"></div>}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function
  return (
    prevProps.notification._id === nextProps.notification._id &&
    prevProps.notification.read === nextProps.notification.read &&
    prevProps.notification.createdAt === nextProps.notification.createdAt
  );
});

export const Notifications: React.FC = () => {
  const { notifications: realtimeNotifications, unreadCount, markAllAsRead: markAllSocketRead } = useSocket();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const notificationsRef = React.useRef(notifications);

  // Update ref when notifications change
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  useEffect(() => {
    loadNotifications();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Merge real-time notifications with fetched ones
    if (realtimeNotifications.length > 0) {
      setNotifications(prev => {
        const newNotifs = realtimeNotifications.filter(
          rtNotif => !prev.some(notif => notif._id === rtNotif._id)
        );
        return [...newNotifs, ...prev];
      });
    }
  }, [realtimeNotifications]);

  const loadNotifications = useCallback(async (pageNum?: number) => {
    const currentPage = pageNum || page;
    try {
      // Don't set loading for pagination to avoid jumps
      if (currentPage === 1) {
        setLoading(true);
      }
      const result = await notificationService.getNotifications(currentPage);
      
      if (currentPage === 1) {
        setNotifications(result.notifications);
      } else {
        setNotifications(prev => [...prev, ...result.notifications]);
      }
      
      setHasMore(result.pagination.page < result.pagination.pages);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error loading notifications:', error);
      }
      showToast('Failed to load notifications', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, showToast]);

  const handleMarkAsRead = useCallback(async (id: string) => {
    try {
      // Optimistic update first
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === id ? { ...notif, read: true } : notif
        )
      );
      await notificationService.markAsRead(id);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error marking notification as read:', error);
      }
      // Revert on error
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === id ? { ...notif, read: false } : notif
        )
      );
    }
  }, []);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      // Store current state for potential revert
      const previousReadStates = new Map<string, boolean>();
      notificationsRef.current.forEach(n => previousReadStates.set(n._id, n.read));
      
      // Optimistic update
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
      markAllSocketRead();
      
      await notificationService.markAllAsRead();
      showToast('All notifications marked as read', 'success');
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error marking all as read:', error);
      }
      // Revert on error
      setNotifications(prev => 
        prev.map(notif => ({ 
          ...notif, 
          read: previousReadStates.get(notif._id) || false 
        }))
      );
      showToast('Failed to mark all as read', 'error');
    }
  }, [markAllSocketRead, showToast]);

  const handleNotificationClick = useCallback((notification: any) => {
    if (!notification.read) {
      handleMarkAsRead(notification._id);
    }

    // Small delay to prevent jarring transition
    setTimeout(() => {
      // Navigate based on notification type
      switch (notification.type) {
        case 'follow':
          navigate(`/profile/${notification.sender.username}`);
          break;
        case 'like':
        case 'comment':
        case 'post':
        case 'mention':
          if (notification.entityId) {
            navigate('/', { state: { scrollToPost: notification.entityId } });
          } else {
            navigate('/');
          }
          break;
        default:
          navigate('/');
          break;
      }
    }, 100);
  }, [navigate, handleMarkAsRead]);

  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadNotifications(nextPage);
  }, [page, loadNotifications]);

  const getNotificationIcon = useCallback((type: string) => {
    switch (type) {
      case 'follow':
        return (
          <div className="notification-icon-wrapper follow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
        );
      case 'like':
        return (
          <div className="notification-icon-wrapper like">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
        );
      case 'comment':
        return (
          <div className="notification-icon-wrapper comment">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z"/>
            </svg>
          </div>
        );
      case 'post':
        return (
          <div className="notification-icon-wrapper post">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
          </div>
        );
      default:
        return (
          <div className="notification-icon-wrapper default">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
            </svg>
          </div>
        );
    }
  }, []);

  const filteredNotifications = useMemo(() => 
    filter === 'unread' 
      ? notifications.filter(n => !n.read)
      : notifications,
    [filter, notifications]
  );

  if (loading && page === 1) {
    return (
      <div className="notifications-loading">
        <div className="loading-skeleton">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton-item">
              <div className="skeleton-avatar"></div>
              <div className="skeleton-content">
                <div className="skeleton-text"></div>
                <div className="skeleton-time"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <h1>Notifications</h1>
        <div className="header-actions">
          <div className="filter-tabs">
            <button 
              className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button 
              className={`filter-tab ${filter === 'unread' ? 'active' : ''}`}
              onClick={() => setFilter('unread')}
            >
              Unread {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
            </button>
          </div>
          {filteredNotifications.some(n => !n.read) && (
            <button 
              className="mark-all-btn"
              onClick={handleMarkAllAsRead}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
              </svg>
              Mark all read
            </button>
          )}
        </div>
      </div>

      {filteredNotifications.length === 0 ? (
        <div className="notifications-empty">
          <div className="empty-illustration">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="var(--pb-primary)" strokeWidth="1.5">
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1L15 22v-1.5L13 19v-5.5l8 2.5z"/>
            </svg>
          </div>
          <h2>{filter === 'unread' ? 'All caught up!' : 'Your journey starts here'}</h2>
          <p>When friends interact with your posts or follow you, notifications will appear here.</p>
        </div>
      ) : (
        <div className="notifications-list">
          {filteredNotifications.map((notification) => (
            <NotificationItem
              key={notification._id}
              notification={notification}
              onClick={() => handleNotificationClick(notification)}
              onSenderClick={(e) => {
                e.stopPropagation();
                navigate(`/profile/${notification.sender?.username}`);
              }}
              icon={getNotificationIcon(notification.type)}
            />
          ))}
          
          {hasMore && !loading && (
            <div className="load-more-container">
              <button className="load-more-btn" onClick={loadMore}>
                Show more
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};