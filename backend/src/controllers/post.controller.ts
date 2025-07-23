// File: /api/src/controllers/post.controller.ts

import { Request, Response } from 'express';
import Post from '../models/Post';
import { storageService } from '../services/storage.service';
import mongoose from 'mongoose';
import { notificationService } from '../services/notification.service';
import { socketService } from '../services/socket.service';

export const createPost = async (req: Request, res: Response) => {
  try {
    console.log('--- CREATE POST REQUEST ---');
    console.log('Request body:', req.body);
    console.log('Request userId:', req.userId);
    console.log('Uploaded images:', req.uploadedImages);
    console.log('Uploaded videos:', req.uploadedVideos);
    
    const { content, location, videoSettings } = req.body;

    // Allow posts with just images/videos/location (no content required)
    const hasContent = content && content.trim().length > 0;
    const hasMedia = (req.uploadedImages && req.uploadedImages.length > 0) || (req.uploadedVideos && req.uploadedVideos.length > 0);
    const hasLocation = !!location;
    
    if (!hasContent && !hasMedia && !hasLocation) {
      return res.status(400).json({ message: 'Post must have content, media, or location' });
    }

    // Parse location data if provided
    let locationData = null;
    if (location) {
      try {
        locationData = typeof location === 'string' ? JSON.parse(location) : location;
        console.log('📍 POST: Location data parsed:', locationData);
      } catch (error) {
        console.error('❌ POST: Failed to parse location data:', error);
      }
    }

    // Parse video settings if provided
    let videoSettingsData = null;
    if (videoSettings) {
      try {
        videoSettingsData = typeof videoSettings === 'string' ? JSON.parse(videoSettings) : videoSettings;
        console.log('🎬 POST: Video settings parsed:', videoSettingsData);
      } catch (error) {
        console.error('❌ POST: Failed to parse video settings:', error);
      }
    }

    // Create post with media and location if uploaded
    const postData = {
      author: req.userId, // Add the authenticated user as author
      content,
      images: req.uploadedImages || [],
      videos: req.uploadedVideos || [],
      location: locationData,
      videoSettings: videoSettingsData,
    };

    const newPost = new Post(postData);
    await newPost.save();

    // Populate author info for the response
    await newPost.populate('author', 'username fullName avatar');

    // Notify followers of new post
    await notificationService.notifyFollowersOfNewPost(req.userId!, newPost._id.toString());

    res.status(201).json(newPost);

  } catch (error) {
    // Enhanced error logging to help us see the crash
    console.error('--- CONTROLLER CRASH ---');
    console.error(error); // Log the full error object
    
    // Clean up uploaded images if post creation fails
    if (req.uploadedImages) {
      for (const image of req.uploadedImages) {
        try {
          await storageService.delete(image.key);
        } catch (deleteError) {
          console.error('Failed to delete uploaded image:', deleteError);
        }
      }
    }
    
    res.status(500).json({
      message: 'Server error in createPost',
      // Only send the error message in the response for security
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
};

// getPosts with populated comments and blocked user filtering
export const getPosts = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.userId;
    
    // If no auth, just return all posts (public view)
    if (!currentUserId) {
      console.log('🌐 GETPOSTS: No authentication - returning public posts');
      const posts = await Post.find()
        .populate('author', 'username fullName avatar')
        .populate('comments.author', 'username fullName avatar')
        .sort({ createdAt: -1 });
      return res.status(200).json({
        status: 'success',
        data: {
          posts
        }
      });
    }

    console.log('🚀 GETPOSTS: Fetching posts for authenticated user:', currentUserId);

    // Get current user's blocked users list
    const User = require('../models/User');
    const currentUser = await User.findById(currentUserId).select('blockedUsers');
    const blockedUserIds = currentUser?.blockedUsers || [];

    // Also get users who have blocked the current user
    const usersWhoBlockedMe = await User.find(
      { blockedUsers: currentUserId },
      { _id: 1 }
    );
    const usersWhoBlockedMeIds = usersWhoBlockedMe.map((user: any) => user._id);

    // Combine both lists - exclude posts from users I blocked OR users who blocked me
    const allBlockedUserIds = [...blockedUserIds, ...usersWhoBlockedMeIds];

    console.log('🚫 GETPOSTS: Blocked users:', {
      iBlocked: blockedUserIds.length,
      blockedMe: usersWhoBlockedMeIds.length,
      total: allBlockedUserIds.length,
      blockedUserIds: allBlockedUserIds.map(id => id.toString())
    });

    const posts = await Post.find({
      author: { $nin: allBlockedUserIds } // Exclude posts from blocked users
    })
      .populate('author', 'username fullName avatar')
      .populate('comments.author', 'username fullName avatar')
      .sort({ createdAt: -1 });

    console.log('📊 GETPOSTS: Returning', posts.length, 'posts after blocking filter');
    console.log('📝 GETPOSTS: Post authors:', posts.map(p => ({ 
      id: (p.author as any)?._id?.toString(), 
      username: (p.author as any)?.username 
    })));

    // Return in format matching your example
    res.status(200).json({
      status: 'success',
      data: {
        posts
      }
    });
  } catch (error) {
    console.error('--- CONTROLLER CRASH ---');
    console.error(error);
    res.status(500).json({
      message: 'Server error in getPosts',
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
};

export const likeOrDislikePost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User not authenticated'
      });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found'
      });
    }

    // Use MongoDB's atomic operations to toggle like in a single query
    const isLiked = post.likes.some((likeId: any) => likeId.toString() === userId);
    
    const update = isLiked 
      ? { $pull: { likes: userId } }
      : { $addToSet: { likes: userId } };
    
    const updatedPost = await Post.findByIdAndUpdate(id, update, { new: true });

    // Create notification if liked (not for own posts)
    if (!isLiked && post.author.toString() !== userId) {
      await notificationService.createNotification({
        recipientId: post.author.toString(),
        senderId: userId,
        type: 'like',
        entityId: id,
        entityType: 'post'
      });
    }

    // Emit real-time update
    socketService.emitPostUpdate(id, 'like', {
      userId,
      liked: !isLiked,
      likesCount: updatedPost?.likes.length || 0
    });

    return res.status(200).json({
      status: 'success',
      message: isLiked ? 'Post unliked successfully' : 'Post liked successfully',
      liked: !isLiked
    });
  } catch (error) {
    console.error('Error in likeOrDislikePost:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error in likeOrDislikePost',
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
};

export const addComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User not authenticated'
      });
    }

    if (!content || content.trim() === '') {
      return res.status(400).json({
        status: 'error',
        message: 'Comment content is required'
      });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found'
      });
    }

    const newComment = {
      author: userId,
      content: content.trim(),
      createdAt: new Date()
    };

    post.comments.push(newComment as any);
    await post.save();

    // Populate the author details for the response
    await post.populate('comments.author', 'username fullName avatar');

    const addedComment = post.comments[post.comments.length - 1];

    // Create notification if commenting on someone else's post
    if (post.author.toString() !== userId) {
      await notificationService.createNotification({
        recipientId: post.author.toString(),
        senderId: userId,
        type: 'comment',
        entityId: id,
        entityType: 'post'
      });
    }

    // Emit real-time update
    socketService.emitPostUpdate(id, 'comment', {
      comment: addedComment,
      commentsCount: post.comments.length
    });

    return res.status(201).json({
      status: 'success',
      message: 'Comment added successfully',
      comment: addedComment
    });
  } catch (error) {
    console.error('Error in addComment:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error in addComment',
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
};

export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { id, commentId } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User not authenticated'
      });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found'
      });
    }

    const commentIndex = post.comments.findIndex(
      (comment: any) => comment._id?.toString() === commentId
    );

    if (commentIndex === -1) {
      return res.status(404).json({
        status: 'error',
        message: 'Comment not found'
      });
    }

    // Check if the user is the author of the comment or the post
    const comment = post.comments[commentIndex];
    if (comment.author.toString() !== userId && post.author.toString() !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this comment'
      });
    }

    post.comments.splice(commentIndex, 1);
    await post.save();

    return res.status(200).json({
      status: 'success',
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteComment:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error in deleteComment',
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
};

export const deletePost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User not authenticated'
      });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found'
      });
    }

    // Check if the user is the author of the post
    if (post.author.toString() !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this post'
      });
    }

    // Delete associated images from storage
    if (post.images && post.images.length > 0) {
      for (const image of post.images) {
        try {
          await storageService.delete(image.key);
        } catch (deleteError) {
          console.error('Failed to delete image:', deleteError);
        }
      }
    }

    await Post.findByIdAndDelete(id);

    return res.status(200).json({
      status: 'success',
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Error in deletePost:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error in deletePost',
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
};

export const toggleBookmark = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ status: 'error', message: 'Post not found' });
    }

    const bookmarkIndex = post.bookmarks.findIndex((id: any) => id.toString() === userId);
    
    if (bookmarkIndex > -1) {
      // Remove bookmark
      post.bookmarks.splice(bookmarkIndex, 1);
    } else {
      // Add bookmark
      post.bookmarks.push(userId as any);
    }

    await post.save();

    return res.json({
      status: 'success',
      message: bookmarkIndex > -1 ? 'Bookmark removed' : 'Bookmark added',
      isBookmarked: bookmarkIndex === -1
    });
  } catch (error) {
    console.error('Toggle bookmark error:', error);
    return res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

export const getBookmarkStatus = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ status: 'error', message: 'Post not found' });
    }

    const isBookmarked = post.bookmarks.some((id: any) => id.toString() === userId);

    return res.json({
      status: 'success',
      isBookmarked
    });
  } catch (error) {
    console.error('Get bookmark status error:', error);
    return res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

export const getBookmarkedPosts = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    const posts = await Post.find({ bookmarks: userId })
      .populate('author', 'username fullName avatar')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'username fullName avatar'
        }
      })
      .sort({ createdAt: -1 });

    return res.json({
      status: 'success',
      posts
    });
  } catch (error) {
    console.error('Get bookmarked posts error:', error);
    return res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

export const getUserPosts = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const posts = await Post.find({ author: userId })
      .populate('author', 'username fullName avatar')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'username fullName avatar'
        }
      })
      .sort({ createdAt: -1 });

    return res.json({
      status: 'success',
      data: {
        posts
      }
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    return res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

export const incrementVideoViews = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    console.log('📊 VIDEO_ANALYTICS: Incrementing views for post', id);

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found'
      });
    }

    if (!post.videos || post.videos.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Post does not contain videos'
      });
    }

    // Increment views for the first video (assuming one video per post)
    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { $inc: { 'videos.0.views': 1 } },
      { new: true }
    );

    const newViewCount = updatedPost?.videos[0]?.views || 0;

    console.log('✅ VIDEO_ANALYTICS: Views incremented to', newViewCount);

    return res.status(200).json({
      status: 'success',
      views: newViewCount
    });
  } catch (error) {
    console.error('Error in incrementVideoViews:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error in incrementVideoViews',
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
};