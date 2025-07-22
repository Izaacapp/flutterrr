import React from 'react';

export const Notifications: React.FC = () => {
  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2rem',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '4rem',
          marginBottom: '1.5rem'
        }}>
          🔔
        </div>
        
        <h1 style={{
          fontSize: '2rem',
          fontWeight: '700',
          color: '#1f2937',
          marginBottom: '1rem'
        }}>
          Notifications
        </h1>
        
        <p style={{
          fontSize: '1.1rem',
          color: '#6b7280',
          marginBottom: '2rem',
          lineHeight: '1.6'
        }}>
          Stay updated with flight alerts, itinerary changes, and social activity from your travel network.
        </p>
        
        <div style={{
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '1rem'
          }}>
            Coming Soon!
          </h2>
          
          <p style={{
            color: '#6b7280',
            marginBottom: '1.5rem'
          }}>
            This feature is under development. You'll receive notifications for:
          </p>
          
          <div style={{
            textAlign: 'left',
            display: 'inline-block'
          }}>
            <div style={{ marginBottom: '0.75rem', color: '#374151' }}>
              ✈️ Flight delays and gate changes
            </div>
            <div style={{ marginBottom: '0.75rem', color: '#374151' }}>
              📋 Itinerary updates and reminders
            </div>
            <div style={{ marginBottom: '0.75rem', color: '#374151' }}>
              👥 Friend activity and posts
            </div>
            <div style={{ marginBottom: '0.75rem', color: '#374151' }}>
              🌍 Travel recommendations
            </div>
            <div style={{ marginBottom: '0.75rem', color: '#374151' }}>
              🎯 Goal achievements and milestones
            </div>
          </div>
        </div>
        
        <div style={{
          backgroundColor: '#dbeafe',
          border: '1px solid #93c5fd',
          borderRadius: '8px',
          padding: '1rem',
          color: '#1e40af'
        }}>
          <strong>💡 Tip:</strong> Enable push notifications in your browser settings to never miss important travel updates!
        </div>
      </div>
    </div>
  );
};