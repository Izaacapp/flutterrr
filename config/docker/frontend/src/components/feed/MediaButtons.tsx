import React from 'react';
import { ImageIcon, Video, MapPin, X } from 'lucide-react';

interface LocationResult {
  name: string;
  address: string;
  lat: number;
  lng: number;
  placeId: string;
}

interface MediaButtonsProps {
  onImageClick: () => void;
  onVideoClick: () => void;
  onLocationClick: (e: React.MouseEvent) => void;
  isLocationSearchOpen: boolean;
  selectedLocation: LocationResult | null;
  onLocationSelect: (location: LocationResult) => void;
  onLocationSearchClose: () => void;
  onRemoveLocation: () => void;
  isLoading?: boolean;
}

const MediaButtons: React.FC<MediaButtonsProps> = ({
  onImageClick,
  onVideoClick,
  onLocationClick,
  isLocationSearchOpen,
  selectedLocation,
  onRemoveLocation,
  isLoading = false,
}) => {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '0.75rem', 
      marginTop: '1rem'
    }}>
      <button
        onClick={onImageClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '2.25rem',
          height: '2.25rem',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          backgroundColor: 'transparent',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.5 : 1,
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          if (!isLoading) {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f9fafb';
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
        }}
        title="Add Image"
        disabled={isLoading}
        type="button"
      >
        <ImageIcon style={{ width: '18px', height: '18px', color: '#6b7280' }} />
      </button>

      <button
        onClick={onVideoClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '2.25rem',
          height: '2.25rem',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          backgroundColor: 'transparent',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.5 : 1,
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          if (!isLoading) {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f9fafb';
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
        }}
        title="Add Video"
        disabled={isLoading}
        type="button"
      >
        <Video style={{ width: '18px', height: '18px', color: '#6b7280' }} />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
        <button
          onClick={onLocationClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '2.25rem',
            height: '2.25rem',
            border: isLocationSearchOpen ? '1px solid #3b82f6' : '1px solid #e5e7eb',
            borderRadius: '8px',
            backgroundColor: isLocationSearchOpen ? '#eff6ff' : 'transparent',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.5 : 1,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!isLoading && !isLocationSearchOpen) {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f9fafb';
            }
          }}
          onMouseLeave={(e) => {
            if (!isLocationSearchOpen) {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
            }
          }}
          title="Add Location"
          type="button"
          disabled={isLoading}
        >
          <MapPin style={{ 
            width: '18px', 
            height: '18px', 
            color: isLocationSearchOpen ? '#3b82f6' : '#6b7280' 
          }} />
        </button>

        {/* Show selected location inline next to pin */}
        {selectedLocation && (
          <div style={{ 
            marginLeft: '0.5rem', 
            display: 'flex', 
            alignItems: 'center',
            fontSize: '0.875rem',
            color: '#4b5563'
          }}>
            <span style={{ fontWeight: '500' }}>
              {selectedLocation.name}
            </span>
            <button
              onClick={onRemoveLocation}
              style={{
                marginLeft: '0.25rem',
                padding: '0.125rem',
                color: '#9ca3af',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = '#4b5563';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = '#9ca3af';
              }}
              disabled={isLoading}
              title="Remove location"
              type="button"
            >
              <X style={{ width: '14px', height: '14px' }} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaButtons;