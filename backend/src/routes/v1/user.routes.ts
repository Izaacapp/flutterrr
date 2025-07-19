import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { updateProfile, getProfile, uploadAvatar } from '../../controllers/user.controller';
import { uploadAvatar as uploadAvatarMiddleware, processAndUploadAvatar } from '../../middleware/upload.middleware';

const router = Router();

// Update profile (including avatar)
router.patch('/profile', authenticate, updateProfile);

// Upload avatar
router.post('/avatar', authenticate, uploadAvatarMiddleware, processAndUploadAvatar, uploadAvatar);

// Get profile
router.get('/profile/:userId?', authenticate, getProfile);

export default router;