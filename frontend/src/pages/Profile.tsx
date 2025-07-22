import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFileUpload } from '../hooks/useFileUpload';
import { useToast } from '../contexts/ToastContext';
import { userService } from '../services/user.service';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { UserPostsFeed } from '../components/profile/UserPostsFeed';
import { EditProfile } from '../components/profile/EditProfile';

export const Profile: React.FC = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, logout, updateUser } = useAuth();
  const { showToast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [profileUser, setProfileUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isBlockLoading, setIsBlockLoading] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const optionsMenuRef = useRef<HTMLDivElement>(null);
  
  const isOwnProfile = !username || username === currentUser?.username;
  const user = isOwnProfile ? (currentUser || profileUser) : profileUser; // Prefer currentUser for own profile
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

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!isOwnProfile && username) {
        setLoading(true);
        try {
          const response = await userService.getProfileByUsername(username);
          
          if (response.status === 'success') {
            setProfileUser(response.data.user);
            setIsFollowing(response.data.user.isFollowing || false);
            setIsBlocked(response.data.user.isBlocked || false);
            setFollowersCount(response.data.user.followersCount || 0);
            setFollowingCount(response.data.user.followingCount || 0);
          } else {
            showToast('User not found', 'error');
            navigate('/');
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          showToast('Failed to load profile', 'error');
          navigate('/');
        } finally {
          setLoading(false);
        }
      } else if (isOwnProfile) {
        // For own profile, fetch fresh data to ensure sync
        const fetchOwnProfile = async () => {
          try {
            const response = await userService.getProfile();
            if (response.status === 'success') {
              setProfileUser(response.data.user);
            }
          } catch (error) {
            console.error('Error fetching own profile:', error);
          }
        };
        fetchOwnProfile();
      }
    };

    fetchUserProfile();
  }, [username, isOwnProfile, navigate, showToast, currentUser]); // Added currentUser as dependency

  // Close options menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target as Node)) {
        setShowOptionsMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleAvatarUpdate = async () => {
    if (!selectedImage) return;
    
    setIsUploading(true);
    try {
      const token = localStorage.getItem('passport_buddy_token');
      const formData = new FormData();
      formData.append('avatar', selectedImage);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Avatar upload response:', data);
        
        // Update user in context with new avatar URL
        if (data.data?.user?.avatar) {
          updateUser({ avatar: data.data.user.avatar });
          showToast('Avatar updated successfully!', 'success');
        }
        
        removeImage();
      } else {
        const errorData = await response.json();
        console.error('Upload failed:', errorData);
        showToast(errorData.message || 'Failed to upload avatar', 'error');
      }
    } catch (error) {
      console.error('Failed to update avatar:', error);
      showToast('Failed to upload avatar', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAvatarClick = () => {
    if (isOwnProfile) {
      handleImageClick();
    }
  };

  const handleFollowToggle = async () => {
    if (!user?._id || isFollowLoading) return;
    
    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        await userService.unfollowUser(user._id);
        setIsFollowing(false);
        setFollowersCount(prev => prev - 1);
        showToast('User unfollowed successfully', 'success');
      } else {
        await userService.followUser(user._id);
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
        showToast('User followed successfully', 'success');
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      showToast('Failed to update follow status', 'error');
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleBlockToggle = async () => {
    if (!user?._id || isBlockLoading) return;
    
    setIsBlockLoading(true);
    try {
      if (isBlocked) {
        await userService.unblockUser(user._id);
        setIsBlocked(false);
        showToast('User unblocked successfully', 'success');
      } else {
        await userService.blockUser(user._id);
        setIsBlocked(true);
        // If user was followed, unfollow them when blocking
        if (isFollowing) {
          setIsFollowing(false);
          setFollowersCount(prev => prev - 1);
        }
        showToast('User blocked successfully', 'success');
      }
      setShowBlockConfirm(false);
    } catch (error) {
      console.error('Error toggling block:', error);
      showToast('Failed to update block status', 'error');
    } finally {
      setIsBlockLoading(false);
    }
  };

  const handleSaveProfile = async (updatedData: Partial<any>) => {
    try {
      const response = await userService.updateProfile(updatedData);
      if (response.status === 'success') {
        // Update current user context with new data
        if (isOwnProfile) {
          updateUser(response.data.user);
        }
        // Update profile user state
        setProfileUser(response.data.user);
        showToast('Profile updated successfully!', 'success');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      if (error.response?.data?.message === 'Username is already taken') {
        throw error; // Let EditProfile component handle this specific error
      } else {
        showToast('Failed to update profile', 'error');
        throw error;
      }
    }
  };

  if (loading) {
    return (
      <div style={{ 
        maxWidth: '900px', 
        margin: '0 auto', 
        padding: '1.5rem',
        backgroundColor: 'var(--pb-background)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '3px solid var(--pb-light-periwinkle)',
            borderTop: '3px solid var(--pb-medium-purple)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ 
        maxWidth: '900px', 
        margin: '0 auto', 
        padding: '1.5rem',
        backgroundColor: 'var(--pb-background)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2>User not found</h2>
          <button onClick={() => navigate('/')} style={{
            padding: '0.5rem 1rem',
            background: 'var(--pb-medium-purple)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
            Go Back to Feed
          </button>
        </div>
      </div>
    );
  }

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
        textAlign: 'center',
        position: 'relative'
      }}>
        {/* Options Menu - Top Right */}
        {!isOwnProfile && (
          <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
            <div style={{ position: 'relative' }} ref={optionsMenuRef}>
              <button
                onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                style={{
                  padding: '0.5rem',
                  backgroundColor: 'transparent',
                  color: '#6b7280',
                  border: 'none',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="5" cy="12" r="2" fill="currentColor"/>
                  <circle cx="12" cy="12" r="2" fill="currentColor"/>
                  <circle cx="19" cy="12" r="2" fill="currentColor"/>
                </svg>
              </button>
              
              {showOptionsMenu && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: '0',
                  marginTop: '0.5rem',
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  minWidth: '150px',
                  zIndex: 10
                }}>
                  {isBlocked ? (
                    <button
                      onClick={() => {
                        handleBlockToggle();
                        setShowOptionsMenu(false);
                      }}
                      disabled={isBlockLoading}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        backgroundColor: 'transparent',
                        color: '#374151',
                        border: 'none',
                        textAlign: 'left',
                        cursor: isBlockLoading ? 'not-allowed' : 'pointer',
                        fontSize: '0.875rem',
                        opacity: isBlockLoading ? 0.7 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!isBlockLoading) {
                          e.currentTarget.style.backgroundColor = '#f3f4f6';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isBlockLoading) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      {isBlockLoading ? 'Loading...' : 'Unblock User'}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setShowBlockConfirm(true);
                        setShowOptionsMenu(false);
                      }}
                      disabled={isBlockLoading}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        backgroundColor: 'transparent',
                        color: '#dc2626',
                        border: 'none',
                        textAlign: 'left',
                        cursor: isBlockLoading ? 'not-allowed' : 'pointer',
                        fontSize: '0.875rem',
                        opacity: isBlockLoading ? 0.7 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!isBlockLoading) {
                          e.currentTarget.style.backgroundColor = '#fef2f2';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isBlockLoading) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      Block User
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        
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
          {!selectedImage && isOwnProfile && (
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
        
        {isOwnProfile && (
          <>
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
          </>
        )}
        
        <h1 style={{ fontSize: '2rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1f2937' }}>
          @{user?.username}
        </h1>
        <p style={{ fontSize: '1.125rem', color: '#6b7280', marginBottom: '1rem' }}>
          {user?.fullName}
        </p>
        
        {/* Follow/Following Stats */}
        <div style={{ 
          display: 'flex', 
          gap: '2rem', 
          justifyContent: 'center', 
          marginBottom: '1rem',
          fontSize: '0.875rem',
          color: '#6b7280'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '1.25rem' }}>
              {isOwnProfile ? (currentUser?.following?.length || 0) : followingCount}
            </div>
            <div>Following</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '1.25rem' }}>
              {isOwnProfile ? (currentUser?.followers?.length || 0) : followersCount}
            </div>
            <div>Followers</div>
          </div>
        </div>

        {/* Edit Profile Button - Only for own profile */}
        {isOwnProfile && (
          <button
            onClick={() => setShowEditProfile(true)}
            style={{
              padding: '0.75rem 2rem',
              backgroundColor: 'var(--pb-medium-purple)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              marginBottom: '1rem',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--pb-dark-purple)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--pb-medium-purple)';
            }}
          >
            Edit Profile
          </button>
        )}

        {/* Follow Button */}
        {!isOwnProfile && !isBlocked && (
          <button
            onClick={handleFollowToggle}
            disabled={isFollowLoading}
            style={{
              padding: '0.75rem 2rem',
              backgroundColor: isFollowing ? '#6b7280' : 'var(--pb-medium-purple)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: isFollowLoading ? 'not-allowed' : 'pointer',
              marginBottom: '1rem',
              transition: 'background-color 0.2s ease',
              opacity: isFollowLoading ? 0.7 : 1
            }}
            onMouseEnter={(e) => {
              if (!isFollowLoading) {
                e.currentTarget.style.backgroundColor = isFollowing ? '#4b5563' : 'var(--pb-dark-purple)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isFollowLoading) {
                e.currentTarget.style.backgroundColor = isFollowing ? '#6b7280' : 'var(--pb-medium-purple)';
              }
            }}
          >
            {isFollowLoading ? 'Loading...' : isFollowing ? 'Unfollow' : 'Follow'}
          </button>
        )}

        {/* Blocked User Notice */}
        {!isOwnProfile && isBlocked && (
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '1rem',
            padding: '1rem',
            backgroundColor: '#fee2e2',
            borderRadius: '8px',
            border: '1px solid #fecaca'
          }}>
            <p style={{ color: '#dc2626', fontWeight: '500', margin: '0' }}>
              You have blocked this user
            </p>
          </div>
        )}
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
        
        <div>
          {/* Top row - 4 items */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1.5rem',
            marginBottom: '1.5rem'
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
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                {user?.totalFlights?.toLocaleString() || '0'}
              </div>
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
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                {user?.citiesVisited?.toLocaleString() || '0'}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Cities Visited</div>
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
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                {user?.flightHours || '0'}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Flight Hours</div>
            </div>
          </div>

          {/* Bottom row - 3 items */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)',
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
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="#4A90E2"/>
                  <path d="M2 12h20" stroke="#2E7D32" strokeWidth="0.5"/>
                  <path d="M12 2c-2.5 0-4.5 4.5-4.5 10s2 10 4.5 10" stroke="#2E7D32" strokeWidth="0.5"/>
                  <path d="M12 2c2.5 0 4.5 4.5 4.5 10s-2 10-4.5 10" stroke="#2E7D32" strokeWidth="0.5"/>
                  <path d="M3.5 8h17" stroke="#2E7D32" strokeWidth="0.5"/>
                  <path d="M3.5 16h17" stroke="#2E7D32" strokeWidth="0.5"/>
                  <path d="M5 5c2 1 5 1.5 7 1.5s5-0.5 7-1.5" fill="#2E7D32" opacity="0.3"/>
                  <path d="M5 19c2-1 5-1.5 7-1.5s5 0.5 7 1.5" fill="#2E7D32" opacity="0.3"/>
                  <path d="M16 10c0 2-1 4-2 4s-2-2-2-4 1-4 2-4 2 2 2 4z" fill="#8B4513" opacity="0.4"/>
                  <path d="M8 14c0 1.5-0.5 3-1 3s-1-1.5-1-3 0.5-3 1-3 1 1.5 1 3z" fill="#2E7D32" opacity="0.4"/>
                </svg>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                {((user?.milesFlown || 0) / 24901).toFixed(1)}x
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Times Around Earth</div>
            </div>
            
            <div style={{ 
              padding: '1.25rem', 
              backgroundColor: 'var(--pb-ultra-light)', 
              borderRadius: '8px',
              border: '1px solid var(--pb-light-periwinkle)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="#E8E8E8"/>
                  <circle cx="8" cy="8" r="2" fill="#C0C0C0" opacity="0.6"/>
                  <circle cx="15" cy="10" r="1.5" fill="#C0C0C0" opacity="0.5"/>
                  <circle cx="10" cy="15" r="1" fill="#C0C0C0" opacity="0.4"/>
                  <circle cx="16" cy="16" r="1.8" fill="#C0C0C0" opacity="0.5"/>
                  <circle cx="6" cy="13" r="0.8" fill="#C0C0C0" opacity="0.3"/>
                  <circle cx="13" cy="6" r="0.6" fill="#C0C0C0" opacity="0.3"/>
                  <path d="M2 12C2 6.477 6.477 2 12 2c1.5 0 3 .3 4.3.9C15 3.5 14 5 14 7c0 3-2 5-4 5-1.5 0-3-1-3.5-2.5C5.5 11 5 13 5 15c0 1.5.5 3 1.5 4.2C4.2 17.5 2 15 2 12z" fill="#C0C0C0" opacity="0.2"/>
                </svg>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                {((user?.milesFlown || 0) / 238855).toFixed(2)}x
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>To the Moon</div>
            </div>
          </div>
        </div>
      </div>

      {/* User Posts Feed */}
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
          Posts
        </h2>
        
        {user?._id && (
          <UserPostsFeed userId={user._id} />
        )}
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
            <span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Unknown'}</span>
          </div>
        </div>
      </div>

      {/* Logout Button - Only show on own profile */}
      {isOwnProfile && (
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
      )}

      {/* Block Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showBlockConfirm}
        title="Block User?"
        message={`Are you sure you want to block @${user?.username}? This will prevent them from following you and seeing your content.`}
        confirmText="Block"
        cancelText="Cancel"
        type="danger"
        onConfirm={handleBlockToggle}
        onCancel={() => setShowBlockConfirm(false)}
      />

      {/* Edit Profile Modal */}
      {user && (
        <EditProfile
          user={user}
          isOpen={showEditProfile}
          onClose={() => setShowEditProfile(false)}
          onSave={handleSaveProfile}
        />
      )}
    </div>
  );
};