import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

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

export function RestFeed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [comment, setComment] = useState('');

  useEffect(() => {
    const getAllPosts = async () => {
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
        console.error('Error fetching posts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getAllPosts();
  }, []);

  const handleLikeDislike = async (postId: string) => {
    try {
      const token = localStorage.getItem('passport_buddy_token');
      const response = await fetch(`${API_BASE}/api/v1/posts/${postId}/like`, {
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
              if (post._id === postId) {
                const isLiked = post.likes.includes(user?.id || '');
                return {
                  ...post,
                  likes: isLiked 
                    ? post.likes.filter(id => id !== user?.id)
                    : [...post.likes, user?.id || '']
                };
              }
              return post;
            })
          );
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleComment = async (postId: string) => {
    if (!comment.trim()) return;
    
    try {
      const token = localStorage.getItem('passport_buddy_token');
      const response = await fetch(`${API_BASE}/api/v1/posts/${postId}/comment`, {
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
              if (post._id === postId) {
                return {
                  ...post,
                  comments: [...post.comments, result.comment]
                };
              }
              return post;
            })
          );
          setComment('');
        }
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

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
    <div className="mt-20 w-[70%] mx-auto">
      {posts.map((post) => (
        <div key={post._id} className="mt-8">
          <div className="flex items-center justify-between">
            {/* User info */}
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 bg-gray-300 rounded-full flex items-center justify-center">
                {post.author.avatar ? (
                  <img 
                    src={post.author.avatar} 
                    alt={post.author.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-semibold">
                    {post.author.fullName?.charAt(0) || post.author.username.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <h1>{post.author.username}</h1>
            </div>
          </div>

          {/* Images */}
          {post.images && post.images.length > 0 && (
            <div className="mt-2">
              <img
                src={post.images[0].url}
                alt="Post"
                className="w-full rounded-lg"
              />
            </div>
          )}

          {/* Actions */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <svg
                onClick={() => handleLikeDislike(post._id)}
                className={`cursor-pointer w-6 h-6 ${
                  user?.id && post.likes.includes(user.id)
                    ? "text-red-500 fill-current"
                    : "text-gray-700"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <svg
                className="cursor-pointer w-6 h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
          </div>

          <h1 className="mt-2 text-sm font-semibold">
            {post.likes.length} likes
          </h1>
          <p className="mt-2 font-medium">
            <span className="font-semibold">{post.author.username}</span> {post.content}
          </p>
          
          {/* Location */}
          {post.location && (
            <p className="text-sm text-gray-500 mt-1">📍 {post.location.name}</p>
          )}

          {/* Comments */}
          {post.comments.length > 0 && (
            <div className="mt-2">
              {post.comments.slice(0, 2).map((comment) => (
                <p key={comment._id} className="text-sm mt-1">
                  <span className="font-semibold">{comment.author.username}</span> {comment.content}
                </p>
              ))}
              {post.comments.length > 2 && (
                <p className="text-sm text-gray-500 mt-1">
                  View all {post.comments.length} comments
                </p>
              )}
            </div>
          )}

          {/* Add comment */}
          <div className="mt-2 flex items-center">
            <input
              type="text"
              placeholder="Add a comment..."
              className="flex-1 placeholder:text-gray-800 outline-none border-none bg-transparent"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleComment(post._id);
                }
              }}
            />
            <button
              className="text-sm font-semibold text-blue-700 cursor-pointer ml-2"
              onClick={() => handleComment(post._id)}
            >
              Post
            </button>
          </div>
          <div className="pb-6 border-b-2 border-gray-100 mt-4"></div>
        </div>
      ))}
    </div>
  );
}