import { strictDateExtraction } from "../utils/dateStrict";
import { safeStrictDateExtraction } from "../utils/dateStrict";
import AWS from 'aws-sdk';
import sharp from 'sharp';
import { env } from '../config/env';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Image size presets for social media app
export const IMAGE_SIZES = {
  thumbnail: { width: 150, height: 150 },
  small: { width: 300, height: 300 },
  medium: { width: 600, height: 600 },
  large: { width: 1200, height: 1200 },
  original: null // Keep original size
};

export interface UploadedFile {
  url: string;
  key: string;
  size: number;
  mimetype: string;
  variants?: {
    thumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
    original: string;
  };
}

class SpacesService {
  private s3: AWS.S3 | null = null;
  private bucketName: string = '';
  private cdnUrl: string = '';

  constructor() {
    if (env.STORAGE_TYPE === 'spaces' && env.DO_SPACES_KEY && env.DO_SPACES_SECRET) {
      // Configure DigitalOcean Spaces (S3-compatible)
      this.s3 = new AWS.S3({
        endpoint: new AWS.Endpoint(env.DO_SPACES_ENDPOINT || ''),
        accessKeyId: env.DO_SPACES_KEY,
        secretAccessKey: env.DO_SPACES_SECRET,
        region: env.DO_SPACES_REGION || 'nyc3',
        s3ForcePathStyle: false,
        signatureVersion: 'v4'
      });
      
      this.bucketName = env.DO_SPACES_BUCKET || '';
      // CDN URL format: https://bucket-name.region.cdn.digitaloceanspaces.com
      const region = env.DO_SPACES_REGION || 'nyc3';
      this.cdnUrl = `https://${this.bucketName}.${region}.cdn.digitaloceanspaces.com`;
      
      console.log('✅ DigitalOcean Spaces configured');
      console.log(`📦 Bucket: ${this.bucketName}`);
      console.log(`🌐 CDN URL: ${this.cdnUrl}`);
    } else {
      console.log('📁 Using local file storage');
    }
  }

  /**
   * Process and upload image with multiple sizes for social media
   */
  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'uploads'
  ): Promise<UploadedFile> {
    if (!this.s3) {
      throw new Error('Spaces not configured. Check DO_SPACES environment variables.');
    }

    const fileId = uuidv4();
    const ext = path.extname(file.originalname);
    const baseKey = `${folder}/${fileId}`;
    
    const uploadedVariants: any = {};
    
    // Process and upload each size variant
    for (const [sizeName, dimensions] of Object.entries(IMAGE_SIZES)) {
      try {
        let processedBuffer: Buffer;
        let key: string;
        
        if (dimensions) {
          // Resize image
          processedBuffer = await sharp(file.buffer)
            .resize(dimensions.width, dimensions.height, {
              fit: 'cover',
              position: 'center'
            })
            .jpeg({ quality: 85, progressive: true })
            .toBuffer();
          
          key = `${baseKey}_${sizeName}.jpg`;
        } else {
          // Keep original
          processedBuffer = file.buffer;
          key = `${baseKey}_original${ext}`;
        }
        
        // Upload to Spaces
        const uploadParams: AWS.S3.PutObjectRequest = {
          Bucket: this.bucketName,
          Key: key,
          Body: processedBuffer,
          ACL: 'public-read',
          ContentType: dimensions ? 'image/jpeg' : file.mimetype,
          CacheControl: 'public, max-age=31536000', // 1 year cache
          Metadata: {
            originalName: file.originalname,
            uploadedAt: strictDateExtraction().toISOString()
          }
        };
        
        await this.s3.upload(uploadParams).promise();
        uploadedVariants[sizeName] = `${this.cdnUrl}/${key}`;
        
        console.log(`📸 Uploaded ${sizeName}: ${key}`);
      } catch (error) {
        console.error(`Failed to upload ${sizeName} variant:`, error);
      }
    }
    
    // Return URLs for all variants
    return {
      url: uploadedVariants.medium || uploadedVariants.original, // Default display size
      key: baseKey,
      size: file.size,
      mimetype: file.mimetype,
      variants: uploadedVariants
    };
  }

  /**
   * Upload video file (no processing for demo)
   */
  async uploadVideo(
    file: Express.Multer.File,
    folder: string = 'videos'
  ): Promise<UploadedFile> {
    if (!this.s3) {
      throw new Error('Spaces not configured. Check DO_SPACES environment variables.');
    }

    const fileId = uuidv4();
    const ext = path.extname(file.originalname);
    const key = `${folder}/${fileId}${ext}`;
    
    // For demo, upload video as-is
    const uploadParams: AWS.S3.PutObjectRequest = {
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ACL: 'public-read',
      ContentType: file.mimetype,
      CacheControl: 'public, max-age=31536000',
      Metadata: {
        originalName: file.originalname,
        uploadedAt: strictDateExtraction().toISOString()
      }
    };
    
    await this.s3.upload(uploadParams).promise();
    const url = `${this.cdnUrl}/${key}`;
    
    console.log(`🎥 Uploaded video: ${key}`);
    
    return {
      url,
      key,
      size: file.size,
      mimetype: file.mimetype
    };
  }

  /**
   * Upload any file type
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'files'
  ): Promise<UploadedFile> {
    if (!this.s3) {
      throw new Error('Spaces not configured. Check DO_SPACES environment variables.');
    }

    const fileId = uuidv4();
    const ext = path.extname(file.originalname);
    const key = `${folder}/${fileId}${ext}`;
    
    const uploadParams: AWS.S3.PutObjectRequest = {
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ACL: 'public-read',
      ContentType: file.mimetype,
      Metadata: {
        originalName: file.originalname,
        uploadedAt: strictDateExtraction().toISOString()
      }
    };
    
    await this.s3.upload(uploadParams).promise();
    const url = `${this.cdnUrl}/${key}`;
    
    console.log(`📄 Uploaded file: ${key}`);
    
    return {
      url,
      key,
      size: file.size,
      mimetype: file.mimetype
    };
  }

  /**
   * Delete file from Spaces
   */
  async deleteFile(key: string): Promise<void> {
    if (!this.s3) {
      throw new Error('Spaces not configured');
    }

    try {
      await this.s3.deleteObject({
        Bucket: this.bucketName,
        Key: key
      }).promise();
      
      console.log(`🗑️ Deleted: ${key}`);
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw error;
    }
  }

  /**
   * Delete multiple files (e.g., all image variants)
   */
  async deleteFiles(keys: string[]): Promise<void> {
    if (!this.s3) {
      throw new Error('Spaces not configured');
    }

    try {
      await this.s3.deleteObjects({
        Bucket: this.bucketName,
        Delete: {
          Objects: keys.map(Key => ({ Key }))
        }
      }).promise();
      
      console.log(`🗑️ Deleted ${keys.length} files`);
    } catch (error) {
      console.error('Failed to delete files:', error);
      throw error;
    }
  }

  /**
   * Get signed URL for private files (if needed)
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (!this.s3) {
      throw new Error('Spaces not configured');
    }

    return this.s3.getSignedUrlPromise('getObject', {
      Bucket: this.bucketName,
      Key: key,
      Expires: expiresIn
    });
  }

  /**
   * Check if Spaces is configured
   */
  isConfigured(): boolean {
    return this.s3 !== null;
  }

  /**
   * Get storage type
   */
  getStorageType(): string {
    return env.STORAGE_TYPE;
  }
}

export const spacesService = new SpacesService();