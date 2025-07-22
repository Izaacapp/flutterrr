import React from 'react';
import { useGetUserPostsQuery } from '../../gql/generated';
import { PostCard } from '../feed/PostCard';
import { useAuth } from '../../contexts/AuthContext';
import postService from '../../services/post.service';
import { useToast } from '../../contexts/ToastContext';

interface UserPostsFeedProps {
  userId: string;
}

export const UserPostsFeed: React.FC<UserPostsFeedProps> = ({ userId }) => {
  const { loading, error, data, refetch } = useGetUserPostsQuery({
    variables: { userId },
    fetchPolicy: 'cache-and-network',
  });
  const { user } = useAuth();
  const { showToast } = useToast();

  const handleToggleLike = async (postId: string) => {
    if (!user?.id) return;
    
    try {
      await postService.toggleLike(postId);
      refetch();
    } catch (error) {
      console.error('Error toggling like:', error);
      showToast('Failed to update like', 'error');
    }
  };

  const handleCommentAdded = async (postId: string, comment: any) => {
    refetch();
  };

  const handleCommentDeleted = async (postId: string, commentId: string) => {
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
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <div style={{ 
        width: '40px', 
        height: '40px', 
        border: '3px solid var(--pb-light-periwinkle)',
        borderTop: '3px solid var(--pb-medium-purple)',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto'
      }}></div>
    </div>
  );

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#dc3545' }}>
        <p>Error loading posts</p>
      </div>
    );
  }

  if (!data?.userPosts.length) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
        <p style={{ fontSize: '1.125rem' }}>No posts yet</p>
      </div>
    );
  }

  return (
    <div style={{ 
      marginTop: '1rem',
      maxWidth: '600px',
      margin: '1rem auto 0'
    }}>
      {data.userPosts.map((post: any) => (
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
  );
};