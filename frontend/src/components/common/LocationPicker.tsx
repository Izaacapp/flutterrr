import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Google Maps types
declare global {
  interface Window {
    google: any;
  }
}

export interface LocationData {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}

interface LocationPickerProps {
  onLocationSelect: (location: LocationData | null) => void;
  initialLocation?: LocationData;
  isOpen: boolean;
  onClose: () => void;
}

const LocationMarker: React.FC<{
  position: [number, number] | null;
  onPositionChange: (position: [number, number]) => void;
}> = ({ position, onPositionChange }) => {
  const map = useMapEvents({
    click(e) {
      console.log('🗺️ Map clicked at:', e.latlng.lat, e.latlng.lng);
      onPositionChange([e.latlng.lat, e.latlng.lng]);
    },
    locationfound(e) {
      console.log('📍 Location found:', e.latlng.lat, e.latlng.lng);
      onPositionChange([e.latlng.lat, e.latlng.lng]);
      map.flyTo(e.latlng, map.getZoom());
    },
    locationerror(e) {
      console.log('❌ Location error:', e.message);
      // Don't set a default location - let user search instead
    }
  });

  useEffect(() => {
    try {
      // Use browser's geolocation API
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            onPositionChange([latitude, longitude]);
            map.setView([latitude, longitude], 13);
            console.log('📍 Browser geolocation:', latitude, longitude);
          },
          (error) => {
            console.log('❌ Geolocation error:', error.message);
            // Just log the error, don't set a default location
          }
        );
      }
    } catch (error) {
      console.error('❌ Map locate error:', error);
    }
  }, [map]);

  return position === null ? null : (
    <Marker position={position} />
  );
};

export const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  initialLocation,
  isOpen,
  onClose,
}) => {
  const [position, setPosition] = useState<[number, number] | null>(
    initialLocation ? [initialLocation.latitude, initialLocation.longitude] : null
  );
  const [locationName, setLocationName] = useState(initialLocation?.name || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(initialLocation?.address || '');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [googleLoaded, setGoogleLoaded] = useState(false);

  // Check if Google Maps is loaded
  useEffect(() => {
    const checkGoogleMaps = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        setGoogleLoaded(true);
        console.log('✅ Google Maps loaded');
      } else {
        // Try to load Google Maps
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          setGoogleLoaded(true);
          console.log('✅ Google Maps loaded');
        };
        document.head.appendChild(script);
      }
    };
    
    if (isOpen) {
      checkGoogleMaps();
    }
  }, [isOpen]);

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (!googleLoaded || !searchInputRef.current || !isOpen) return;

    const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current, {
      fields: ['geometry', 'name', 'formatted_address', 'place_id'],
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        
        setPosition([lat, lng]);
        setLocationName(place.name || place.formatted_address || '');
        setSelectedAddress(place.formatted_address || '');
        console.log('📍 Google Place selected:', place);
      }
    });

    autocompleteRef.current = autocomplete;
  }, [googleLoaded, isOpen]);

  // 🔧 SEARCH_FUNCTIONALITY: Forward geocoding (search) - Fallback for OpenStreetMap
  const searchLocations = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      console.log('🔍 LOCATION_SEARCH: Searching for:', query);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
      );
      const results = await response.json();
      console.log('🔍 LOCATION_SEARCH: Found', results.length, 'results');
      setSearchResults(results);
    } catch (error) {
      console.error('❌ LOCATION_SEARCH: Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // 🔧 REVERSE_GEOCODING: Get address from coordinates
  const reverseGeocode = async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      console.log('📍 REVERSE_GEOCODE: Getting address for:', lat, lng);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`
      );
      const data = await response.json();
      
      if (data.display_name) {
        setLocationName(data.display_name);
        setSelectedAddress(data.display_name);
        console.log('📍 REVERSE_GEOCODE: Found address:', data.display_name);
      }
    } catch (error) {
      console.error('❌ REVERSE_GEOCODE: Failed:', error);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handlePositionChange = (newPosition: [number, number]) => {
    setPosition(newPosition);
    reverseGeocode(newPosition[0], newPosition[1]);
  };

  // 🔧 DEBOUNCED_SEARCH: Prevent excessive API calls
  // 🔧 DEBOUNCED_SEARCH: Only use this if Google Places is not available
  React.useEffect(() => {
    if (!googleLoaded) {
      const timeoutId = setTimeout(() => {
        if (searchQuery.trim()) {
          searchLocations(searchQuery);
        } else {
          setSearchResults([]);
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, googleLoaded]);

  const handleSearchResultSelect = (result: any) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setPosition([lat, lng]);
    setLocationName(result.display_name);
    setSelectedAddress(result.display_name);
    setSearchQuery('');
    setSearchResults([]);
    console.log('📍 SEARCH_SELECT: Selected location:', result.display_name);
  };

  const handleConfirm = () => {
    if (position) {
      onLocationSelect({
        latitude: position[0],
        longitude: position[1],
        name: locationName,
        address: selectedAddress,
      });
    }
    onClose();
  };

  const handleRemove = () => {
    onLocationSelect(null);
    onClose();
  };

  // Add styles for animations only once
  React.useEffect(() => {
    if (!isOpen) return;
    
    const styleId = 'location-picker-animations';
    if (!document.getElementById(styleId)) {
      const styleSheet = document.createElement('style');
      styleSheet.id = styleId;
      styleSheet.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `;
      document.head.appendChild(styleSheet);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      onClick={(e) => {
        // Only close if clicking the backdrop, not the modal content
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease-out'
      }}>
      <div 
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking modal content
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUp 0.3s ease-out',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
            Add Location
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6L18 18"/>
            </svg>
          </button>
        </div>

        {/* 🔧 SEARCH_BAR: Allow users to search for locations */}
        <div style={{ 
          padding: '20px',
          borderBottom: '1px solid #e5e7eb' 
        }}>
          <div style={{ position: 'relative' }}>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search for a place (e.g., Chicago, Mexico City)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 40px 12px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--pb-medium-purple)'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
            {isSearching && (
              <div style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '16px',
                height: '16px',
                border: '2px solid #d1d5db',
                borderTop: '2px solid var(--pb-medium-purple)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
            )}
          </div>

          {/* 🔧 SEARCH_RESULTS: Show search results dropdown */}
          {searchResults.length > 0 && !googleLoaded && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: '20px',
              right: '20px',
              marginTop: '4px',
              backgroundColor: 'white',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              zIndex: 1001,
              maxHeight: '200px',
              overflowY: 'auto',
              animation: 'fadeIn 0.2s ease-out'
            }}>
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  onClick={() => handleSearchResultSelect(result)}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    borderBottom: index < searchResults.length - 1 ? '1px solid #f3f4f6' : 'none',
                    fontSize: '14px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  📍 {result.display_name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Map Container */}
        <div style={{ flex: 1, minHeight: '300px', position: 'relative' }}>
          {/* Debug info */}
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            zIndex: 1000,
            backgroundColor: 'rgba(255,255,255,0.9)',
            padding: '5px',
            borderRadius: '4px',
            fontSize: '12px'
          }}>
            Click anywhere on the map to select location
            {position && (
              <div>Current: {position[0].toFixed(4)}, {position[1].toFixed(4)}</div>
            )}
          </div>
          
          <MapContainer
            center={position || [0, 0]} // Start at 0,0 and let geolocation or search set the position
            zoom={position ? 13 : 2} // Zoom out if no position is set
            style={{ height: '100%', width: '100%' }}
            whenReady={() => console.log('🗺️ Map is ready')}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              onLoad={() => console.log('🗺️ Tiles loaded')}
              onError={(error) => console.error('❌ Tile loading error:', error)}
            />
            <LocationMarker
              position={position}
              onPositionChange={handlePositionChange}
            />
          </MapContainer>
          
          {/* Loading overlay */}
          {isGeocoding && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '30px',
                  height: '30px',
                  border: '3px solid var(--pb-light-periwinkle)',
                  borderTop: '3px solid var(--pb-medium-purple)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 10px'
                }}></div>
                <p>Getting location info...</p>
              </div>
            </div>
          )}
        </div>

        {/* 🔧 SELECTED_LOCATION_INFO: Show selected address and coordinates */}
        {position && (
          <div style={{
            padding: '20px',
            borderTop: '1px solid #e5e7eb'
          }}>
            {selectedAddress && (
              <div style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '15px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#16a34a',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}>
                  <span>📍</span>
                  <span>Selected Location:</span>
                </div>
                <p style={{
                  margin: '4px 0 0 24px',
                  fontSize: '0.875rem',
                  color: '#15803d'
                }}>
                  {selectedAddress}
                </p>
              </div>
            )}
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                marginBottom: '5px',
                color: '#374151'
              }}>
                Custom Location Name (Optional)
              </label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Enter custom name or leave blank to use address..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--pb-medium-purple)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                }}
              />
            </div>
            
            <div style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              backgroundColor: '#f9fafb',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #f3f4f6'
            }}>
              <strong>Coordinates:</strong> {position[0].toFixed(6)}, {position[1].toFixed(6)}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{
          padding: '20px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          gap: '10px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={handleRemove}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f3f4f6',
              color: '#6b7280',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            Remove Location
          </button>
          <button
            onClick={handleConfirm}
            disabled={!position}
            style={{
              padding: '10px 20px',
              backgroundColor: position ? 'var(--pb-medium-purple)' : '#d1d5db',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: position ? 'pointer' : 'not-allowed',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  );
};