// 1. Correct the import path and remove the unused `gql` tag
import { useGetPostsQuery } from '../../gql/generated';
import { PostCard } from './PostCard';
import { useAuth } from '../../contexts/AuthContext';
import postService from '../../services/post.service';
import './Feed.css';

export function Feed() {
  // 2. The generated `useGetPostsQuery` hook already knows which query to run
  const { loading, error, data, refetch } = useGetPostsQuery({
    pollInterval: 10000,
  });
  const { user } = useAuth();

  const handleToggleLike = async (postId: string) => {
    try {
      await postService.toggleLike(postId);
      refetch();
    } catch (error) {
      console.error('Error toggling like:', error);
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
          />
        ))}
      </div>
    </div>
  );
}