// 1. Correct the import path and remove the unused `gql` tag
import { useGetPostsQuery } from '../../gql/generated';
import { PostCard } from './PostCard';
import { useAuth } from '../../contexts/AuthContext';
import postService from '../../services/post.service';
import { useToast } from '../../contexts/ToastContext';
import './Feed.css';

export function Feed() {
  // 2. The generated `useGetPostsQuery` hook already knows which query to run
  const { loading, error, data, refetch } = useGetPostsQuery({
    pollInterval: 10000,
    fetchPolicy: 'cache-and-network',
  });
  const { user } = useAuth();
  const { showToast } = useToast();

  const handleToggleLike = async (postId: string) => {
    if (!user?.id) return;
    
    try {
      await postService.toggleLike(postId);
      // Don't refetch immediately - let the 10s poll handle it
    } catch (error) {
      console.error('Error toggling like:', error);
      showToast('Failed to update like', 'error');
    }
  };

  const handleCommentAdded = async (postId: string, comment: any) => {
    // Refetch to get updated posts with new comment
    refetch();
  };

  const handleCommentDeleted = async (postId: string, commentId: string) => {
    // Refetch to get updated posts without deleted comment
    refetch();
  };

  const handlePostDeleted = async (postId: string) => {
    try {
      await postService.deletePost(postId);
      showToast('Post deleted successfully', 'success');
      refetch();
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