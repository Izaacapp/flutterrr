import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFlightStats } from '../hooks/useFlightStats';
import { TravelStats } from '../components/common/TravelStats';

export const Statistics: React.FC = () => {
  const { user } = useAuth();
  const { stats, loading } = useFlightStats();

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2rem',
      backgroundColor: 'var(--pb-background)',
      minHeight: '100vh'
    }}>
      <div style={{
        textAlign: 'center',
        marginBottom: '2rem'
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: '700',
          color: 'var(--pb-dark-purple)',
          marginBottom: '0.5rem'
        }}>
          Travel Statistics
        </h1>
        
        <p style={{
          fontSize: '1.1rem',
          color: 'var(--pb-medium-purple)',
          marginBottom: '0'
        }}>
          Track your journey and see how far you've come
        </p>
      </div>

      <TravelStats stats={stats} loading={loading} showGoals={true} />
    </div>
  );
};