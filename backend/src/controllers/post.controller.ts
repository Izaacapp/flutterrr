// File: /api/src/controllers/post.controller.ts

import { Request, Response } from 'express';
import Post from '../models/Post';
import User from '../models/User';
import { storageService } from '../services/storage.service';
import { NotificationService } from '../services/notification.service';
import mongoose from 'mongoose';

export const createPost = async (req: Request, res: Response) => {
  try {
    console.log('--- CREATE POST REQUEST ---');
    console.log('Request body:', req.body);
    console.log('Request userId:', req.userId);
    console.log('Uploaded images:', req.uploadedImages);
    
    const { content } = req.body;

    // Your original, working validation
    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    // Create post with images if uploaded
    const postData = {
      author: req.userId, // Add the authenticated user as author
      content,
      images: req.uploadedImages || [],
    };

    const newPost = new Post(postData);
    await newPost.save();
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

// getPosts with populated comments
export const getPosts = async (req: Request, res: Response) => {
  try {
    const posts = await Post.find()
      .populate('author', 'username fullName avatar')
      .populate('comments.author', 'username fullName avatar')
      .sort({ createdAt: -1 });
    res.status(200).json(posts);
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
    
    await Post.findByIdAndUpdate(id, update, { new: true });

    // Create notification for like (not for unlike)
    if (!isLiked && post.author.toString() !== userId) {
      try {
        const liker = await User.findById(userId).select('fullName username');
        if (liker) {
          await NotificationService.createLikeNotification(
            post.author.toString(),
            userId,
            id,
            liker
          );
        }
      } catch (notificationError) {
        console.error('Error creating like notification:', notificationError);
      }
    }

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

    // Create notification for comment (not for self-comments)
    if (post.author.toString() !== userId) {
      try {
        const commenter = await User.findById(userId).select('fullName username');
        if (commenter) {
          await NotificationService.createCommentNotification(
            post.author.toString(),
            userId,
            id,
            commenter
          );
        }
      } catch (notificationError) {
        console.error('Error creating comment notification:', notificationError);
      }
    }

    // Populate the author details for the response
    await post.populate('comments.author', 'username fullName avatar');

    const addedComment = post.comments[post.comments.length - 1];

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