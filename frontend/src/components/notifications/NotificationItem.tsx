import React from 'react';
import { Notification, NotificationType } from '../../types/notification.types';
import { notificationService } from '../../services/notification.service';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (notificationId: string) => void;
  onDelete: (notificationId: string) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
}) => {
  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification._id);
    }
  };

  const getNotificationContent = () => {
    switch (notification.type) {
      case NotificationType.LIKE:
        return (
          <div>
            <strong>{notification.sender.fullName}</strong> liked your post
            {notification.relatedPost && (
              <div style={{
                marginTop: '0.5rem',
                padding: '0.5rem',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                fontSize: '0.875rem',
                color: '#6b7280'
              }}>
                "{notification.relatedPost.content.substring(0, 100)}
                {notification.relatedPost.content.length > 100 ? '...' : ''}"
              </div>
            )}
          </div>
        );
      case NotificationType.COMMENT:
        return (
          <div>
            <strong>{notification.sender.fullName}</strong> commented on your post
            {notification.relatedPost && (
              <div style={{
                marginTop: '0.5rem',
                padding: '0.5rem',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                fontSize: '0.875rem',
                color: '#6b7280'
              }}>
                "{notification.relatedPost.content.substring(0, 100)}
                {notification.relatedPost.content.length > 100 ? '...' : ''}"
              </div>
            )}
          </div>
        );
      case NotificationType.FOLLOW:
        return (
          <div>
            <strong>{notification.sender.fullName}</strong> started following you
          </div>
        );
      default:
        return <div>{notification.message}</div>;
    }
  };

  return (
    <div
      onClick={handleClick}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        padding: '1rem',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: notification.isRead ? 'white' : '#f0f9ff',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease',
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = notification.isRead ? '#f9fafb' : '#e0f2fe';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = notification.isRead ? 'white' : '#f0f9ff';
      }}
    >
      {/* Avatar */}
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: '#e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0
      }}>
        {notification.sender.avatar ? (
          <img
            src={notification.sender.avatar}
            alt={notification.sender.fullName}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        ) : (
          <span style={{
            fontSize: '1rem',
            color: '#6b7280'
          }}>
            {notification.sender.fullName.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '0.25rem'
        }}>
          <div style={{ flex: 1 }}>
            {getNotificationContent()}
          </div>
          <div style={{
            fontSize: '1.25rem',
            marginLeft: '0.5rem',
            flexShrink: 0
          }}>
            {notificationService.getNotificationIcon(notification.type)}
          </div>
        </div>
        
        {/* Time */}
        <div style={{
          fontSize: '0.75rem',
          color: '#6b7280',
          marginTop: '0.25rem'
        }}>
          {notificationService.formatNotificationTime(notification.createdAt)}
        </div>
      </div>

      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(notification._id);
        }}
        style={{
          position: 'absolute',
          top: '0.5rem',
          right: '0.5rem',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#9ca3af',
          fontSize: '1rem',
          padding: '0.25rem',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0,
          transition: 'opacity 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f3f4f6';
          e.currentTarget.style.color = '#6b7280';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = '#9ca3af';
        }}
        className="delete-button"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6 6 18"/>
          <path d="M6 6l12 12"/>
        </svg>
      </button>

      {/* Unread indicator */}
      {!notification.isRead && (
        <div style={{
          position: 'absolute',
          left: '0.5rem',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '6px',
          height: '6px',
          backgroundColor: '#3b82f6',
          borderRadius: '50%'
        }} />
      )}

      <style>
        {`
          .notification-item:hover .delete-button {
            opacity: 1;
          }
        `}
      </style>
    </div>
  );
};