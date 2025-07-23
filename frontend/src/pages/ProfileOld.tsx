import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFileUpload } from '../hooks/useFileUpload';
import { useToast } from '../contexts/ToastContext';
import { userService } from '../services/user.service';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useApolloClient } from '@apollo/client';
import { GetPostsDocument } from '../gql/generated';
import { TravelStats } from '../components/common/TravelStats';
import { useFlightStats } from '../hooks/useFlightStats';

export const Profile: React.FC = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, logout, updateUser } = useAuth();
  const { showToast } = useToast();
  const apolloClient = useApolloClient();
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
  const optionsMenuRef = useRef<HTMLDivElement>(null);
  
  const isOwnProfile = !username || username === currentUser?.username;
  const user = isOwnProfile ? currentUser : profileUser;
  const { stats, loading: statsLoading } = isOwnProfile ? useFlightStats() : { stats: null, loading: false };
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
      }
    };

    fetchUserProfile();
  }, [username, isOwnProfile, navigate, showToast]);

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
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/users/avatar`, {
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
      
      // 🔧 FIX #2: ATOMIC CACHE UPDATES - No more cache.reset() or full refetch
      try {
        console.log('🔧 ATOMIC_CACHE: Starting atomic cache update for block/unblock');
        
        // Import socket service for stable reconnection during cache operations
        const { socketService } = await import('../services/socket.service');
        
        // Preserve socket connection during cache operations
        const preservedToken = socketService.getCurrentToken();
        
        // 🔧 FIX #3: BIDIRECTIONAL BLOCKING - Handle both directions (I block them OR they block me)
        if (isBlocked) {
          // UNBLOCKING: Update cache for bidirectional unblocking
          console.log('🔓 BIDIRECTIONAL: Unblocking user - updating cache atomically');
          
          // Update blocked user's profile status
          apolloClient.cache.modify({
            id: `User:${user._id}`,
            fields: {
              blocked: () => false,
              isBlocked: () => false,
              blockedByCurrentUser: () => false
            }
          });
          
          // Update current user's blocked list in cache
          apolloClient.cache.modify({
            id: `User:${currentUser?.id}`,
            fields: {
              blockedUsers(existingBlocked = [], { toReference }) {
                console.log('🔓 BIDIRECTIONAL: Removing user from my blocked list');
                return existingBlocked.filter((blockedRef: any) => {
                  const blockedId = blockedRef?.__ref?.split(':')[1];
                  return blockedId !== user._id;
                });
              }
            }
          });
          
          console.log('✅ BIDIRECTIONAL: User unblocked, posts will reappear via backend filtering');
          
        } else {
          // BLOCKING: Update cache for bidirectional blocking
          console.log('🔒 BIDIRECTIONAL: Blocking user - updating cache atomically');
          
          // Update blocked user's profile status
          apolloClient.cache.modify({
            id: `User:${user._id}`,
            fields: {
              blocked: () => true,
              isBlocked: () => true,
              blockedByCurrentUser: () => true
            }
          });
          
          // Update current user's blocked list in cache
          apolloClient.cache.modify({
            id: `User:${currentUser?.id}`,
            fields: {
              blockedUsers(existingBlocked = [], { toReference }) {
                console.log('🔒 BIDIRECTIONAL: Adding user to my blocked list');
                const newBlockedUserRef = toReference(`User:${user._id}`);
                if (newBlockedUserRef && !existingBlocked.some((ref: any) => ref.__ref === `User:${user._id}`)) {
                  return [...existingBlocked, newBlockedUserRef];
                }
                return existingBlocked;
              }
            }
          });
          
          // Filter posts from timeline - handle both directions
          apolloClient.cache.modify({
            fields: {
              posts(existingPosts = [], { readField }) {
                console.log('🔧 BIDIRECTIONAL: Filtering blocked user posts from timeline');
                return existingPosts.filter((postRef: any) => {
                  const authorId = readField('_id', readField('author', postRef));
                  
                  // Check if this is the user I just blocked
                  if (authorId === user._id) {
                    console.log(`🚫 BIDIRECTIONAL: Filtered out post from blocked user ${user.username}`);
                    return false;
                  }
                  
                  // Additional check: filter posts from users who have blocked me
                  // (This will be handled by backend, but cache consistency is important)
                  const authorData = readField('author', postRef);
                  const authorBlockedUsers = readField('blockedUsers', authorData);
                  if (authorBlockedUsers && Array.isArray(authorBlockedUsers)) {
                    const authorBlockedMe = authorBlockedUsers.some((blockedId: any) => 
                      blockedId?.toString() === currentUser?.id
                    );
                    if (authorBlockedMe) {
                      console.log(`🚫 BIDIRECTIONAL: Filtered out post from user who blocked me`);
                      return false;
                    }
                  }
                  
                  return true;
                });
              }
            }
          });
          
          console.log('✅ BIDIRECTIONAL: User blocked, posts filtered from timeline (both directions)');
        }
        
        // Ensure WebSocket connection remains stable during cache operations  
        if (preservedToken && !socketService.isHealthyDuringBlock()) {
          console.log('🔧 ATOMIC_CACHE: Reconnecting WebSocket after cache operations');
          socketService.reconnectOnBlock(preservedToken);
        }
        
        console.log('✅ ATOMIC_CACHE: Cache operations completed atomically');
      } catch (cacheError) {
        console.error('❌ ATOMIC_CACHE: Failed atomic cache update:', cacheError);
        // Fallback: Only refetch if atomic update fails
        console.log('🔄 ATOMIC_CACHE: Falling back to network refetch');
        try {
          await apolloClient.refetchQueries({
            include: [GetPostsDocument],
            fetchPolicy: 'network-only'
          });
        } catch (fallbackError) {
          console.error('❌ ATOMIC_CACHE: Fallback refetch also failed:', fallbackError);
        }
      }
      
      setShowBlockConfirm(false);
    } catch (error) {
      console.error('Error toggling block:', error);
      showToast('Failed to update block status', 'error');
    } finally {
      setIsBlockLoading(false);
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

      {/* Travel Statistics - Only show for own profile */}
      {isOwnProfile && (
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
          
          <TravelStats stats={stats} loading={statsLoading} showGoals={true} />
        </div>
      )}

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
    </div>
  );
};