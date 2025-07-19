// File: /api/src/controllers/post.controller.ts

import { Request, Response } from 'express';
import Post from '../models/Post';
import { storageService } from '../services/storage.service';

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

// getPosts remains the same
export const getPosts = async (req: Request, res: Response) => {
  try {
    const posts = await Post.find()
      .populate('author', 'username fullName avatar')
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

    const isLiked = post.likes.some(likeId => likeId.toString() === userId);

    if (isLiked) {
      await Post.findByIdAndUpdate(
        id,
        { $pull: { likes: userId } },
        { new: true }
      );

      return res.status(200).json({
        status: 'success',
        message: 'Post disliked successfully',
      });
    } else {
      await Post.findByIdAndUpdate(
        id,
        { $addToSet: { likes: userId } },
        { new: true }
      );
      return res.status(200).json({
        status: 'success',
        message: 'Post liked successfully',
      });
    }
  } catch (error) {
    console.error('Error in likeOrDislikePost:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error in likeOrDislikePost',
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
};