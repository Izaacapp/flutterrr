import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface RightSidebarProps {
  className?: string;
}

const RightSidebar: React.FC<RightSidebarProps> = () => {
  const { user } = useAuth();

  // Hide sidebar on smaller screens
  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
    return null;
  }

  return (
    <div style={{
      width: '280px',
      padding: '1.25rem',
      backgroundColor: 'var(--pb-white)',
      borderLeft: '1px solid var(--pb-light-periwinkle)',
      minHeight: '100vh',
      position: 'sticky',
      top: '80px',
      overflowY: 'auto',
      flexShrink: 0
    }}>
      {/* User Profile Section */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          backgroundColor: 'var(--pb-light-periwinkle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.25rem',
          fontWeight: '600',
          color: 'var(--pb-dark-purple)',
          margin: '0 auto 1rem'
        }}>
          {user?.username?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <h3 style={{ 
          margin: 0, 
          fontSize: '1rem', 
          fontWeight: '600',
          color: 'var(--pb-dark-purple)'
        }}>
          {user?.username}
        </h3>
        <p style={{ 
          margin: '0.25rem 0 0', 
          color: 'var(--pb-medium-purple)',
          fontSize: '0.875rem'
        }}>
          {user?.fullName}
        </p>
      </div>

      {/* Quick Stats */}
      <div style={{ 
        backgroundColor: 'var(--pb-ultra-light)',
        borderRadius: '12px',
        padding: '1rem',
        marginBottom: '2rem',
        border: '1px solid var(--pb-light-periwinkle)'
      }}>
        <h4 style={{ 
          marginBottom: '1rem', 
          fontSize: '0.875rem', 
          fontWeight: '600', 
          color: 'var(--pb-dark-purple)' 
        }}>
          Your Travel Stats
        </h4>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '1.25rem', 
              fontWeight: 'bold', 
              color: 'var(--pb-dark-purple)' 
            }}>
              {user?.countriesVisited?.length || 0}
            </div>
            <div style={{ 
              fontSize: '0.75rem', 
              color: 'var(--pb-medium-purple)' 
            }}>
              Countries
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '1.25rem', 
              fontWeight: 'bold', 
              color: 'var(--pb-dark-purple)' 
            }}>
              12
            </div>
            <div style={{ 
              fontSize: '0.75rem', 
              color: 'var(--pb-medium-purple)' 
            }}>
              Flights
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '1.25rem', 
              fontWeight: 'bold', 
              color: 'var(--pb-dark-purple)' 
            }}>
              {user?.milesFlown ? Math.floor(user.milesFlown / 1000) + 'k' : '0'}
            </div>
            <div style={{ 
              fontSize: '0.75rem', 
              color: 'var(--pb-medium-purple)' 
            }}>
              Miles
            </div>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ 
          marginBottom: '1rem', 
          fontSize: '0.875rem', 
          fontWeight: '600', 
          color: 'var(--pb-dark-purple)' 
        }}>
          Find Friends
        </h4>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem',
          backgroundColor: 'var(--pb-ultra-light)',
          borderRadius: '8px',
          border: '1px solid var(--pb-light-periwinkle)'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--pb-medium-purple)" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input 
            type="text" 
            placeholder="Search users..." 
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              flex: 1,
              color: 'var(--pb-dark-purple)',
              fontSize: '0.875rem'
            }}
          />
        </div>
      </div>

      {/* Suggested Users Section */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <h4 style={{ 
            margin: 0,
            fontSize: '0.875rem', 
            fontWeight: '600', 
            color: 'var(--pb-dark-purple)' 
          }}>
            Suggestions For You
          </h4>
          <button style={{
            background: 'none',
            border: 'none',
            color: 'var(--pb-medium-purple)',
            fontSize: '0.75rem',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}>
            See All
          </button>
        </div>
        
        <div style={{ color: 'var(--pb-medium-purple)', fontSize: '0.875rem' }}>
          No suggestions yet. Start connecting with other travelers!
        </div>
      </div>

      {/* Travel Tips */}
      <div style={{
        backgroundColor: 'var(--pb-ultra-light)',
        borderRadius: '12px',
        padding: '1rem',
        border: '1px solid var(--pb-light-periwinkle)'
      }}>
        <h4 style={{ 
          marginBottom: '0.5rem', 
          fontSize: '0.875rem', 
          fontWeight: '600', 
          color: 'var(--pb-dark-purple)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--pb-dark-purple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16V12"/>
            <path d="M12 8h.01"/>
          </svg>
          Travel Tip
        </h4>
        <p style={{ 
          margin: 0,
          fontSize: '0.75rem', 
          color: 'var(--pb-medium-purple)',
          lineHeight: '1.4'
        }}>
          Save your boarding passes and travel documents in the app for easy access during your trips!
        </p>
      </div>

      {/* Footer */}
      <div style={{ 
        textAlign: 'center', 
        fontSize: '0.75rem', 
        color: 'var(--pb-medium-purple)',
        marginTop: '2rem'
      }}>
        <p>&copy; 2024 Passport Buddy</p>
      </div>
    </div>
  );
};

export default RightSidebar;