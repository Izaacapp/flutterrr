import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import { userService } from '../../services/user.service';
import { debounce } from '../../utils/debounce';

interface SearchResult {
  _id: string;
  username: string;
  fullName: string;
  avatar?: string;
}

interface NavigationHeaderProps {
  onToggleSidebar?: () => void;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({ onToggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const { unreadCount } = useSocket();

  const isActive = (path: string) => location.pathname === path;

  const navButtonStyle = (path: string) => ({
    padding: '0.375rem',
    backgroundColor: isActive(path) ? 'var(--pb-ultra-light)' : 'transparent',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.1s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: isActive(path) ? 'var(--pb-dark-purple)' : 'var(--pb-medium-purple)',
    textDecoration: 'none',
    transform: 'scale(1)'
  });

  // Create debounced search function
  const performSearch = useCallback(async (query: string) => {
    if (query.trim().length > 0) {
      try {
        const results = await userService.searchUsers(query);
        setSearchResults(results.users || []);
        setShowDropdown(true);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Search error:', error);
        }
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  }, []);

  // Memoize debounced search function
  const debouncedSearch = useMemo(
    () => debounce(performSearch, 500), // Increased debounce delay for less responsiveness
    [performSearch]
  );

  // Search users with debouncing
  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectUser = useCallback((username: string) => {
    navigate(`/profile/${username}`);
    setSearchQuery('');
    setShowDropdown(false);
    setSelectedIndex(-1);
  }, [navigate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showDropdown || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          handleSelectUser(searchResults[selectedIndex].username);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  }, [showDropdown, searchResults, selectedIndex, handleSelectUser]);

  return (
    <>
      <style>{`
        .nav-link {
          padding: 0.375rem;
          background-color: transparent;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.1s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          transform: scale(1);
        }
        
        .nav-link:hover {
          background-color: var(--pb-ultra-light);
          transform: scale(1.02);
        }
        
        .nav-link:active {
          transform: scale(0.98);
        }
        
        .nav-link.active {
          background-color: var(--pb-ultra-light);
        }
      `}</style>
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
        <div ref={searchRef} style={{ position: 'relative' }}>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
              handleSelectUser(searchResults[selectedIndex].username);
            } else if (searchQuery.trim() && searchResults.length > 0) {
              handleSelectUser(searchResults[0].username);
            }
          }} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: 'var(--pb-ultra-light)',
            borderRadius: '20px',
            border: '1px solid var(--pb-light-periwinkle)',
            minWidth: '240px',
            fontSize: '0.875rem',
            transition: 'all 0.2s ease'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                color: 'var(--pb-dark-purple)',
                fontSize: '0.875rem',
                width: '100%',
                fontWeight: '400'
              }}
            />
          </form>

          {/* Search Results Dropdown */}
          {showDropdown && searchResults.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '0.25rem',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              border: '1px solid var(--pb-light-periwinkle)',
              maxHeight: '300px',
              overflowY: 'auto',
              zIndex: 1000
            }}>
              {searchResults.map((user, index) => (
                <div
                  key={user._id}
                  onClick={() => handleSelectUser(user.username)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    cursor: 'pointer',
                    backgroundColor: selectedIndex === index ? 'var(--pb-ultra-light)' : 'transparent',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onMouseLeave={() => setSelectedIndex(-1)}
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.username}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--pb-medium-purple)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '14px'
                    }}>
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '500', fontSize: '0.875rem', color: 'var(--pb-dark-purple)' }}>
                      @{user.username}
                    </div>
                    {user.fullName && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--pb-medium-purple)' }}>
                        {user.fullName}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`} style={{ color: isActive('/') ? 'var(--pb-dark-purple)' : 'var(--pb-medium-purple)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </Link>
          
          <Link to="/flights" className={`nav-link ${isActive('/flights') ? 'active' : ''}`} style={{ color: isActive('/flights') ? 'var(--pb-dark-purple)' : 'var(--pb-medium-purple)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="6" width="18" height="12" rx="2"/>
              <line x1="9" y1="6" x2="9" y2="18"/>
              <line x1="6" y1="10" x2="6" y2="10.01"/>
              <line x1="6" y1="14" x2="6" y2="14.01"/>
              <line x1="13" y1="10" x2="18" y2="10"/>
              <line x1="13" y1="14" x2="18" y2="14"/>
            </svg>
          </Link>
          
          <Link to="/earth" className={`nav-link ${isActive('/earth') ? 'active' : ''}`} style={{ color: isActive('/earth') ? 'var(--pb-dark-purple)' : 'var(--pb-medium-purple)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </Link>
          
          <Link to="/notifications" className={`nav-link ${isActive('/notifications') ? 'active' : ''}`} style={{ position: 'relative', color: isActive('/notifications') ? 'var(--pb-dark-purple)' : 'var(--pb-medium-purple)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {unreadCount > 0 && !isActive('/notifications') && (
              <span style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                width: '8px',
                height: '8px',
                backgroundColor: 'var(--pb-danger, #ef4444)',
                borderRadius: '50%',
                border: '2px solid var(--pb-white)'
              }}></span>
            )}
          </Link>
          
          <Link to="/profile" className={`nav-link ${isActive('/profile') ? 'active' : ''}`} style={{ color: isActive('/profile') ? 'var(--pb-dark-purple)' : 'var(--pb-medium-purple)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </Link>
          
          {/* Hamburger Menu for Sidebar */}
          {onToggleSidebar && (
            <button 
              onClick={onToggleSidebar}
              className="nav-link"
              style={{ color: 'var(--pb-medium-purple)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          )}
        </nav>
      </div>
    </header>
    </>
  );
};