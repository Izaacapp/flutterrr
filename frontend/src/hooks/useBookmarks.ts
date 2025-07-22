import { useState, useCallback } from 'react';
import BookmarkService from '../services/bookmark.service';

interface UseBookmarksReturn {
  bookmarkPost: (postId: string) => Promise<boolean>;
  unbookmarkPost: (postId: string) => Promise<boolean>;
  isBookmarked: (postId: string) => boolean;
  bookmarkedPosts: Set<string>;
  toggleBookmark: (postId: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export const useBookmarks = (): UseBookmarksReturn => {
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bookmarkPost = useCallback(async (postId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await BookmarkService.bookmarkPost(postId);
      
      if (response.status === 'success') {
        setBookmarkedPosts(prev => new Set([...prev, postId]));
        return true;
      } else {
        setError(response.message || 'Failed to bookmark post');
        return false;
      }
    } catch (error) {
      console.error('Bookmark error:', error);
      setError('Network error');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const unbookmarkPost = useCallback(async (postId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await BookmarkService.unbookmarkPost(postId);
      
      if (response.status === 'success') {
        setBookmarkedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
        return true;
      } else {
        setError(response.message || 'Failed to remove bookmark');
        return false;
      }
    } catch (error) {
      console.error('Unbookmark error:', error);
      setError('Network error');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleBookmark = useCallback(async (postId: string): Promise<boolean> => {
    if (bookmarkedPosts.has(postId)) {
      return await unbookmarkPost(postId);
    } else {
      return await bookmarkPost(postId);
    }
  }, [bookmarkedPosts, bookmarkPost, unbookmarkPost]);

  const isBookmarked = useCallback((postId: string): boolean => {
    return bookmarkedPosts.has(postId);
  }, [bookmarkedPosts]);

  return {
    bookmarkPost,
    unbookmarkPost,
    isBookmarked,
    bookmarkedPosts,
    toggleBookmark,
    loading,
    error,
  };
};