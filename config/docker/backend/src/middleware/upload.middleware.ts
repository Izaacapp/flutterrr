import multer from 'multer';
import sharp from 'sharp';
import { Request, Response, NextFunction } from 'express';
import { storageService } from '../services/storage.service';

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('File upload attempt:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype
    });
    
    // Accept image, video files, and application/octet-stream (iOS sometimes sends this for images)
    if (file.mimetype.startsWith('image/') || 
        file.mimetype.startsWith('video/') || 
        file.mimetype === 'application/octet-stream') {
      cb(null, true);
    } else {
      console.error('File rejected - invalid MIME type:', file.mimetype);
      cb(new Error(`Only image and video files are allowed. Got: ${file.mimetype}`));
    }
  },
});

// Middleware to process and upload images
export const processAndUploadImages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.files || !Array.isArray(req.files)) {
      return next();
    }

    const uploadPromises = req.files.map(async (file) => {
      // For images, use variant generation
      const generateVariants = file.mimetype.startsWith('image/');
      
      // Upload to storage with social media optimizations
      const result = await storageService.upload(file, {
        generateVariants,
        folder: 'posts'
      });

      return result;
    });

    // Wait for all uploads to complete
    const uploadResults = await Promise.all(uploadPromises);
    
    // Attach results to request
    req.uploadedImages = uploadResults;
    
    next();
  } catch (error) {
    console.error('Image processing error:', error);
    res.status(400).json({ 
      message: 'Failed to process images',
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

// Middleware to process and upload avatar
export const processAndUploadAvatar = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No avatar file provided' });
    }

    // Upload avatar with variants for different UI contexts
    const result = await storageService.upload(req.file, {
      generateVariants: true,
      folder: 'avatars'
    });

    // Attach result to request
    req.uploadedAvatar = result;
    
    next();
  } catch (error) {
    console.error('Avatar processing error:', error);
    res.status(400).json({ 
      message: 'Failed to process avatar',
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

// Export configured multer middleware
export const uploadImages = upload.array('images', 5); // Max 5 images per post
export const uploadAvatar = upload.single('avatar'); // Single avatar image
export const uploadSingle = upload.single('file'); // Generic single file upload