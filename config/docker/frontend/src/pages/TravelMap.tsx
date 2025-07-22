import React from 'react';

export const TravelMap: React.FC = () => {
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🗺️</div>
        <h1 style={{ fontSize: '2rem', fontWeight: '600', marginBottom: '1rem', color: '#333' }}>
          Travel Map
        </h1>
        <p style={{ fontSize: '1.125rem', color: '#666', marginBottom: '2rem' }}>
          Visualize your travel history, explore new destinations, and plan your next adventure.
        </p>
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
            <li style={{ marginBottom: '0.5rem' }}>🗺️ View interactive world map</li>
            <li style={{ marginBottom: '0.5rem' }}>📍 Mark visited countries</li>
            <li style={{ marginBottom: '0.5rem' }}>🎯 Set travel goals</li>
            <li style={{ marginBottom: '0.5rem' }}>📊 Track travel statistics</li>
          </ul>
        </div>
      </div>
    </div>
  );
};