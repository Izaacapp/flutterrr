import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export const Statistics: React.FC = () => {
  const { user } = useAuth();

  const stats = [
    {
      icon: '✈️',
      label: 'Total Flights',
      value: '12',
      description: 'Flights taken this year'
    },
    {
      icon: '📏',
      label: 'Miles Flown',
      value: user?.milesFlown?.toLocaleString() || '0',
      description: 'Total distance traveled'
    },
    {
      icon: '🌍',
      label: 'Countries Visited',
      value: user?.countriesVisited?.length || '0',
      description: 'Unique destinations'
    },
    {
      icon: '⏱️',
      label: 'Flight Hours',
      value: '48',
      description: 'Time spent in the air'
    },
    {
      icon: '🏆',
      label: 'Travel Level',
      value: 'Explorer',
      description: 'Based on your activity'
    },
    {
      icon: '💰',
      label: 'Money Saved',
      value: '$1,250',
      description: 'Through smart booking'
    }
  ];

  return (
    <div style={{
      maxWidth: '1200px',
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
        marginBottom: '2rem'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <div style={{
            fontSize: '4rem',
            marginBottom: '1rem'
          }}>
            📊
          </div>
          
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: '#1f2937',
            marginBottom: '0.5rem'
          }}>
            Travel Statistics
          </h1>
          
          <p style={{
            fontSize: '1.1rem',
            color: '#6b7280',
            marginBottom: '0'
          }}>
            Track your journey and see how far you've come
          </p>
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {stats.map((stat, index) => (
            <div key={index} style={{
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '1.5rem',
              textAlign: 'center',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}>
              <div style={{
                fontSize: '2rem',
                marginBottom: '0.5rem'
              }}>
                {stat.icon}
              </div>
              
              <div style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: '#1f2937',
                marginBottom: '0.25rem'
              }}>
                {stat.value}
              </div>
              
              <div style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.25rem'
              }}>
                {stat.label}
              </div>
              
              <div style={{
                fontSize: '0.875rem',
                color: '#6b7280'
              }}>
                {stat.description}
              </div>
            </div>
          ))}
        </div>
        
        <div style={{
          backgroundColor: '#f3f4f6',
          borderRadius: '8px',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '1rem'
          }}>
            2024 Travel Goals
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '6px',
              padding: '1rem',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🎯</div>
              <div style={{ fontWeight: '600', color: '#1f2937' }}>Visit 5 New Countries</div>
              <div style={{ fontSize: '0.875rem', color: '#059669', marginTop: '0.25rem' }}>
                3/5 Complete
              </div>
            </div>
            
            <div style={{
              backgroundColor: 'white',
              borderRadius: '6px',
              padding: '1rem',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🛫</div>
              <div style={{ fontWeight: '600', color: '#1f2937' }}>50,000 Miles</div>
              <div style={{ fontSize: '0.875rem', color: '#059669', marginTop: '0.25rem' }}>
                {((user?.milesFlown || 0) / 50000 * 100).toFixed(0)}% Complete
              </div>
            </div>
            
            <div style={{
              backgroundColor: 'white',
              borderRadius: '6px',
              padding: '1rem',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💎</div>
              <div style={{ fontWeight: '600', color: '#1f2937' }}>Elite Status</div>
              <div style={{ fontSize: '0.875rem', color: '#d97706', marginTop: '0.25rem' }}>
                In Progress
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};