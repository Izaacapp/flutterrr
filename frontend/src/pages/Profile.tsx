import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFileUpload } from '../hooks/useFileUpload';

export const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const { 
    selectedImage, 
    previewUrl, 
    error, 
    imageInputRef, 
    handleImageClick, 
    handleImageChange, 
    removeImage,
    uploadImage 
  } = useFileUpload();

  const handleAvatarUpdate = async () => {
    if (!selectedImage) return;
    
    setIsUploading(true);
    try {
      const uploadResult = await uploadImage(`${import.meta.env.VITE_API_URL}/api/users/avatar`);
      
      if (uploadResult) {
        removeImage();
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to update avatar:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAvatarClick = () => {
    handleImageClick();
  };

  return (
    <div style={{ 
      maxWidth: '900px', 
      margin: '0 auto', 
      padding: '1.5rem',
      backgroundColor: 'var(--pb-background)',
      minHeight: '100vh'
    }}>
      {/* Profile Header */}
      <div style={{ 
        backgroundColor: 'var(--pb-white)',
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: '0 2px 8px rgba(139, 86, 192, 0.1)',
        marginBottom: '1.5rem',
        textAlign: 'center'
      }}>
        <div style={{ position: 'relative', width: 'fit-content', margin: '0 auto 1.5rem' }}>
          <div style={{ 
            width: '100px', 
            height: '100px', 
            borderRadius: '50%', 
            backgroundColor: 'var(--pb-light-periwinkle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem',
            fontWeight: '600',
            color: 'var(--pb-medium-purple)',
            overflow: 'hidden',
            cursor: 'pointer'
          }}
          onClick={handleAvatarClick}
          >
            {previewUrl ? (
              <img 
                src={previewUrl} 
                alt="Preview" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : user?.avatar ? (
              <img 
                src={user.avatar} 
                alt="Profile" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              user?.username?.charAt(0)?.toUpperCase() || 'U'
            )}
          </div>
          {!selectedImage && (
            <button
              onClick={handleAvatarClick}
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                backgroundColor: 'var(--pb-medium-purple)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </button>
          )}
        </div>
        
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          style={{ display: 'none' }}
        />
        
        {error && selectedImage && (
          <div style={{
            color: '#dc3545',
            fontSize: '0.875rem',
            marginBottom: '0.5rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}
        
        {selectedImage && (
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1rem' }}>
            <button
              onClick={handleAvatarUpdate}
              disabled={!selectedImage || isUploading}
              style={{
                padding: '0.5rem 1.5rem',
                backgroundColor: selectedImage && !isUploading ? 'var(--pb-medium-purple)' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '0.875rem',
                cursor: selectedImage && !isUploading ? 'pointer' : 'not-allowed'
              }}
            >
              {isUploading ? 'Uploading...' : 'Update Avatar'}
            </button>
            <button
              onClick={() => {
                removeImage();
              }}
              disabled={isUploading}
              style={{
                padding: '0.5rem 1.5rem',
                backgroundColor: 'var(--pb-light-periwinkle)',
                color: 'var(--pb-dark-purple)',
                border: 'none',
                borderRadius: '4px',
                fontSize: '0.875rem',
                cursor: isUploading ? 'not-allowed' : 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        )}
        
        <h1 style={{ fontSize: '2rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1f2937' }}>
          @{user?.username}
        </h1>
        <p style={{ fontSize: '1.125rem', color: '#6b7280', marginBottom: '0' }}>
          {user?.fullName}
        </p>
      </div>

      {/* Travel Statistics */}
      <div style={{ 
        backgroundColor: 'var(--pb-white)',
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: '0 2px 8px rgba(139, 86, 192, 0.1)',
        marginBottom: '1.5rem'
      }}>
        <h2 style={{ 
          fontSize: '1.5rem', 
          fontWeight: '600', 
          marginBottom: '1.5rem', 
          color: 'var(--pb-dark-purple)',
          textAlign: 'center'
        }}>
          Travel Statistics
        </h2>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1.5rem'
        }}>
          <div style={{ 
            padding: '1.25rem', 
            backgroundColor: 'var(--pb-ultra-light)', 
            borderRadius: '8px',
            border: '1px solid var(--pb-light-periwinkle)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--pb-dark-purple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 5 21 5s-1 0-2.5 1.5L15 10l-8.2-1.8c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-5 2c-.6.3-.6 1.2 0 1.5L8 17l4-2 1.2 3.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1"/>
              </svg>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>12</div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Total Flights</div>
          </div>
          
          <div style={{ 
            padding: '1.25rem', 
            backgroundColor: 'var(--pb-ultra-light)', 
            borderRadius: '8px',
            border: '1px solid var(--pb-light-periwinkle)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--pb-dark-purple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12h20"/>
                <path d="M6 8v8"/>
                <path d="M10 8v8"/>
                <path d="M14 8v8"/>
                <path d="M18 8v8"/>
              </svg>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
              {user?.milesFlown?.toLocaleString() || '0'}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Miles Flown</div>
          </div>
          
          <div style={{ 
            padding: '1.25rem', 
            backgroundColor: 'var(--pb-ultra-light)', 
            borderRadius: '8px',
            border: '1px solid var(--pb-light-periwinkle)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--pb-dark-purple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
                <path d="M2 12h20"/>
              </svg>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
              {user?.countriesVisited?.length || 0}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Countries Visited</div>
          </div>
          
          <div style={{ 
            padding: '1.25rem', 
            backgroundColor: 'var(--pb-ultra-light)', 
            borderRadius: '8px',
            border: '1px solid var(--pb-light-periwinkle)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--pb-dark-purple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12,6 12,12 16,14"/>
              </svg>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>48</div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Flight Hours</div>
          </div>
        </div>
      </div>

      {/* Travel Goals */}
      <div style={{ 
        backgroundColor: 'var(--pb-white)',
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: '0 2px 8px rgba(139, 86, 192, 0.1)',
        marginBottom: '1.5rem'
      }}>
        <h2 style={{ 
          fontSize: '1.5rem', 
          fontWeight: '600', 
          marginBottom: '1.5rem', 
          color: 'var(--pb-dark-purple)',
          textAlign: 'center'
        }}>
          2024 Travel Goals
        </h2>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem'
        }}>
          <div style={{ 
            padding: '1.25rem', 
            backgroundColor: 'var(--pb-ultra-light)', 
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--pb-dark-purple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="6"/>
                <circle cx="12" cy="12" r="2"/>
              </svg>
            </div>
            <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
              Visit 5 New Countries
            </div>
            <div style={{ fontSize: '0.875rem', color: '#059669' }}>3/5 Complete</div>
          </div>
          
          <div style={{ 
            padding: '1.25rem', 
            backgroundColor: 'var(--pb-ultra-light)', 
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--pb-dark-purple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 22h20"/>
                <path d="M6.36 17.78L4 21l10-3 10 3-2.36-3.22"/>
                <path d="M18 6L8.5 15.5"/>
                <path d="M9 6L20 17"/>
                <path d="M15 2L9 8"/>
                <path d="M20 6L14 12"/>
              </svg>
            </div>
            <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
              50,000 Miles
            </div>
            <div style={{ fontSize: '0.875rem', color: '#059669' }}>
              {((user?.milesFlown || 0) / 50000 * 100).toFixed(0)}% Complete
            </div>
          </div>
          
          <div style={{ 
            padding: '1.25rem', 
            backgroundColor: 'var(--pb-ultra-light)', 
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--pb-dark-purple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 3h12l4 6-10 13L2 9l4-6z"/>
                <path d="M11 3L8 9l4 13 4-13-3-6"/>
                <path d="M2 9h20"/>
              </svg>
            </div>
            <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
              Elite Status
            </div>
            <div style={{ fontSize: '0.875rem', color: '#d97706' }}>In Progress</div>
          </div>
        </div>
      </div>

      {/* Profile Information */}
      <div style={{ 
        backgroundColor: 'var(--pb-white)',
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: '0 2px 8px rgba(139, 86, 192, 0.1)',
        marginBottom: '1.5rem'
      }}>
        <h2 style={{ 
          fontSize: '1.5rem', 
          fontWeight: '600', 
          marginBottom: '1.5rem', 
          color: '#1f2937'
        }}>
          Profile Information
        </h2>
        
        <div style={{ 
          display: 'grid', 
          gap: '1rem'
        }}>
          <div style={{ 
            padding: '1rem', 
            backgroundColor: 'var(--pb-ultra-light)', 
            borderRadius: '8px',
            border: '1px solid var(--pb-light-periwinkle)',
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <strong>Email:</strong> 
            <span>{user?.email}</span>
          </div>
          
          <div style={{ 
            padding: '1rem', 
            backgroundColor: 'var(--pb-ultra-light)', 
            borderRadius: '8px',
            border: '1px solid var(--pb-light-periwinkle)',
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <strong>Member since:</strong> 
            <span>January 2024</span>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={logout}
          style={{
            padding: '0.75rem 2rem',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#c82333';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#dc3545';
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
};