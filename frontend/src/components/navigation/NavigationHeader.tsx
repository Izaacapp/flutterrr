import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export const NavigationHeader: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const isActive = (path: string) => location.pathname === path;

  const navButtonStyle = (path: string) => ({
    padding: '0.375rem',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: isActive(path) ? 'var(--pb-dark-purple)' : 'var(--pb-medium-purple)',
    textDecoration: 'none'
  });

  return (
    <header style={{
      backgroundColor: 'var(--pb-white)',
      borderBottom: '1px solid var(--pb-border)',
      padding: '0.5rem 0',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 0.75rem'
      }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--pb-dark-purple)', margin: 0 }}>
            Passport Buddy
          </h1>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--pb-dark-purple)" stroke="none">
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1L15 22v-1.5L13 19v-5.5l8 2.5z"/>
          </svg>
        </Link>
        
        {/* Search Bar */}
        <form onSubmit={(e) => {
          e.preventDefault();
          if (searchQuery.trim()) {
            navigate(`/explore?location=${encodeURIComponent(searchQuery)}`);
            setSearchQuery('');
          }
        }} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          padding: '0.25rem 0.5rem',
          backgroundColor: 'var(--pb-ultra-light)',
          borderRadius: '16px',
          border: '1px solid var(--pb-light-periwinkle)',
          minWidth: '200px',
          fontSize: '0.813rem'
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search friends, destinations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              color: 'var(--pb-dark-purple)',
              fontSize: '0.813rem',
              width: '100%'
            }}
          />
        </form>
        
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <Link to="/" style={navButtonStyle('/')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </Link>
          
          <Link to="/flights" style={navButtonStyle('/flights')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="6" width="18" height="12" rx="2"/>
              <line x1="9" y1="6" x2="9" y2="18"/>
              <line x1="6" y1="10" x2="6" y2="10.01"/>
              <line x1="6" y1="14" x2="6" y2="14.01"/>
              <line x1="13" y1="10" x2="18" y2="10"/>
              <line x1="13" y1="14" x2="18" y2="14"/>
            </svg>
          </Link>
          
          <Link to="/earth" style={navButtonStyle('/earth')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </Link>
          
          <Link to="/notifications" style={navButtonStyle('/notifications')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </Link>
          
          <Link to="/profile" style={navButtonStyle('/profile')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </Link>
        </nav>
      </div>
    </header>
  );
};