import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './PostCard.css';
import { postService } from '../../services/post.service';
import { bookmarkService } from '../../services/bookmark.service';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { VideoPlayer } from '../video/VideoPlayer';

interface PostImage {
  url: string;
  key: string;
}

interface PostVideo {
  url: string;
  key: string;
  duration?: number;
  thumbnail?: string;
  aspectRatio?: number;
  hasAudio?: boolean;
  views?: number;
}

interface PostLocation {
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

interface PostAuthor {
  _id: string;
  username: string;
  fullName: string;
  avatar?: string;
}

interface Comment {
  _id: string;
  author: PostAuthor;
  content: string;
  createdAt: string;
}

interface PostProps {
  post: {
    _id: string;
    content: string;
    images?: PostImage[];
    videos?: PostVideo[];
    location?: PostLocation;
    createdAt: string;
    author?: PostAuthor;
    likes: string[];
    comments: Comment[];
  };
  currentUserId?: string;
  onToggleLike?: (postId: string) => void;
  onCommentAdded?: (postId: string, comment: Comment) => void;
  onCommentDeleted?: (postId: string, commentId: string) => void;
  onPostDeleted?: (postId: string) => void;
}

function PostCardComponent({ post, currentUserId, onToggleLike, onCommentAdded, onCommentDeleted, onPostDeleted }: PostProps) {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [activeCommentMenu, setActiveCommentMenu] = useState<string | null>(null);
  const [showPostMenu, setShowPostMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const postDropdownRef = useRef<HTMLDivElement>(null);
  const hasImages = post.images && post.images.length > 0;
  const hasVideos = post.videos && post.videos.length > 0;
  const hasMedia = hasImages || hasVideos;
  const hasMultipleImages = post.images && post.images.length > 1;
  const [localIsLiked, setLocalIsLiked] = useState(currentUserId ? post.likes.includes(currentUserId) : false);
  const [localLikesCount, setLocalLikesCount] = useState(post.likes.length);
  const [isLiking, setIsLiking] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);

  // Sync with props when they change (e.g., from polling)
  useEffect(() => {
    setLocalIsLiked(currentUserId ? post.likes.includes(currentUserId) : false);
    setLocalLikesCount(post.likes.length);
  }, [post.likes, currentUserId]);

  // Check bookmark status on mount
  useEffect(() => {
    const checkBookmarkStatus = async () => {
      if (currentUserId && post._id) {
        try {
          const bookmarked = await bookmarkService.isBookmarked(post._id);
          setIsBookmarked(bookmarked);
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error('Failed to check bookmark status:', error);
          }
        }
      }
    };
    checkBookmarkStatus();
  }, [post._id, currentUserId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveCommentMenu(null);
      }
      if (postDropdownRef.current && !postDropdownRef.current.contains(event.target as Node)) {
        setShowPostMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  const handlePrevImage = useCallback(() => {
    if (post.images) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? post.images!.length - 1 : prev - 1
      );
    }
  }, [post.images]);

  const handleNextImage = useCallback(() => {
    if (post.images) {
      setCurrentImageIndex((prev) => 
        prev === post.images!.length - 1 ? 0 : prev + 1
      );
    }
  }, [post.images]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const handleLikeClick = useCallback(async () => {
    if (isLiking || !onToggleLike || !currentUserId) return;
    
    // Instantly update UI
    setLocalIsLiked(prev => !prev);
    setLocalLikesCount(prev => localIsLiked ? prev - 1 : prev + 1);
    setIsLiking(true);
    
    try {
      await onToggleLike(post._id);
    } catch (error) {
      // Revert on error
      setLocalIsLiked(prev => !prev);
      setLocalLikesCount(prev => localIsLiked ? prev + 1 : prev - 1);
    } finally {
      setIsLiking(false);
    }
  }, [isLiking, onToggleLike, currentUserId, post._id, localIsLiked]);

  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTap < DOUBLE_TAP_DELAY) {
      if (!localIsLiked && !isLiking) {
        handleLikeClick();
        setShowLikeAnimation(true);
        setTimeout(() => setShowLikeAnimation(false), 800);
      }
    }
    setLastTap(now);
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || isSubmittingComment || !currentUserId) return;

    setIsSubmittingComment(true);
    try {
      const response = await postService.addComment(post._id, commentText.trim());
      if (response.status === 'success' && onCommentAdded) {
        onCommentAdded(post._id, response.comment);
        setCommentText('');
        setShowComments(true);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to add comment:', error);
      }
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!currentUserId || !onCommentDeleted) return;

    try {
      const response = await postService.deleteComment(post._id, commentId);
      if (response.status === 'success') {
        onCommentDeleted(post._id, commentId);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to delete comment:', error);
      }
    }
  };

  const handleShare = useCallback(async () => {
    const postUrl = `${window.location.origin}/post/${post._id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post.author?.username || 'user'}`,
          text: post.content || 'Check out this post!',
          url: postUrl,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          if (import.meta.env.DEV) {
            console.error('Error sharing:', error);
          }
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(postUrl);
        setShowCopiedMessage(true);
        setTimeout(() => setShowCopiedMessage(false), 2000);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Failed to copy link:', error);
        }
      }
    }
  }, [post._id, post.author?.username, post.content]);

  const handleDeletePost = useCallback(async () => {
    setShowDeleteConfirm(true);
    setShowPostMenu(false);
  }, []);

  const handleConfirmDelete = () => {
    if (onPostDeleted) {
      onPostDeleted(post._id);
    }
    setShowDeleteConfirm(false);
  };

  const handleBookmarkClick = async () => {
    if (!currentUserId) {
      navigate('/auth');
      return;
    }
    
    if (isBookmarking) return;
    
    setIsBookmarking(true);
    setIsBookmarked(!isBookmarked);
    
    try {
      await bookmarkService.toggleBookmark(post._id);
    } catch (error) {
      // Revert on error
      setIsBookmarked(isBookmarked);
      if (import.meta.env.DEV) {
        console.error('Failed to toggle bookmark:', error);
      }
    } finally {
      setIsBookmarking(false);
    }
  };

  return (
    <article className="post-card">
      {/* Header */}
      <header className="post-header">
        <div className="post-author">
          <div 
            style={{
              width: '32px',
              height: '32px'
            }}
          >
            {post.author?.avatar ? (
              <img 
                src={post.author.avatar} 
                alt={`${post.author.username}'s avatar`}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <div 
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '14px',
                  backgroundColor: 'var(--pb-medium-purple)'
                }}
              >
                {(() => {
                  const fullName = post.author?.fullName || post.author?.username || 'User';
                  const names = fullName.split(' ');
                  if (names.length > 1) {
                    return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
                  }
                  return fullName.charAt(0).toUpperCase();
                })()}
              </div>
            )}
          </div>
          <div className="author-info">
            <h3 
              className="author-username" 
              onClick={() => post.author?.username && navigate(`/profile/${post.author.username}`)}
              style={{ cursor: 'pointer' }}
            >
              {post.author?.username || 'anonymous'}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <time className="post-time">{formatTimeAgo(post.createdAt)}</time>
              {post.location && (
                <span style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '3px',
                  backgroundColor: '#f3f4f6',
                  color: '#6b7280',
                  fontSize: '11px',
                  padding: '3px 10px',
                  borderRadius: '14px',
                  marginLeft: '8px',
                  fontWeight: '500'
                }}>
                  <svg 
                    width="10" 
                    height="10" 
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                  >
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <span>{post.location.name}</span>
                </span>
              )}
            </div>
          </div>
        </div>
        {currentUserId && post.author?._id === currentUserId && (
          <div className="post-menu-container" ref={postDropdownRef}>
            <button 
              className="post-options" 
              aria-label="Post options"
              onClick={() => setShowPostMenu(!showPostMenu)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="5" cy="12" r="2" fill="currentColor"/>
                <circle cx="12" cy="12" r="2" fill="currentColor"/>
                <circle cx="19" cy="12" r="2" fill="currentColor"/>
              </svg>
            </button>
            {showPostMenu && (
              <div className="post-dropdown">
                <button 
                  className="post-dropdown-item"
                  onClick={handleDeletePost}
                >
                  Delete Post
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Content - moved up before images */}
      {post.content && (
        <div className="post-content" onClick={handleDoubleTap}>
          <p className="post-text">{post.content}</p>
        </div>
      )}

      {/* Media (Images & Videos) */}
      {hasMedia && (
        <div className="post-media">
          <div className="image-container" onClick={hasVideos ? undefined : handleDoubleTap}>
            {hasVideos ? (
              <VideoPlayer
                src={post.videos![0].url}
                thumbnail={post.videos![0].thumbnail}
                postId={post._id}
                autoplay={false}
                loop={true}
                muted={true}
                aspectRatio={post.videos![0].aspectRatio || 16/9}
                className="post-video"
              />
            ) : hasImages ? (
              <img 
                src={post.images![currentImageIndex].url} 
                alt={`Post image ${currentImageIndex + 1}`}
                className="post-image"
              />
            ) : null}
            {showLikeAnimation && (
              <div className="like-animation">
                <svg viewBox="0 0 24 24" fill="#8b5cf6">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
            )}
            {hasMultipleImages && (
              <>
                <button 
                  className="image-nav image-nav-prev" 
                  onClick={handlePrevImage}
                  aria-label="Previous image"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button 
                  className="image-nav image-nav-next" 
                  onClick={handleNextImage}
                  aria-label="Next image"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <div className="image-indicators">
                  {post.images!.map((_, index) => (
                    <span 
                      key={index}
                      className={`indicator ${index === currentImageIndex ? 'active' : ''}`}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Actions - moved below content and images */}
      <div className="post-actions">
        <div className="actions-left">
          <button 
            className="action-button" 
            aria-label="Like"
            onClick={handleLikeClick}
            disabled={isLiking}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill={localIsLiked ? "#8b5cf6" : "none"} className={isLiking ? "pending-like" : ""}>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" 
                stroke={localIsLiked ? "#8b5cf6" : "currentColor"} 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"/>
            </svg>
          </button>
          <button 
            className="action-button" 
            aria-label="Comment"
            onClick={() => setShowComments(!showComments)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22l-1.344-4.992Z" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="action-button" aria-label="Share" onClick={handleShare}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 6.65685 16.3431 8 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 15C7.65685 15 9 13.6569 9 12C9 10.3431 7.65685 9 6 9C4.34315 9 3 10.3431 3 12C3 13.6569 4.34315 15 6 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18 22C19.6569 22 21 20.6569 21 19C21 17.3431 19.6569 16 18 16C16.3431 16 15 17.3431 15 19C15 20.6569 16.3431 22 18 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8.59 13.51L15.42 17.49" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15.41 6.51L8.59 10.49" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {showCopiedMessage && (
            <div className="copied-message">Link copied!</div>
          )}
        </div>
        <button 
          className="action-button" 
          aria-label="Save"
          onClick={handleBookmarkClick}
          disabled={isBookmarking}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill={isBookmarked ? "var(--pb-medium-purple)" : "none"}>
            <path d="M19 21L12 16L5 21V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H17C17.5304 3 18.0391 3.21071 18.4142 3.58579C18.7893 3.96086 19 4.46957 19 5V21Z" 
              stroke={isBookmarked ? "var(--pb-medium-purple)" : "currentColor"} 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Likes count */}
      <div className="post-stats">
        <button className="likes-count">{localLikesCount} {localLikesCount === 1 ? 'like' : 'likes'}</button>
        {post.comments.length > 0 && (
          <button 
            className="comments-count" 
            onClick={() => setShowComments(!showComments)}
          >
            {post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}
          </button>
        )}
      </div>

      {/* Comments section */}
      {showComments && post.comments.length > 0 && (
        <div className="comments-section">
          {post.comments.map((comment) => (
            <div key={comment._id} className="comment">
              <div className="comment-header">
                <div className="comment-author">
                  <span 
                    className="comment-username"
                    onClick={() => comment.author?.username && navigate(`/profile/${comment.author.username}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    {comment.author?.username || 'anonymous'}
                  </span>
                  <span className="comment-time">{formatTimeAgo(comment.createdAt)}</span>
                </div>
                {currentUserId && (comment.author?._id === currentUserId || post.author?._id === currentUserId) && (
                  <div className="comment-menu-container" ref={activeCommentMenu === comment._id ? dropdownRef : null}>
                    <button 
                      className="comment-menu-button"
                      onClick={() => setActiveCommentMenu(activeCommentMenu === comment._id ? null : comment._id)}
                      aria-label="Comment options"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <circle cx="5" cy="12" r="2" fill="currentColor"/>
                        <circle cx="12" cy="12" r="2" fill="currentColor"/>
                        <circle cx="19" cy="12" r="2" fill="currentColor"/>
                      </svg>
                    </button>
                    {activeCommentMenu === comment._id && (
                      <div className="comment-dropdown">
                        <button 
                          className="comment-dropdown-item"
                          onClick={() => {
                            handleDeleteComment(comment._id);
                            setActiveCommentMenu(null);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <p className="comment-content">{comment.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add comment */}
      {showComments && (
        <div className="add-comment">
          <input 
            type="text" 
            placeholder="Add a comment..." 
            className="comment-input"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSubmitComment();
              }
            }}
            disabled={!currentUserId || isSubmittingComment}
          />
          <button 
            className="comment-post" 
            disabled={!commentText.trim() || !currentUserId || isSubmittingComment}
            onClick={handleSubmitComment}
          >
            {isSubmittingComment ? 'Posting...' : 'Post'}
          </button>
        </div>
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Post?"
        message="This action cannot be undone. Are you sure you want to delete this post?"
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </article>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const PostCard = memo(PostCardComponent, (prevProps, nextProps) => {
  // Custom comparison - only re-render if these props change
  return (
    prevProps.post._id === nextProps.post._id &&
    prevProps.post.likes.length === nextProps.post.likes.length &&
    prevProps.post.content === nextProps.post.content &&
    prevProps.post.comments.length === nextProps.post.comments.length &&
    prevProps.currentUserId === nextProps.currentUserId &&
    prevProps.post.author?._id === nextProps.post.author?._id
  );
});