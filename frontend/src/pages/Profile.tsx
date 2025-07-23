import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFileUpload } from '../hooks/useFileUpload';
import { useToast } from '../contexts/ToastContext';
import { userService } from '../services/user.service';
import { bookmarkService } from '../services/bookmark.service';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useApolloClient } from '@apollo/client';
import { GetPostsDocument } from '../gql/generated';
import { TravelStats } from '../components/common/TravelStats';
import { useFlightStats } from '../hooks/useFlightStats';
import { PostCard } from '../components/feed/PostCard';
import { postService } from '../services/post.service';
import '../components/feed/Feed.css';

type TabType = 'posts' | 'friends' | 'bookmarks' | 'stats';

export const Profile: React.FC = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser, logout, updateUser } = useAuth();
  const { showToast } = useToast();
  const apolloClient = useApolloClient();
  const [isUploading, setIsUploading] = useState(false);
  const [profileUser, setProfileUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [userFollowers, setUserFollowers] = useState<any[]>([]);
  const [userFollowing, setUserFollowing] = useState<any[]>([]);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isBlockLoading, setIsBlockLoading] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [showStatsPanel, setShowStatsPanel] = useState(false);
  const [bookmarkedPosts, setBookmarkedPosts] = useState<any[]>([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(false);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
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

  // Handle navigation state for active tab
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  // Memoize data fetching functions
  const fetchUserProfile = useCallback(async () => {
    if (username && !isOwnProfile) {
      setLoading(true);
      try {
        const response = await userService.getProfileByUsername(username);
        
        if (response.status === 'success') {
          setProfileUser(response.data.user);
          setIsFollowing(response.data.user.isFollowing || false);
          setIsBlocked(response.data.user.isBlocked || false);
          setFollowersCount(response.data.user.followersCount || 0);
          setFollowingCount(response.data.user.followingCount || 0);
          setUserFollowers(response.data.user.followers || []);
          setUserFollowing(response.data.user.following || []);
        } else {
          showToast('User not found', 'error');
          navigate('/');
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Error fetching user profile:', error);
        }
        showToast('Failed to load profile', 'error');
        navigate('/');
      } finally {
        setLoading(false);
      }
    } else if (isOwnProfile && currentUser?.username) {
      // Fetch own profile data to get follower/following counts
      setLoading(true);
      try {
        const response = await userService.getProfileByUsername(currentUser.username);
        if (response.status === 'success') {
          setFollowersCount(response.data.user.followersCount || 0);
          setFollowingCount(response.data.user.followingCount || 0);
          setUserFollowers(response.data.user.followers || []);
          setUserFollowing(response.data.user.following || []);
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Error fetching own profile data:', error);
        }
      } finally {
        setLoading(false);
      }
    }
  }, [username, isOwnProfile, currentUser?.username, showToast, navigate]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  // Fetch user posts when posts tab is active
  useEffect(() => {
    const fetchUserPosts = async () => {
      if (activeTab === 'posts' && user?.id) {
        setPostsLoading(true);
        try {
          const token = localStorage.getItem('passport_buddy_token');
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/posts/user/${user.id}`, {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.status === 'success') {
              setUserPosts(result.data.posts);
            }
          }
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error('Failed to fetch user posts:', error);
          }
          showToast('Failed to load posts', 'error');
        } finally {
          setPostsLoading(false);
        }
      }
    };

    fetchUserPosts();
  }, [activeTab, user?.id, showToast]);

  // Fetch bookmarked posts when bookmarks tab is active
  useEffect(() => {
    const fetchBookmarks = async () => {
      if (activeTab === 'bookmarks' && isOwnProfile) {
        setBookmarksLoading(true);
        try {
          const response = await bookmarkService.getBookmarkedPosts();
          setBookmarkedPosts(response.posts || []);
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error('Failed to fetch bookmarks:', error);
          }
          showToast('Failed to load bookmarks', 'error');
        } finally {
          setBookmarksLoading(false);
        }
      }
    };

    fetchBookmarks();
  }, [activeTab, isOwnProfile, showToast]);

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
        if (data.data?.user?.avatar) {
          updateUser({ avatar: data.data.user.avatar });
          showToast('Avatar updated successfully!', 'success');
        }
        removeImage();
      } else {
        const errorData = await response.json();
        showToast(errorData.message || 'Failed to upload avatar', 'error');
      }
    } catch (error) {
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
    if (!user?.id || isFollowLoading) return;
    
    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        await userService.unfollowUser(user.id);
        setIsFollowing(false);
        setFollowersCount(prev => prev - 1);
      } else {
        await userService.followUser(user.id);
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to update follow status:', error);
      }
      // Revert on error
      if (isFollowing) {
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
      } else {
        setIsFollowing(false);
        setFollowersCount(prev => prev - 1);
      }
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleBlockToggle = async () => {
    if (!user?.id || isBlockLoading) return;
    
    setIsBlockLoading(true);
    try {
      if (isBlocked) {
        await userService.unblockUser(user.id);
        setIsBlocked(false);
        showToast('User unblocked successfully', 'success');
      } else {
        await userService.blockUser(user.id);
        setIsBlocked(true);
        if (isFollowing) {
          setIsFollowing(false);
          setFollowersCount(prev => prev - 1);
        }
        showToast('User blocked successfully', 'success');
      }
      
      // Update Apollo cache
      try {
        apolloClient.cache.modify({
          id: `User:${user.id}`,
          fields: {
            blocked: () => isBlocked,
            isBlocked: () => isBlocked,
            blockedByCurrentUser: () => isBlocked
          }
        });
      } catch (cacheError) {
        if (import.meta.env.DEV) {
          console.error('Cache update error:', cacheError);
        }
      }
      
      setShowBlockConfirm(false);
    } catch (error) {
      showToast('Failed to update block status', 'error');
    } finally {
      setIsBlockLoading(false);
    }
  };

  const handleToggleLike = async (postId: string) => {
    try {
      await postService.toggleLike(postId);
    } catch (error) {
      showToast('Failed to like post', 'error');
    }
  };

  const handleCommentAdded = (postId: string, comment: any) => {
    setBookmarkedPosts(prev => 
      prev.map(post => 
        post._id === postId 
          ? { ...post, comments: [...post.comments, comment] }
          : post
      )
    );
  };

  const handleCommentDeleted = (postId: string, commentId: string) => {
    setBookmarkedPosts(prev => 
      prev.map(post => 
        post._id === postId 
          ? { ...post, comments: post.comments.filter((c: any) => c._id !== commentId) }
          : post
      )
    );
  };

  const handlePostDeleted = (postId: string) => {
    setBookmarkedPosts(prev => prev.filter(post => post._id !== postId));
    setUserPosts(prev => prev.filter(post => post._id !== postId));
  };

  const handleCommentAddedToPosts = (postId: string, comment: any) => {
    setUserPosts(prev => 
      prev.map(post => 
        post._id === postId 
          ? { ...post, comments: [...post.comments, comment] }
          : post
      )
    );
  };

  const handleCommentDeletedFromPosts = (postId: string, commentId: string) => {
    setUserPosts(prev => 
      prev.map(post => 
        post._id === postId 
          ? { ...post, comments: post.comments.filter((c: any) => c._id !== commentId) }
          : post
      )
    );
  };

  if (loading || !user) {
    return (
      <div style={{ 
        maxWidth: '900px', 
        margin: '0 auto', 
        padding: '1.5rem',
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

  return (
    <div style={{ 
      maxWidth: '900px', 
      margin: '0 auto', 
      padding: '1.5rem',
      backgroundColor: 'var(--pb-background)',
      minHeight: '100vh'
    }}>
      {/* Profile Header Card */}
      <div style={{ 
        backgroundColor: 'var(--pb-white)',
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: '0 2px 8px rgba(139, 86, 192, 0.1)',
        marginBottom: '1rem',
        position: 'relative'
      }}>
        {/* Options Menu */}
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
                  width: '32px',
                  height: '32px',
                  transition: 'background-color 0.2s ease'
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
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  minWidth: '150px',
                  zIndex: 10
                }}>
                  <button
                    onClick={() => {
                      if (isBlocked) {
                        handleBlockToggle();
                      } else {
                        setShowBlockConfirm(true);
                      }
                      setShowOptionsMenu(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      backgroundColor: 'transparent',
                      color: isBlocked ? '#374151' : '#dc2626',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    {isBlocked ? 'Unblock User' : 'Block User'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Profile Info */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1.5rem',
          justifyContent: 'center'
        }}>
          {/* Avatar */}
          <div style={{ position: 'relative' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              backgroundColor: 'var(--pb-light-periwinkle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              fontWeight: '600',
              color: 'var(--pb-medium-purple)',
              overflow: 'hidden',
              cursor: isOwnProfile ? 'pointer' : 'default'
            }}
            onClick={handleAvatarClick}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : user?.avatar ? (
                <img src={user.avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                user?.username?.charAt(0)?.toUpperCase() || 'U'
              )}
            </div>
            {isOwnProfile && !selectedImage && (
              <button
                onClick={handleAvatarClick}
                style={{
                  position: 'absolute',
                  bottom: -4,
                  right: -4,
                  backgroundColor: 'var(--pb-medium-purple)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </button>
            )}
          </div>
          
          {/* User Info */}
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--pb-dark-purple)' }}>
              {user?.fullName}
            </h1>
            
            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'center' }}>
              {!isOwnProfile && !isBlocked && (
                <button
                  onClick={handleFollowToggle}
                  disabled={isFollowLoading}
                  style={{
                    padding: '0.5rem 1.5rem',
                    backgroundColor: isFollowing ? 'transparent' : 'var(--pb-medium-purple)',
                    color: isFollowing ? 'var(--pb-medium-purple)' : 'white',
                    border: isFollowing ? '2px solid var(--pb-medium-purple)' : 'none',
                    borderRadius: '24px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isFollowLoading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
              
              {isOwnProfile && (
                <button
                  onClick={() => setShowStatsPanel(!showStatsPanel)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: 'var(--pb-light-periwinkle)',
                    color: 'var(--pb-dark-purple)',
                    border: 'none',
                    borderRadius: '24px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/>
                    <path d="M22 12A10 10 0 0 0 12 2v10z"/>
                  </svg>
                  Travel Stats
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Avatar Upload Controls */}
        {isOwnProfile && (
          <>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
            
            {selectedImage && (
              <div style={{ 
                display: 'flex', 
                gap: '0.5rem', 
                justifyContent: 'center', 
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--pb-light-periwinkle)'
              }}>
                <button
                  onClick={handleAvatarUpdate}
                  disabled={!selectedImage || isUploading}
                  style={{
                    padding: '0.5rem 1.5rem',
                    backgroundColor: 'var(--pb-medium-purple)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  {isUploading ? 'Uploading...' : 'Update Avatar'}
                </button>
                <button
                  onClick={removeImage}
                  style={{
                    padding: '0.5rem 1.5rem',
                    backgroundColor: 'var(--pb-light-periwinkle)',
                    color: 'var(--pb-dark-purple)',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Tumblr-style Tabs */}
      <div style={{ 
        backgroundColor: 'var(--pb-white)',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(139, 86, 192, 0.1)',
        marginBottom: '1rem',
        overflow: 'hidden'
      }}>
        <div style={{ 
          display: 'flex',
          borderBottom: '1px solid var(--pb-light-periwinkle)'
        }}>
          <button
            onClick={() => setActiveTab('posts')}
            style={{
              flex: 1,
              padding: '1rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'posts' ? '3px solid var(--pb-medium-purple)' : '3px solid transparent',
              color: activeTab === 'posts' ? 'var(--pb-dark-purple)' : '#6b7280',
              fontSize: '0.9375rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Posts
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            style={{
              flex: 1,
              padding: '1rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'friends' ? '3px solid var(--pb-medium-purple)' : '3px solid transparent',
              color: activeTab === 'friends' ? 'var(--pb-dark-purple)' : '#6b7280',
              fontSize: '0.9375rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Friends
          </button>
          <button
            onClick={() => setActiveTab('bookmarks')}
            style={{
              flex: 1,
              padding: '1rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'bookmarks' ? '3px solid var(--pb-medium-purple)' : '3px solid transparent',
              color: activeTab === 'bookmarks' ? 'var(--pb-dark-purple)' : '#6b7280',
              fontSize: '0.9375rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Bookmarks
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ padding: '1.5rem' }}>
          {activeTab === 'posts' && (
            <div style={{ margin: '-1.5rem', paddingTop: '12px' }}>
              {postsLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    border: '3px solid var(--pb-light-periwinkle)',
                    borderTop: '3px solid var(--pb-medium-purple)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 1rem'
                  }}></div>
                  <p style={{ color: '#6b7280' }}>Loading posts...</p>
                </div>
              ) : userPosts.length > 0 ? (
                <div className="feed-posts" style={{ maxWidth: '100%' }}>
                  {userPosts.map(post => (
                    <PostCard
                      key={post._id}
                      post={post}
                      currentUserId={currentUser?.id}
                      onToggleLike={handleToggleLike}
                      onCommentAdded={handleCommentAddedToPosts}
                      onCommentDeleted={handleCommentDeletedFromPosts}
                      onPostDeleted={handlePostDeleted}
                    />
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto 1rem', opacity: 0.3 }}>
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="2"/>
                    <line x1="9" y1="21" x2="9" y2="9" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <p style={{ color: '#6b7280' }}>No posts yet</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'friends' && (
            <div>
              {/* Friends Stats */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ 
                  textAlign: 'center',
                  padding: '1rem',
                  backgroundColor: 'var(--pb-ultra-light)',
                  borderRadius: '8px'
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--pb-dark-purple)' }}>
                    {followingCount}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Following</div>
                </div>
                <div style={{ 
                  textAlign: 'center',
                  padding: '1rem',
                  backgroundColor: 'var(--pb-ultra-light)',
                  borderRadius: '8px'
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--pb-dark-purple)' }}>
                    {followersCount}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Followers</div>
                </div>
              </div>
              
              {/* Friends List would go here */}
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <p style={{ color: '#6b7280' }}>Friends list coming soon</p>
              </div>
            </div>
          )}

          {activeTab === 'bookmarks' && (
            <div style={{ margin: '-1.5rem', paddingTop: '12px' }}>
              {bookmarksLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    border: '3px solid var(--pb-light-periwinkle)',
                    borderTop: '3px solid var(--pb-medium-purple)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 1rem'
                  }}></div>
                  <p style={{ color: '#6b7280' }}>Loading bookmarks...</p>
                </div>
              ) : bookmarkedPosts.length > 0 ? (
                <div className="feed-posts" style={{ maxWidth: '100%' }}>
                  {bookmarkedPosts.map(post => (
                    <PostCard
                      key={post._id}
                      post={post}
                      currentUserId={currentUser?.id}
                      onToggleLike={handleToggleLike}
                      onCommentAdded={handleCommentAdded}
                      onCommentDeleted={handleCommentDeleted}
                      onPostDeleted={handlePostDeleted}
                    />
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto 1rem', opacity: 0.3 }}>
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <p style={{ color: '#6b7280' }}>No bookmarks yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Travel Stats Slide Panel */}
      {isOwnProfile && showStatsPanel && (
        <>
          {/* Backdrop */}
          <div 
            style={{
              position: 'fixed',
              top: '60px',
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 998,
              animation: 'fadeIn 0.3s ease-out'
            }}
            onClick={() => setShowStatsPanel(false)}
          />
        <div 
          className="stats-panel-scroll"
          style={{
            position: 'fixed',
            top: '60px',
            right: 0,
            width: '300px',
            height: 'calc(100vh - 60px)',
            backgroundColor: 'white',
            boxShadow: '-2px 0 10px rgba(0, 0, 0, 0.1)',
            zIndex: 999,
            overflowY: 'auto',
            overflowX: 'hidden',
            animation: 'slideIn 0.3s cubic-bezier(0.0, 0.0, 0.2, 1)'
          }}>
          <div style={{ 
            padding: '1rem 1.5rem',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            backgroundColor: 'white',
            zIndex: 10
          }}>
            <h2 style={{ 
              fontSize: '1.25rem', 
              fontWeight: '700',
              color: 'var(--pb-dark-purple)'
            }}>
              Travel Statistics
            </h2>
            <button
              onClick={() => setShowStatsPanel(false)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--pb-ultra-light)',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--pb-medium-purple)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--pb-light-periwinkle)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--pb-ultra-light)';
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          
          <div style={{ padding: '1.5rem', paddingTop: '1rem' }}>
            <TravelStats stats={stats} loading={statsLoading} showGoals={true} />
          </div>
        </div>
        </>
      )}

      {/* Logout Button */}
      {isOwnProfile && (
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button
            onClick={logout}
            style={{
              padding: '0.75rem 2rem',
              backgroundColor: 'transparent',
              color: '#dc3545',
              border: '2px solid #dc3545',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#dc3545';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#dc3545';
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

      {/* CSS for animations */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes slideIn {
            from {
              transform: translateX(100%);
            }
            to {
              transform: translateX(0);
            }
          }
          
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          
          /* Custom scrollbar for stats panel */
          .stats-panel-scroll {
            scrollbar-width: thin;
            scrollbar-color: var(--pb-light-periwinkle) transparent;
          }
          
          .stats-panel-scroll::-webkit-scrollbar {
            width: 6px;
          }
          
          .stats-panel-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
          
          .stats-panel-scroll::-webkit-scrollbar-thumb {
            background-color: var(--pb-light-periwinkle);
            border-radius: 3px;
            transition: background-color 0.2s ease;
          }
          
          .stats-panel-scroll::-webkit-scrollbar-thumb:hover {
            background-color: var(--pb-medium-purple);
          }
          
          /* Hide scrollbar by default, show on hover */
          .stats-panel-scroll:not(:hover)::-webkit-scrollbar-thumb {
            background-color: transparent;
          }
        `}
      </style>
    </div>
  );
};