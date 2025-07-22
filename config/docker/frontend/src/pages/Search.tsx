import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { pexelsService, PexelsPhoto } from '../services/pexels.service';

export const Search: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchParams] = useSearchParams();
  const [photos, setPhotos] = useState<PexelsPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<PexelsPhoto | null>(null);
  
  const location = searchParams.get('location');

  useEffect(() => {
    if (location) {
      loadLocationPhotos(location);
    }
  }, [location]);

  const loadLocationPhotos = async (locationQuery: string) => {
    setLoading(true);
    try {
      const result = await pexelsService.searchWithCache(locationQuery, 30);
      setPhotos(result.photos);
    } catch (error) {
      console.error('Error loading photos:', error);
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  const openPhotoModal = (photo: PexelsPhoto) => {
    setSelectedPhoto(photo);
  };

  const closePhotoModal = () => {
    setSelectedPhoto(null);
  };

  // If location search, show photo results
  if (location) {
    return (
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem',
        backgroundColor: 'var(--pb-background)',
        minHeight: '100vh'
      }}>
        {/* Header */}
        <div style={{
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            color: 'var(--pb-dark-purple)',
            marginBottom: '0.5rem'
          }}>
            {location}
          </h1>
          <p style={{
            fontSize: '1.125rem',
            color: 'var(--pb-medium-purple)',
            margin: 0
          }}>
            Discover amazing places and get inspired for your next adventure
          </p>
        </div>

        {loading && (
          <div style={{
            textAlign: 'center',
            padding: '3rem'
          }}>
            <div style={{
              display: 'inline-block',
              width: '40px',
              height: '40px',
              border: '3px solid var(--pb-light-periwinkle)',
              borderTop: '3px solid var(--pb-medium-purple)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <p style={{ marginTop: '1rem', color: 'var(--pb-medium-purple)' }}>
              Loading amazing photos...
            </p>
          </div>
        )}

        {/* Photo Grid */}
        {!loading && photos.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            {photos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => openPhotoModal(photo)}
                style={{
                  position: 'relative',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  aspectRatio: '4/3'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                }}
              >
                <img
                  src={photo.src.medium}
                  alt={photo.alt}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                  color: 'white',
                  padding: '1rem'
                }}>
                  <p style={{
                    margin: 0,
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    marginBottom: '0.25rem'
                  }}>
                    {photo.alt || 'Beautiful destination'}
                  </p>
                  <p style={{
                    margin: 0,
                    fontSize: '0.75rem',
                    opacity: 0.9
                  }}>
                    Photo by {photo.photographer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Photo Modal */}
        {selectedPhoto && (
          <div
            onClick={closePhotoModal}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '2rem'
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'relative',
                maxWidth: '90vw',
                maxHeight: '90vh',
                backgroundColor: 'white',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
              }}
            >
              <button
                onClick={closePhotoModal}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  zIndex: 1001,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem'
                }}
              >
                ×
              </button>
              <img
                src={selectedPhoto.src.large}
                alt={selectedPhoto.alt}
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: '70vh',
                  objectFit: 'contain'
                }}
              />
              <div style={{
                padding: '1.5rem',
                backgroundColor: 'white'
              }}>
                <h3 style={{
                  margin: '0 0 0.5rem',
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: 'var(--pb-dark-purple)'
                }}>
                  {selectedPhoto.alt || 'Beautiful destination'}
                </h3>
                <p style={{
                  margin: '0 0 1rem',
                  color: 'var(--pb-medium-purple)',
                  fontSize: '0.875rem'
                }}>
                  Photo by{' '}
                  <a
                    href={selectedPhoto.photographer_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: 'var(--pb-medium-purple)',
                      textDecoration: 'underline'
                    }}
                  >
                    {selectedPhoto.photographer}
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pexels Attribution */}
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          backgroundColor: 'var(--pb-white)',
          borderRadius: '12px',
          marginTop: '2rem'
        }}>
          <p style={{
            margin: 0,
            fontSize: '0.875rem',
            color: 'var(--pb-medium-purple)'
          }}>
            Beautiful photos provided by{' '}
            <a
              href="https://www.pexels.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--pb-medium-purple)',
                textDecoration: 'underline',
                fontWeight: '500'
              }}
            >
              Pexels
            </a>
          </p>
        </div>
      </div>
    );
  }

  // Default search page when no location
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