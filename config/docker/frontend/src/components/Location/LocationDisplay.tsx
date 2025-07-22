import React from 'react';

interface LocationResult {
  name: string;
  address: string;
  lat: number;
  lng: number;
  placeId: string;
}

interface LocationDisplayProps {
  selectedCity: LocationResult | null;
  onRemoveLocation: () => void;
  isLoading?: boolean;
}

const LocationDisplay: React.FC<LocationDisplayProps> = ({
  selectedCity,
  onRemoveLocation,
  isLoading = false,
}) => {
  if (!selectedCity) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.75rem',
      marginTop: '0.75rem',
      backgroundColor: '#f9fafb',
      borderRadius: '0.5rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          style={{ height: '1rem', width: '1rem', color: '#6b7280' }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <span style={{ fontSize: '0.875rem', color: '#374151' }}>{selectedCity.name}</span>
      </div>
      {!isLoading && (
        <button
          onClick={onRemoveLocation}
          style={{
            color: '#9ca3af',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            transition: 'color 0.15s ease-in-out'
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.color = '#4b5563';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.color = '#9ca3af';
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            style={{ height: '1rem', width: '1rem' }}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export default LocationDisplay;