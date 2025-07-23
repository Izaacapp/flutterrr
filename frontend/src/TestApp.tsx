import React from 'react';

// Simple test component to verify React is working
export const TestApp: React.FC = () => {
  return (
    <div style={{ 
      padding: '2rem', 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h1 style={{ color: '#2563eb' }}>🚀 Passport Buddy - System Test</h1>
      
      <div style={{ 
        background: '#f0f9ff', 
        padding: '1rem', 
        borderRadius: '8px',
        marginBottom: '1rem'
      }}>
        <h2>✅ Frontend Status: ONLINE</h2>
        <p>React app is loading successfully!</p>
        <p>Timestamp: {new Date().toISOString()}</p>
      </div>

      <div style={{ 
        background: '#f6f8fa', 
        padding: '1rem', 
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '0.9rem'
      }}>
        <h3>System Information:</h3>
        <ul>
          <li>Environment: {import.meta.env.MODE}</li>
          <li>API URL: {import.meta.env.VITE_API_URL || 'http://localhost:3000'}</li>
          <li>GraphQL URL: {import.meta.env.VITE_GRAPHQL_URL || 'http://localhost:3000/graphql'}</li>
          <li>User Agent: {navigator.userAgent.substring(0, 50)}...</li>
        </ul>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <button 
          onClick={async () => {
            try {
              const response = await fetch('http://localhost:3000/api/auth/verify');
              const data = await response.json();
              alert('Backend Response: ' + JSON.stringify(data, null, 2));
            } catch (error) {
              alert('Backend Error: ' + (error as Error).message);
            }
          }}
          style={{
            background: '#2563eb',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '1rem',
            marginRight: '1rem'
          }}
        >
          Test Backend Connection
        </button>

        <button 
          onClick={() => {
            console.log('Console Test: System is working!');
            alert('Check the browser console for detailed logs');
          }}
          style={{
            background: '#059669',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Test Console Logs
        </button>
      </div>
    </div>
  );
};