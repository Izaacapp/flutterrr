import React, { useState, useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';

export const Notifications: React.FC = () => {
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  
  const { 
    notifications, 
    loading, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async (pageNum: number = 1) => {
    try {
      // This is a simple approach - the hook manages the state
      // For pagination, we might need to modify the hook or handle it here
      await fetchNotifications(pageNum, 20);
      setPage(pageNum);
      // Note: we'll need to modify the hook to return pagination info
      // For now, we'll assume hasMore is false
      setHasMore(false);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleDeleteNotification = async (notificationId: string) => {
    await deleteNotification(notificationId);
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const notificationDate = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - notificationDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return notificationDate.toLocaleDateString();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return '❤️';
      case 'comment':
        return '💬';
      case 'follow':
        return '👤';
      default:
        return '🔔';
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '2rem',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid var(--pb-light-periwinkle)',
          borderTop: '3px solid var(--pb-medium-purple)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}></div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '1rem',
      minHeight: '100vh'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid var(--pb-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: '700',
            color: 'var(--pb-dark-purple)'
          }}>
            Notifications
          </h1>
          
          {notifications.some(n => !n.isRead) && (
            <button
              onClick={handleMarkAllAsRead}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'transparent',
                border: '1px solid var(--pb-medium-purple)',
                borderRadius: '6px',
                color: 'var(--pb-medium-purple)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--pb-medium-purple)';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--pb-medium-purple)';
              }}
            >
              Mark all as read
            </button>
          )}
        </div>

        {notifications.length > 0 ? (
          <>
            {notifications.map((notification, index) => (
              <div
                key={notification._id}
                style={{
                  padding: '1rem 1.5rem',
                  borderBottom: index < notifications.length - 1 ? '1px solid var(--pb-ultra-light)' : 'none',
                  backgroundColor: notification.isRead ? 'transparent' : 'var(--pb-ultra-light)',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--pb-medium-purple)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    flexShrink: 0,
                    backgroundImage: notification.sender.avatar 
                      ? `url(${notification.sender.avatar})` 
                      : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    color: 'white',
                  }}>
                    {!notification.sender.avatar && notification.sender.fullName.charAt(0).toUpperCase()}
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.5rem',
                    }}>
                      <span style={{ fontSize: '16px' }}>
                        {getNotificationIcon(notification.type)}
                      </span>
                      <span style={{
                        fontSize: '0.875rem',
                        color: 'var(--pb-medium-purple)',
                      }}>
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                      {!notification.isRead && (
                        <div style={{
                          width: '8px',
                          height: '8px',
                          backgroundColor: '#ef4444',
                          borderRadius: '50%',
                        }}></div>
                      )}
                    </div>
                    
                    <p style={{
                      margin: 0,
                      fontSize: '1rem',
                      color: 'var(--pb-dark-purple)',
                      lineHeight: '1.5',
                      marginBottom: '0.5rem'
                    }}>
                      {notification.message}
                    </p>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notification._id)}
                          style={{
                            padding: '0.25rem 0.75rem',
                            backgroundColor: 'transparent',
                            border: '1px solid var(--pb-medium-purple)',
                            borderRadius: '4px',
                            color: 'var(--pb-medium-purple)',
                            cursor: 'pointer',
                            fontSize: '0.75rem'
                          }}
                        >
                          Mark as read
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDeleteNotification(notification._id)}
                        style={{
                          padding: '0.25rem 0.75rem',
                          backgroundColor: 'transparent',
                          border: '1px solid #ef4444',
                          borderRadius: '4px',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: '0.75rem'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {hasMore && (
              <div style={{ padding: '1rem', textAlign: 'center' }}>
                <button
                  onClick={() => loadNotifications(page + 1)}
                  disabled={loading}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'var(--pb-medium-purple)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            color: 'var(--pb-medium-purple)',
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔔</div>
            <h2 style={{
              margin: '0 0 0.5rem 0',
              fontSize: '1.25rem',
              fontWeight: '600',
              color: 'var(--pb-dark-purple)'
            }}>
              No notifications yet
            </h2>
            <p style={{ margin: 0, fontSize: '1rem' }}>
              You'll be notified when someone likes or comments on your posts!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};