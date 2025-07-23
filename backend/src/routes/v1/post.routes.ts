import { Router } from 'express';
import { 
  createPost, 
  getPosts, 
  likeOrDislikePost, 
  addComment, 
  deleteComment, 
  deletePost, 
  incrementVideoViews,
  toggleBookmark,
  getBookmarkStatus,
  getBookmarkedPosts,
  getUserPosts
} from '../../controllers/post.controller';
import { validate, requestSchema } from '../../middleware/validation.middleware';
import { uploadMedia, processAndUploadMedia } from '../../middleware/upload.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { createPostSchema } from '@my-app/shared';

const router = Router();

// Updated route to handle both images and videos with location
router.post(
  '/', 
  authenticate, // Require authentication
  uploadMedia, // Handle multipart form data (images + videos)
  processAndUploadMedia, // Process and upload media files
  // validate(requestSchema(createPostSchema)), // Validate text content - temporarily disabled
  createPost
);

router.get('/', getPosts); // Keep public but handle auth optionally
router.get('/all', getPosts); // Alias for the same endpoint to match your example

// Like/unlike endpoint
router.post('/:id/like', authenticate, likeOrDislikePost);

// Comment endpoints
router.post('/:id/comment', authenticate, addComment);
router.delete('/:id/comment/:commentId', authenticate, deleteComment);

// Delete post endpoint
router.delete('/:id', authenticate, deletePost);

// Video analytics endpoint
router.post('/:id/video/view', incrementVideoViews);

// Bookmark endpoints
router.post('/:postId/bookmark', authenticate, toggleBookmark);
router.get('/:postId/bookmark/status', authenticate, getBookmarkStatus);
router.get('/bookmarked', authenticate, getBookmarkedPosts);

// User posts endpoint
router.get('/user/:userId', getUserPosts);

export default router;