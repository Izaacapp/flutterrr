import React, { useState } from 'react';

export const Search: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
        <h1 style={{ fontSize: '2rem', fontWeight: '600', marginBottom: '1rem', color: '#333' }}>
          Search
        </h1>
        <p style={{ fontSize: '1.125rem', color: '#666', marginBottom: '2rem' }}>
          Find friends, destinations, and travel inspiration from the Passport Buddy community.
        </p>
        
        <div style={{ 
          marginBottom: '2rem',
          position: 'relative'
        }}>
          <input
            type="text"
            placeholder="Search friends, destinations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '1rem',
              paddingLeft: '3rem',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              fontSize: '1rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9ca3af'
            }}
          >
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </div>
        
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '2rem', 
          borderRadius: '12px',
          border: '2px dashed #e9ecef'
        }}>
          <h3 style={{ marginBottom: '1rem', color: '#495057' }}>Coming Soon!</h3>
          <p style={{ color: '#6c757d' }}>This feature is under development. You'll be able to:</p>
          <ul style={{ 
            listStyle: 'none', 
            padding: 0, 
            margin: '1rem 0',
            color: '#6c757d'
          }}>
            <li style={{ marginBottom: '0.5rem' }}>👥 Search for friends</li>
            <li style={{ marginBottom: '0.5rem' }}>🏙️ Discover destinations</li>
            <li style={{ marginBottom: '0.5rem' }}>📸 Find travel posts</li>
            <li style={{ marginBottom: '0.5rem' }}>🏷️ Search by hashtags</li>
          </ul>
        </div>
      </div>
    </div>
  );
};