import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';

interface NotificationBellProps {
  style?: React.CSSProperties;
  isActive?: boolean;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ style = {}, isActive = false }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { 
    unreadCount, 
    notifications, 
    loading, 
    fetchNotifications, 
    markAsRead 
  } = useNotifications();

  // Handle clicking outside to close dropdown
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBellClick = () => {
    if (!isDropdownOpen) {
      fetchNotifications(1, 5);
    }
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }
    setIsDropdownOpen(false);
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const notificationDate = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - notificationDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
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

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={handleBellClick}
        style={{
          ...style,
          position: 'relative',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          padding: '0.375rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '6px',
          transition: 'background-color 0.2s ease',
          color: isActive ? 'var(--pb-dark-purple)' : 'var(--pb-medium-purple)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--pb-ultra-light)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            backgroundColor: '#ef4444',
            color: 'white',
            borderRadius: '50%',
            width: '16px',
            height: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 'bold',
            minWidth: '16px',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isDropdownOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '0.5rem',
          backgroundColor: 'white',
          border: '1px solid var(--pb-border)',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          width: '320px',
          maxHeight: '400px',
          overflowY: 'auto',
          zIndex: 1000,
        }}>
          <div style={{
            padding: '1rem 1rem 0.5rem 1rem',
            borderBottom: '1px solid var(--pb-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <h3 style={{
              margin: 0,
              fontSize: '1rem',
              fontWeight: '600',
              color: 'var(--pb-dark-purple)',
            }}>
              Notifications
            </h3>
            <Link
              to="/notifications"
              onClick={() => setIsDropdownOpen(false)}
              style={{
                fontSize: '0.875rem',
                color: 'var(--pb-medium-purple)',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = 'underline';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = 'none';
              }}
            >
              View all
            </Link>
          </div>

          {loading ? (
            <div style={{
              padding: '2rem',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                border: '2px solid var(--pb-light-periwinkle)',
                borderTop: '2px solid var(--pb-medium-purple)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}></div>
            </div>
          ) : notifications.length > 0 ? (
            <div>
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  style={{
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid var(--pb-ultra-light)',
                    cursor: 'pointer',
                    backgroundColor: notification.isRead ? 'transparent' : 'var(--pb-ultra-light)',
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--pb-light-periwinkle)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = notification.isRead ? 'transparent' : 'var(--pb-ultra-light)';
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--pb-medium-purple)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
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
                        marginBottom: '0.25rem',
                      }}>
                        <span style={{ fontSize: '12px' }}>
                          {getNotificationIcon(notification.type)}
                        </span>
                        <span style={{
                          fontSize: '0.75rem',
                          color: 'var(--pb-medium-purple)',
                        }}>
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                        {!notification.isRead && (
                          <div style={{
                            width: '6px',
                            height: '6px',
                            backgroundColor: '#ef4444',
                            borderRadius: '50%',
                          }}></div>
                        )}
                      </div>
                      
                      <p style={{
                        margin: 0,
                        fontSize: '0.875rem',
                        color: 'var(--pb-dark-purple)',
                        lineHeight: '1.4',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}>
                        {notification.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              color: 'var(--pb-medium-purple)',
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔔</div>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>
                No notifications yet
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};