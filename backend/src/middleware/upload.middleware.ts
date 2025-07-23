import multer from 'multer';
import sharp from 'sharp';
import { Request, Response, NextFunction } from 'express';
import { storageService } from '../services/storage.service';
import { videoService } from '../services/video.service';

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for videos
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

// Middleware to process and upload images and videos
export const processAndUploadMedia = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('🎬 UPLOAD_MIDDLEWARE: Received files:', req.files);
    console.log('🎬 UPLOAD_MIDDLEWARE: Request body:', req.body);

    if (!req.files) {
      console.log('🎬 UPLOAD_MIDDLEWARE: No files received, continuing');
      return next();
    }

    const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
    
    console.log('🎬 UPLOAD_MIDDLEWARE: Flattened files array:', files.length);
    
    if (files.length === 0) {
      return next();
    }

    // Separate images and videos
    const images = files.filter(file => file.mimetype.startsWith('image/'));
    const videos = files.filter(file => file.mimetype.startsWith('video/'));

    console.log('🎬 UPLOAD_MIDDLEWARE: Processing', images.length, 'images and', videos.length, 'videos');

    // Process images
    const imagePromises = images.map(async (file) => {
      const result = await storageService.upload(file, {
        generateVariants: true, // Generate thumbnails for images
        folder: 'posts/images'
      });
      return result;
    });

    // Process videos with thumbnail generation and metadata extraction
    const videoPromises = videos.map(async (file) => {
      console.log('🎬 UPLOAD_MIDDLEWARE: Processing video:', file.originalname);
      
      try {
        // Upload original video first
        const uploadResult = await storageService.upload(file, {
          generateVariants: false,
          folder: 'posts/videos'
        });
        
        // Try to process video (generate thumbnail + extract metadata)
        try {
          const { thumbnailUrl, metadata } = await videoService.processVideo(
            file.buffer, 
            file.originalname
          );
          
          console.log('✅ UPLOAD_MIDDLEWARE: Video processed with thumbnail:', thumbnailUrl);
          
          return {
            ...uploadResult,
            thumbnail: thumbnailUrl,
            duration: metadata.duration,
            aspectRatio: metadata.aspectRatio,
            hasAudio: metadata.hasAudio,
            views: 0
          };
        } catch (processingError) {
          console.warn('⚠️ UPLOAD_MIDDLEWARE: Video processing failed, using defaults:', (processingError as any).message);
          
          // Return basic video info without thumbnail/metadata
          return {
            ...uploadResult,
            thumbnail: '', // No thumbnail
            duration: 0,
            aspectRatio: 16/9, // Default aspect ratio
            hasAudio: true, // Assume has audio
            views: 0
          };
        }
      } catch (uploadError) {
        console.error('❌ UPLOAD_MIDDLEWARE: Video upload failed:', uploadError);
        throw uploadError;
      }
    });

    // Wait for all uploads to complete
    const [imageResults, videoResults] = await Promise.all([
      Promise.all(imagePromises),
      Promise.all(videoPromises)
    ]);
    
    // Attach results to request
    req.uploadedImages = imageResults;
    req.uploadedVideos = videoResults;
    
    console.log('✅ UPLOAD: Successfully processed media files');
    console.log('📸 Images:', imageResults.length);
    console.log('🎬 Videos:', videoResults.length);
    
    next();
  } catch (error) {
    console.error('❌ UPLOAD: Media processing error:', error);
    res.status(400).json({ 
      message: 'Failed to process media files',
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
export const uploadMedia = upload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'videos', maxCount: 1 } // Max 1 video per post for now
]);
export const uploadImages = upload.array('images', 5); // Max 5 images per post
export const uploadAvatar = upload.single('avatar'); // Single avatar image
export const uploadSingle = upload.single('file'); // Generic single file upload