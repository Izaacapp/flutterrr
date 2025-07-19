import { Router } from 'express';
import { createPost, getPosts, likeOrDislikePost } from '../../controllers/post.controller';
import { validate, requestSchema } from '../../middleware/validation.middleware';
import { uploadImages, processAndUploadImages } from '../../middleware/upload.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { createPostSchema } from '@my-app/shared';

const router = Router();

// Properly wrap your shared schema
router.post(
  '/', 
  authenticate, // Require authentication
  uploadImages, // Handle multipart form data
  processAndUploadImages, // Process and upload images
  // validate(requestSchema(createPostSchema)), // Validate text content - temporarily disabled
  createPost
);

router.get('/', getPosts); // Keep public for now

// Like/unlike endpoint
router.post('/:id/like', authenticate, likeOrDislikePost);

export default router;