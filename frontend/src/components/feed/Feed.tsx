import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { PostCard } from './PostCard';

interface User {
  _id: string;
  username: string;
  fullName: string;
  avatar?: string;
}

interface Post {
  _id: string;
  author: User;
  content: string;
  images: Array<{ url: string; key: string; size: number; mimetype: string }>;
  videos: Array<{ url: string; key: string; size: number; mimetype: string }>;
  likes: string[];
  comments: Array<{
    _id: string;
    author: User;
    content: string;
    createdAt: Date;
  }>;
  location?: {
    name: string;
    latitude?: number;
    longitude?: number;
  };
  createdAt: Date;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function Feed() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const getAllPost = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('passport_buddy_token');
      const response = await fetch(`${API_BASE}/api/v1/posts/all`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success') {
          setPosts(result.data.posts);
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching posts:', error);
      }
      showToast('Failed to load posts', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getAllPost();
    
    // Listen for new post events to refresh the feed
    const handlePostCreated = () => {
      getAllPost();
    };
    
    window.addEventListener('post-created', handlePostCreated);
    
    return () => {
      window.removeEventListener('post-created', handlePostCreated);
    };
  }, []); // Remove showToast dependency to prevent re-fetching

  const handleCommentAdded = useCallback((postId: string, comment: any) => {
    // Update local state instead of re-fetching
    setPosts(prevPosts => 
      prevPosts.map(post => {
        if (post._id === postId) {
          return {
            ...post,
            comments: [...post.comments, comment]
          };
        }
        return post;
      })
    );
  }, []);

  const handleCommentDeleted = useCallback((postId: string, commentId: string) => {
    // Update local state instead of re-fetching
    setPosts(prevPosts => 
      prevPosts.map(post => {
        if (post._id === postId) {
          return {
            ...post,
            comments: post.comments.filter(c => c._id !== commentId)
          };
        }
        return post;
      })
    );
  }, []);

  const handlePostDeleted = useCallback(async (postId: string) => {
    try {
      const token = localStorage.getItem('passport_buddy_token');
      const response = await fetch(`${API_BASE}/api/v1/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (response.ok) {
        showToast('Post deleted successfully', 'success');
        // Remove from local state instead of re-fetching
        setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error deleting post:', error);
      }
      showToast('Failed to delete post', 'error');
    }
  }, [showToast]);

  const handleLikeDislike = useCallback(async (id: string) => {
    try {
      const token = localStorage.getItem('passport_buddy_token');
      const response = await fetch(`${API_BASE}/api/v1/posts/${id}/like`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success') {
          // Update posts state optimistically
          setPosts(prevPosts => 
            prevPosts.map(post => {
              if (post._id === id) {
                const isLiked = post.likes.includes(user?.id || '');
                return {
                  ...post,
                  likes: isLiked 
                    ? post.likes.filter(likeId => likeId !== user?.id)
                    : [...post.likes, user?.id || '']
                };
              }
              return post;
            })
          );
          showToast(result.message, 'success');
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error toggling like:', error);
      }
      showToast('Failed to update like', 'error');
    }
  }, [user?.id, showToast]);

  const handleComment = useCallback(async (id: string) => {
    if (!comment.trim()) return;
    
    try {
      const token = localStorage.getItem('passport_buddy_token');
      const response = await fetch(`${API_BASE}/api/v1/posts/${id}/comment`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ content: comment }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success') {
          // Update posts state with new comment
          setPosts(prevPosts =>
            prevPosts.map(post => {
              if (post._id === id) {
                return {
                  ...post,
                  comments: [...post.comments, result.comment]
                };
              }
              return post;
            })
          );
          showToast('Comment Posted', 'success');
          setComment('');
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error adding comment:', error);
      }
      showToast('Failed to add comment', 'error');
    }
  }, [comment, showToast]);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center flex-col">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (posts.length < 1) {
    return (
      <div className="text-3xl m-8 text-center capitalize font-bold">
        No Posts To Show
      </div>
    );
  }

  return (
    <div className="feed-container">
      <div className="feed-posts">
        {posts.map((post: any) => (
          <PostCard 
            key={post._id}
            post={post} 
            currentUserId={user?.id}
            onToggleLike={handleLikeDislike}
            onCommentAdded={handleCommentAdded}
            onCommentDeleted={handleCommentDeleted}
            onPostDeleted={handlePostDeleted}
          />
        ))}
      </div>
    </div>
  );
}