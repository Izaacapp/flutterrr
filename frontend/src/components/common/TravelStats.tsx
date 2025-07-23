import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FlightStats } from '../../services/flight.service';

interface TravelStatsProps {
  stats: FlightStats | null;
  loading?: boolean;
  compact?: boolean;
  showGoals?: boolean;
}

export const TravelStats: React.FC<TravelStatsProps> = ({ stats, loading, compact = false, showGoals = false }) => {
  const navigate = useNavigate();
  if (loading) {
    return (
      <div style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: '24px',
            height: '24px',
            border: '2px solid var(--pb-light-periwinkle)',
            borderTop: '2px solid var(--pb-medium-purple)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--pb-medium-purple)' }}>
        No travel data yet. Upload your first boarding pass!
      </div>
    );
  }

  // Calculate derived stats
  const flightHours = Math.round((stats.totalFlightTime || 0) / 60);
  const avgMilesPerFlight = stats.totalFlights > 0 ? Math.round((stats.totalDistance || 0) / stats.totalFlights) : 0;
  
  // Determine travel level based on miles
  const getTravelLevel = (miles: number) => {
    if (miles >= 100000) return { level: 'Elite Explorer', color: '#FFD700' };
    if (miles >= 50000) return { level: 'World Traveler', color: '#C0C0C0' };
    if (miles >= 25000) return { level: 'Frequent Flyer', color: '#CD7F32' };
    if (miles >= 10000) return { level: 'Explorer', color: '#8b5cf6' };
    return { level: 'Wanderer', color: '#6b7280' };
  };

  const travelLevel = getTravelLevel(stats.totalDistance || 0);

  if (compact) {
    // Compact view for sidebar
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--pb-medium-purple)', fontSize: '0.875rem' }}>Countries</span>
          <span style={{ fontWeight: '600', color: 'var(--pb-dark-purple)', fontSize: '0.875rem' }}>{stats.uniqueCountries || 0}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--pb-medium-purple)', fontSize: '0.875rem' }}>Flights</span>
          <span style={{ fontWeight: '600', color: 'var(--pb-dark-purple)', fontSize: '0.875rem' }}>{stats.totalFlights || 0}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--pb-medium-purple)', fontSize: '0.875rem' }}>Miles</span>
          <span style={{ fontWeight: '600', color: 'var(--pb-dark-purple)', fontSize: '0.875rem' }}>
            {(stats.totalDistance || 0) >= 1000 ? `${((stats.totalDistance || 0) / 1000).toFixed(1)}k` : (stats.totalDistance || 0)}
          </span>
        </div>
        
        <div style={{ 
          textAlign: 'center', 
          marginTop: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--pb-light-purple)'
        }}>
          <button
            onClick={() => navigate('/statistics')}
            style={{
              background: 'transparent',
              color: 'var(--pb-medium-purple)',
              border: '2px solid var(--pb-medium-purple)',
              borderRadius: '20px',
              padding: '0.5rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.backgroundColor = 'var(--pb-medium-purple)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--pb-medium-purple)';
            }}
          >
            View All Stats
          </button>
        </div>
      </div>
    );
  }

  // Full view for pages
  return (
    <div>
      {/* Travel Level Badge */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '2rem',
        padding: '1rem',
        backgroundColor: 'var(--pb-ultra-light)',
        borderRadius: '12px'
      }}>
        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Travel Status</div>
        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: travelLevel.color }}>
          {travelLevel.level}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{ 
          backgroundColor: 'var(--pb-ultra-light)', 
          padding: '1.5rem', 
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--pb-dark-purple)' }}>
            {stats.totalFlights || 0}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>Total Flights</div>
        </div>
        
        <div style={{ 
          backgroundColor: 'var(--pb-ultra-light)', 
          padding: '1.5rem', 
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--pb-dark-purple)' }}>
            {(stats.totalDistance || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>Miles Flown</div>
        </div>
        
        <div style={{ 
          backgroundColor: 'var(--pb-ultra-light)', 
          padding: '1.5rem', 
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--pb-dark-purple)' }}>
            {stats.uniqueCountries || 0}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>Countries</div>
        </div>
        
        <div style={{ 
          backgroundColor: 'var(--pb-ultra-light)', 
          padding: '1.5rem', 
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--pb-dark-purple)' }}>
            {flightHours}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>Flight Hours</div>
        </div>
      </div>

      {/* Additional Stats */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid var(--pb-light-periwinkle)',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: showGoals ? '2rem' : 0
      }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Travel Insights</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Unique Airports</span>
            <span style={{ fontWeight: '500', fontSize: '0.875rem' }}>{stats.uniqueAirports || 0}</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Airlines Flown</span>
            <span style={{ fontWeight: '500', fontSize: '0.875rem' }}>{stats.uniqueAirlines || 0}</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Avg Miles/Flight</span>
            <span style={{ fontWeight: '500', fontSize: '0.875rem' }}>{avgMilesPerFlight.toLocaleString()}</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Carbon Offset</span>
            <span style={{ fontWeight: '500', fontSize: '0.875rem' }}>{(stats.carbonEmissions || 0).toFixed(1)} tons</span>
          </div>
        </div>

        {stats.favoriteAirline && (
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
            <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>Favorite Airline</div>
            <div style={{ fontWeight: '600', marginTop: '0.25rem' }}>
              {stats.favoriteAirline.name} ({stats.favoriteAirline.flights} flights)
            </div>
          </div>
        )}

        {stats.mostVisitedAirport && (
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
            <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>Most Visited Airport</div>
            <div style={{ fontWeight: '600', marginTop: '0.25rem' }}>
              {stats.mostVisitedAirport.code} - {stats.mostVisitedAirport.city}
              <span style={{ color: '#6b7280', fontSize: '0.75rem', marginLeft: '0.5rem' }}>
                ({stats.mostVisitedAirport.visits} visits)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Travel Goals - Only show if requested */}
      {showGoals && (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid var(--pb-light-periwinkle)',
          borderRadius: '12px',
          padding: '1.5rem'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
            {new Date().getFullYear()} Travel Goals
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <TravelGoal 
              goal="Visit 10 new countries" 
              current={stats.uniqueCountries} 
              target={10} 
            />
            <TravelGoal 
              goal="Fly 50,000 miles" 
              current={stats.totalDistance} 
              target={50000} 
            />
            <TravelGoal 
              goal="Take 20 flights" 
              current={stats.totalFlights} 
              target={20} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

const TravelGoal: React.FC<{ goal: string; current: number; target: number }> = ({ goal, current, target }) => {
  const progress = Math.min((current / target) * 100, 100);
  const isComplete = current >= target;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.875rem', color: isComplete ? '#10b981' : '#374151' }}>{goal}</span>
        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
          {current.toLocaleString()}/{target.toLocaleString()}
        </span>
      </div>
      <div style={{ 
        height: '8px', 
        backgroundColor: '#e5e7eb', 
        borderRadius: '4px', 
        overflow: 'hidden' 
      }}>
        <div 
          style={{ 
            height: '100%', 
            backgroundColor: isComplete ? '#10b981' : 'var(--pb-medium-purple)', 
            width: `${progress}%`,
            transition: 'width 0.3s ease'
          }} 
        />
      </div>
    </div>
  );
};