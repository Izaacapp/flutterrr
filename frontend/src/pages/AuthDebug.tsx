import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { flightService } from '../services/flight.service';

export const AuthDebug: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [statsResult, setStatsResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const testFlightStats = async () => {
    try {
      setError(null);
      const stats = await flightService.getFlightStats();
      setStatsResult(stats);
    } catch (err: any) {
      setError(err.message);
      console.error('Stats error:', err);
    }
  };
  
  const checkLocalStorage = () => {
    const token = localStorage.getItem('passport_buddy_token');
    console.log('Token in localStorage:', token);
    return token;
  };
  
  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Auth Debug Page</h1>
      
      <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
        <h2>Auth Status</h2>
        <p>Is Authenticated: {isAuthenticated ? 'YES' : 'NO'}</p>
        <p>User: {user ? `${user.username} (${user.email})` : 'Not logged in'}</p>
        <p>Token in localStorage: {checkLocalStorage() ? 'Present' : 'Missing'}</p>
      </div>
      
      <div style={{ marginBottom: '2rem' }}>
        <button 
          onClick={testFlightStats}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'var(--pb-dark-purple)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Flight Stats API
        </button>
      </div>
      
      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#ffcccc', borderRadius: '8px', marginBottom: '1rem' }}>
          <h3>Error:</h3>
          <p>{error}</p>
        </div>
      )}
      
      {statsResult && (
        <div style={{ padding: '1rem', backgroundColor: '#ccffcc', borderRadius: '8px' }}>
          <h3>Stats Result:</h3>
          <pre>{JSON.stringify(statsResult, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};