import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { updateProfile, getProfile, uploadAvatar, getProfileByUsername, followUser, unfollowUser, blockUser, unblockUser } from '../../controllers/user.controller';
import { uploadAvatar as uploadAvatarMiddleware, processAndUploadAvatar } from '../../middleware/upload.middleware';

const router = Router();

// Update profile (including avatar)
router.patch('/profile', authenticate, updateProfile);

// Upload avatar
router.post('/avatar', authenticate, uploadAvatarMiddleware, processAndUploadAvatar, uploadAvatar);

// Get profile by username
router.get('/profile/:username', authenticate, getProfileByUsername);

// Follow/unfollow user
router.post('/follow/:userId', authenticate, followUser);
router.delete('/follow/:userId', authenticate, unfollowUser);

// Block/unblock user
router.post('/block/:userId', authenticate, blockUser);
router.delete('/block/:userId', authenticate, unblockUser);

// Get profile by ID
router.get('/profile/:userId?', authenticate, getProfile);

export default router;