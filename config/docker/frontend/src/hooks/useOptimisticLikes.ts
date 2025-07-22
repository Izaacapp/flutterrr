import { useState, useCallback } from 'react';
import { requestQueue } from '../utils/requestQueue';
import postService from '../services/post.service';
import { useToast } from '../contexts/ToastContext';

interface OptimisticLike {
  postId: string;
  isLiked: boolean;
  count: number;
  isPending: boolean;
}

export const useOptimisticLikes = (initialPosts: any[]) => {
  const [optimisticLikes, setOptimisticLikes] = useState<Map<string, OptimisticLike>>(new Map());
  const { showToast } = useToast();

  const toggleLike = useCallback(async (postId: string, currentLikes: string[], currentUserId: string) => {
    const isCurrentlyLiked = currentLikes.includes(currentUserId);
    const newIsLiked = !isCurrentlyLiked;
    const newCount = newIsLiked ? currentLikes.length + 1 : currentLikes.length - 1;

    // Optimistically update UI
    setOptimisticLikes(prev => {
      const newMap = new Map(prev);
      newMap.set(postId, {
        postId,
        isLiked: newIsLiked,
        count: newCount,
        isPending: true
      });
      return newMap;
    });

    try {
      // Queue the request with rate limiting
      await requestQueue.add(
        () => postService.toggleLike(postId),
        `like-${postId}`
      );

      // Update to confirmed state
      setOptimisticLikes(prev => {
        const newMap = new Map(prev);
        const current = newMap.get(postId);
        if (current) {
          newMap.set(postId, { ...current, isPending: false });
        }
        return newMap;
      });
    } catch (error: any) {
      // Revert optimistic update on failure
      setOptimisticLikes(prev => {
        const newMap = new Map(prev);
        newMap.delete(postId);
        return newMap;
      });

      if (error.message === 'Rate limit exceeded') {
        showToast('Slow down! Too many likes at once.', 'error');
      } else {
        showToast('Failed to update like. Please try again.', 'error');
      }
      
      throw error;
    }
  }, [showToast]);

  const getLikeState = useCallback((postId: string, originalLikes: string[], currentUserId: string) => {
    const optimistic = optimisticLikes.get(postId);
    
    if (optimistic) {
      return {
        isLiked: optimistic.isLiked,
        count: optimistic.count,
        isPending: optimistic.isPending
      };
    }

    return {
      isLiked: originalLikes.includes(currentUserId),
      count: originalLikes.length,
      isPending: false
    };
  }, [optimisticLikes]);

  const clearOptimisticState = useCallback(() => {
    setOptimisticLikes(new Map());
  }, []);

  return {
    toggleLike,
    getLikeState,
    clearOptimisticState
  };
};