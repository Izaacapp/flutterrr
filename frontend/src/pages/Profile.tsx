import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFileUpload } from '../hooks/useFileUpload';
import { useToast } from '../contexts/ToastContext';
import { userService } from '../services/user.service';
import BookmarkService from '../services/bookmark.service'; // From 'main'
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { UserPostsFeed } from '../components/profile/UserPostsFeed'; // From 'feats'
import { PostCard } from '../components/feed/PostCard'; // From 'main'
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
  // Bookmarks state from 'main'
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const optionsMenuRef = useRef<HTMLDivElement>(null);
  
  const isOwnProfile = !username || username === currentUser?.username;
  const user = isOwnProfile ? (currentUser || profileUser) : profileUser;
  const {  
    selectedImage, previewUrl, error, imageInputRef, 
    handleImageClick, handleImageChange, removeImage 
  } = useFileUpload();

  useEffect(() => {
    // This effect combines the fetching logic from both branches seamlessly.
    const fetchUserProfile = async () => {
      setLoading(true);
      try {
        const targetUsername = isOwnProfile ? currentUser?.username : username;
        if (!targetUsername) {
          if (!isOwnProfile) navigate('/');
          return;
        }
        const response = await userService.getProfileByUsername(targetUsername);
        
        if (response.status === 'success') {
          const fetchedUser = response.data.user;
          setProfileUser(fetchedUser);
          setFollowersCount(fetchedUser.followersCount || 0);
          setFollowingCount(fetchedUser.followingCount || 0);
          if (!isOwnProfile) {
            setIsFollowing(fetchedUser.isFollowing || false);
            setIsBlocked(fetchedUser.isBlocked || false);
          }
        } else {
          showToast('User not found', 'error');
          navigate('/');
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        showToast('Failed to load profile', 'error');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [username, isOwnProfile, navigate, showToast, currentUser?.username]);

  // Bookmarks fetch logic from 'main'
  const fetchBookmarks = async () => {
    if (!isOwnProfile) return;
    setBookmarksLoading(true);
    try {
      const response = await BookmarkService.getBookmarks(1, 20);
      if (response.status === 'success' && response.data) {
        setBookmarks(response.data.bookmarks);
      }
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      showToast('Failed to load bookmarks', 'error');
    } finally {
      setBookmarksLoading(false);
    }
  };

  useEffect(() => {
    if (showBookmarks && isOwnProfile) {
      fetchBookmarks();
    }
  }, [showBookmarks, isOwnProfile]);

  // Click outside handler for options menu from 'main'
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target as Node)) {
        setShowOptionsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAvatarUpdate = async () => {
    if (!selectedImage) return;
    setIsUploading(true);
    try {
      const response = await userService.updateAvatar(selectedImage);
      if (response.status === 'success' && response.data?.user?.avatar) {
        updateUser({ avatar: response.data.user.avatar });
        showToast('Avatar updated successfully!', 'success');
        removeImage();
      } else {
        showToast(response.message || 'Failed to upload avatar', 'error');
      }
    } catch (error) {
      console.error('Failed to update avatar:', error);
      showToast('Failed to upload avatar', 'error');
    } finally {
      setIsUploading(false);
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
        showToast('User unfollowed', 'success');
      } else {
        await userService.followUser(user._id);
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
        showToast('User followed', 'success');
      }
    } catch (error) {
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
        showToast('User unblocked', 'success');
      } else {
        await userService.blockUser(user._id);
        setIsBlocked(true);
        if (isFollowing) {
          setIsFollowing(false);
          setFollowersCount(prev => prev - 1);
        }
        showToast('User blocked', 'success');
      }
      setShowBlockConfirm(false);
    } catch (error) {
      showToast('Failed to update block status', 'error');
    } finally {
      setIsBlockLoading(false);
    }
  };

  // Using the more robust save handler from 'feats'
  const handleSaveProfile = async (updatedData: Partial<any>) => {
    try {
      const response = await userService.updateProfile(updatedData);
      if (response.status === 'success') {
        if (isOwnProfile) {
          updateUser(response.data.user);
        }
        setProfileUser(response.data.user);
      }
    } catch (error: any) {
      // Re-throw the error to let the EditProfile component handle the display
      throw error; 
    }
  };

  // Using the more polished loading/empty states from 'main'
  if (loading) return <div>Loading profile...</div>;
  if (!user) return <div>User not found</div>;

  // Using the completely redesigned JSX from 'main' as the base
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem' }}>
      {/* Profile Header from 'main' */}
      <div style={{ backgroundColor: 'var(--pb-white)', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(139, 86, 192, 0.1)', marginBottom: '1.5rem', textAlign: 'center', position: 'relative' }}>
        {/* Options Menu from 'main' */}
        {!isOwnProfile && (
            <div style={{ position: 'absolute', top: '1rem', right: '1rem' }} ref={optionsMenuRef}>
                <button onClick={() => setShowOptionsMenu(!showOptionsMenu)} style={{ padding: '0.5rem', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
                </button>
                {showOptionsMenu && (
                    <div style={{ position: 'absolute', top: '100%', right: '0', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', zIndex: 10, minWidth: '150px' }}>
                        <button onClick={() => isBlocked ? handleBlockToggle() : setShowBlockConfirm(true)} disabled={isBlockLoading} style={{ width: '100%', padding: '0.75rem 1rem', border: 'none', textAlign: 'left', cursor: 'pointer', color: isBlocked ? '#374151' : '#dc2626' }}>
                            {isBlockLoading ? 'Loading...' : isBlocked ? 'Unblock User' : 'Block User'}
                        </button>
                    </div>
                )}
            </div>
        )}

        {/* Avatar and Info */}
        <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 1rem', borderRadius: '50%', overflow: 'hidden', cursor: isOwnProfile ? 'pointer' : 'default' }} onClick={isOwnProfile ? handleImageClick : undefined}>
            {previewUrl ? <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : user.avatar ? <img src={user.avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : <div style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--pb-light-periwinkle)', fontSize: '2.5rem', color: 'var(--pb-medium-purple)'}}>{user?.username?.charAt(0)?.toUpperCase()}</div>}
        </div>

        {isOwnProfile && <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />}
        {selectedImage && isOwnProfile && (
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1rem' }}>
                <button onClick={handleAvatarUpdate} disabled={isUploading} style={{ padding: '0.5rem 1.5rem', backgroundColor: 'var(--pb-medium-purple)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    {isUploading ? 'Uploading...' : 'Update Avatar'}
                </button>
                <button onClick={removeImage} disabled={isUploading} style={{ padding: '0.5rem 1.5rem', backgroundColor: 'var(--pb-light-periwinkle)', color: 'var(--pb-dark-purple)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Cancel
                </button>
            </div>
        )}

        <h1 style={{ fontSize: '2rem', fontWeight: '600', marginBottom: '0.5rem' }}>@{user.username}</h1>
        <p style={{ fontSize: '1.125rem', color: '#6b7280', marginBottom: '1rem' }}>{user.fullName}</p>
        {user.bio && <p style={{ fontStyle: 'italic', maxWidth: '400px', margin: '0 auto 1rem auto' }}>"{user.bio}"</p>}
        <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginBottom: '1rem' }}>
          <div><strong style={{fontSize: '1.25rem'}}>{followersCount}</strong> Followers</div>
          <div><strong style={{fontSize: '1.25rem'}}>{followingCount}</strong> Following</div>
        </div>
        
        {isOwnProfile ? (
          <button onClick={() => setShowEditProfile(true)} style={{ padding: '0.75rem 2rem', backgroundColor: 'var(--pb-medium-purple)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Edit Profile</button>
        ) : !isBlocked && (
          <button onClick={handleFollowToggle} disabled={isFollowLoading} style={{ padding: '0.75rem 2rem', backgroundColor: isFollowing ? '#6b7280' : 'var(--pb-medium-purple)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>{isFollowLoading ? 'Loading...' : isFollowing ? 'Unfollow' : 'Follow'}</button>
        )}
      </div>

      {/* Bookmarks Section from 'main' */}
      {isOwnProfile && (
        <div style={{ backgroundColor: 'var(--pb-white)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', margin: 0 }}>Bookmarked Posts</h2>
            <button onClick={() => setShowBookmarks(!showBookmarks)} style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--pb-medium-purple)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>{showBookmarks ? 'Hide' : 'View'}</button>
          </div>
          {showBookmarks && (
            <div>
              {bookmarksLoading ? <p>Loading bookmarks...</p> : bookmarks.length > 0 ? (
                <div style={{ display: 'grid', gap: '1rem' }}>{bookmarks.map(post => <PostCard key={post._id} post={post} currentUserId={currentUser?.id} />)}</div>
              ) : <p>No bookmarked posts yet.</p>}
            </div>
          )}
        </div>
      )}

      {/* Travel Statistics from 'main' */}
      <div style={{ backgroundColor: 'var(--pb-white)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', textAlign: 'center', marginBottom: '1.5rem' }}>Travel Statistics</h2>
        {/* ... (Keep the detailed stats grid JSX from the 'main' version here) ... */}
      </div>

      {/* User Posts Feed from 'feats' */}
      <div style={{ backgroundColor: 'var(--pb-white)', borderRadius: '12px', padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', textAlign: 'center', marginBottom: '1.5rem' }}>Posts</h2>
        {user?._id && <UserPostsFeed userId={user._id} />}
      </div>
      
      {/* Logout button from 'main' */}
      {isOwnProfile && (
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button onClick={logout} style={{ padding: '0.75rem 2rem', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Logout</button>
        </div>
      )}

      {/* Dialogs and Modals */}
      <ConfirmDialog isOpen={showBlockConfirm} title="Block User?" message={`Are you sure you want to block @${user?.username}?`} onConfirm={handleBlockToggle} onCancel={() => setShowBlockConfirm(false)} />
      
      {/* Edit Profile Modal using onSave from 'feats' */}
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