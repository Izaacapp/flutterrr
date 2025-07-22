// 1. Correct the import path and remove the unused `gql` tag
import { useGetPostsQuery } from '../../gql/generated';
import { PostCard } from './PostCard';
import { useAuth } from '../../contexts/AuthContext';
import postService from '../../services/post.service';
import { useToast } from '../../contexts/ToastContext';
import { client } from '../../main';
import { useCallback, useRef, useEffect } from 'react';
import './Feed.css';

export function Feed() {
  // 2. The generated `useGetPostsQuery` hook already knows which query to run
  const { loading, error, data, refetch } = useGetPostsQuery({
    pollInterval: 30000, // Reduced from 10s to 30s
    fetchPolicy: 'cache-first', // Use cache first instead of network
    notifyOnNetworkStatusChange: false, // Prevent loading state during polling
  });
  const { user } = useAuth();
  const { showToast } = useToast();
  
  // Debounce refetch to prevent multiple rapid requests
  const refetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debouncedRefetch = useCallback(() => {
    if (refetchTimeoutRef.current) {
      clearTimeout(refetchTimeoutRef.current);
    }
    refetchTimeoutRef.current = setTimeout(() => {
      refetch();
    }, 500); // Wait 500ms before refetching
  }, [refetch]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (refetchTimeoutRef.current) {
        clearTimeout(refetchTimeoutRef.current);
      }
    };
  }, []);

  const handleToggleLike = async (postId: string) => {
    if (!user?.id) return;
    
    try {
      // Optimistic update - immediately update cache
      const currentCache = client.readQuery({ query: require('../../gql/generated').GetPostsDocument });
      if (currentCache?.posts) {
        const updatedPosts = currentCache.posts.map((post: any) => {
          if (post._id === postId) {
            const isLiked = post.likes.includes(user.id);
            return {
              ...post,
              likes: isLiked 
                ? post.likes.filter((id: string) => id !== user.id)
                : [...post.likes, user.id]
            };
          }
          return post;
        });
        
        client.writeQuery({
          query: require('../../gql/generated').GetPostsDocument,
          data: { posts: updatedPosts }
        });
      }
      
      // API call in background - if it fails, next poll will correct the cache
      await postService.toggleLike(postId);
    } catch (error) {
      console.error('Error toggling like:', error);
      showToast('Failed to update like', 'error');
      // Let next poll correct any optimistic update inconsistencies
    }
  };

  const handleCommentAdded = async (postId: string, comment: any) => {
    // Use debounced refetch to prevent rapid requests
    debouncedRefetch();
  };

  const handleCommentDeleted = async (postId: string, commentId: string) => {
    // Use debounced refetch to prevent rapid requests
    debouncedRefetch();
  };

  const handlePostDeleted = async (postId: string) => {
    try {
      await postService.deletePost(postId);
      showToast('Post deleted successfully', 'success');
      debouncedRefetch();
    } catch (error) {
      console.error('Error deleting post:', error);
      showToast('Failed to delete post', 'error');
    }
  };

  if (loading) return (
    <div className="feed-loading">
      <div className="spinner"></div>
    </div>
  );
  
  if (error) {
    return (
      <div className="feed-error">
        <p>Error loading posts</p>
        <p style={{ fontSize: '12px', color: '#666' }}>{error.message}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }
  
  if (!data?.posts.length) {
    return (
      <div className="feed-empty">
        <h2>Welcome to Passport Buddy</h2>
        <p>No posts yet. Be the first to share your journey!</p>
      </div>
    );
  }

  return (
    <div className="feed-container">
      <div className="feed-posts">
        {data.posts.map((post: any) => (
          <PostCard 
            key={post._id} 
            post={post} 
            currentUserId={user?.id}
            onToggleLike={handleToggleLike}
            onCommentAdded={handleCommentAdded}
            onCommentDeleted={handleCommentDeleted}
            onPostDeleted={handlePostDeleted}
          />
        ))}
      </div>
    </div>
  );
}