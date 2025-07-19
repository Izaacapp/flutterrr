import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import sharp from 'sharp';
import { env } from '../config/env';
import { v4 as uuidv4 } from 'uuid';

const unlinkAsync = promisify(fs.unlink);
const mkdirAsync = promisify(fs.mkdir);

export interface StorageFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer?: Buffer;
  size: number;
  filename?: string;
  path?: string;
}

export interface UploadResult {
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

export interface UploadOptions {
  generateVariants?: boolean;
  folder?: string;
}

abstract class StorageService {
  abstract upload(file: StorageFile, options?: UploadOptions): Promise<UploadResult>;
  abstract delete(key: string): Promise<void>;
  abstract getUrl(key: string): string;
  
  // Image size presets for social media
  protected readonly IMAGE_SIZES = {
    thumbnail: { width: 150, height: 150 },
    small: { width: 300, height: 300 },
    medium: { width: 600, height: 600 },
    large: { width: 1200, height: 1200 }
  };
}

class LocalStorageService extends StorageService {
  private uploadDir: string;
  private baseUrl: string;

  constructor() {
    super();
    this.uploadDir = path.resolve(env.UPLOAD_DIR);
    this.baseUrl = env.UPLOAD_URL;
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await mkdirAsync(this.uploadDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create upload directory:', error);
    }
  }

  async upload(file: StorageFile, options: UploadOptions = {}): Promise<UploadResult> {
    const { generateVariants = false, folder = '' } = options;
    const fileId = uuidv4();
    const ext = path.extname(file.originalname);
    const baseFilename = `${fileId}`;
    
    if (generateVariants && file.mimetype.startsWith('image/')) {
      // Generate multiple sizes for images
      const variants: any = {};
      
      // Original
      const originalFilename = `${baseFilename}_original${ext}`;
      const originalPath = path.join(this.uploadDir, folder, originalFilename);
      await this.ensureDir(path.dirname(originalPath));
      await fs.promises.writeFile(originalPath, file.buffer!);
      variants.original = `${this.baseUrl}/${folder}/${originalFilename}`;
      
      // Generate variants
      for (const [sizeName, dimensions] of Object.entries(this.IMAGE_SIZES)) {
        try {
          const resizedBuffer = await sharp(file.buffer!)
            .resize(dimensions.width, dimensions.height, {
              fit: 'cover',
              position: 'center'
            })
            .jpeg({ quality: 85, progressive: true })
            .toBuffer();
          
          const variantFilename = `${baseFilename}_${sizeName}.jpg`;
          const variantPath = path.join(this.uploadDir, folder, variantFilename);
          await fs.promises.writeFile(variantPath, resizedBuffer);
          variants[sizeName] = `${this.baseUrl}/${folder}/${variantFilename}`;
        } catch (error) {
          console.error(`Failed to create ${sizeName} variant:`, error);
        }
      }
      
      return {
        url: variants.medium || variants.original,
        key: baseFilename,
        size: file.size,
        mimetype: file.mimetype,
        variants
      };
    } else {
      // Single file upload
      const filename = `${baseFilename}${ext}`;
      const filepath = path.join(this.uploadDir, folder, filename);
      await this.ensureDir(path.dirname(filepath));
      await fs.promises.writeFile(filepath, file.buffer!);
      
      return {
        url: `${this.baseUrl}/${folder}/${filename}`,
        key: filename,
        size: file.size,
        mimetype: file.mimetype,
      };
    }
  }
  
  private async ensureDir(dir: string) {
    try {
      await mkdirAsync(dir, { recursive: true });
    } catch (error) {
      console.error('Failed to create directory:', error);
    }
  }

  async delete(key: string): Promise<void> {
    const filepath = path.join(this.uploadDir, key);
    try {
      await unlinkAsync(filepath);
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  }

  getUrl(key: string): string {
    return `${this.baseUrl}/${key}`;
  }
}

class DigitalOceanSpacesService extends StorageService {
  private s3Client: S3Client;
  private bucket: string;
  private endpoint: string;

  constructor() {
    super();
    
    if (!env.DO_SPACES_KEY || !env.DO_SPACES_SECRET || !env.DO_SPACES_BUCKET || !env.DO_SPACES_ENDPOINT) {
      throw new Error('DigitalOcean Spaces configuration is incomplete');
    }

    this.bucket = env.DO_SPACES_BUCKET;
    this.endpoint = `https://${env.DO_SPACES_ENDPOINT}`;

    this.s3Client = new S3Client({
      endpoint: this.endpoint,
      region: env.DO_SPACES_REGION || 'us-east-1',
      credentials: {
        accessKeyId: env.DO_SPACES_KEY,
        secretAccessKey: env.DO_SPACES_SECRET,
      },
    });
  }

  async upload(file: StorageFile, options: UploadOptions = {}): Promise<UploadResult> {
    const { generateVariants = false, folder = 'posts' } = options;
    const fileId = uuidv4();
    const ext = path.extname(file.originalname);
    const baseKey = `${folder}/${fileId}`;
    
    if (generateVariants && file.mimetype.startsWith('image/')) {
      // Generate multiple sizes for social media
      const variants: any = {};
      const uploadPromises = [];
      
      // Upload original
      const originalKey = `${baseKey}_original${ext}`;
      uploadPromises.push(
        this.s3Client.send(new PutObjectCommand({
          Bucket: this.bucket,
          Key: originalKey,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: 'public-read',
          CacheControl: 'public, max-age=31536000',
          Metadata: {
            originalName: file.originalname
          }
        })).then(() => {
          variants.original = this.getUrl(originalKey);
        })
      );
      
      // Generate and upload variants
      for (const [sizeName, dimensions] of Object.entries(this.IMAGE_SIZES)) {
        uploadPromises.push(
          sharp(file.buffer!)
            .resize(dimensions.width, dimensions.height, {
              fit: 'cover',
              position: 'center'
            })
            .jpeg({ quality: 85, progressive: true })
            .toBuffer()
            .then(resizedBuffer => {
              const variantKey = `${baseKey}_${sizeName}.jpg`;
              return this.s3Client.send(new PutObjectCommand({
                Bucket: this.bucket,
                Key: variantKey,
                Body: resizedBuffer,
                ContentType: 'image/jpeg',
                ACL: 'public-read',
                CacheControl: 'public, max-age=31536000'
              })).then(() => {
                variants[sizeName] = this.getUrl(variantKey);
              });
            })
            .catch(error => {
              console.error(`Failed to create ${sizeName} variant:`, error);
            })
        );
      }
      
      await Promise.all(uploadPromises);
      
      return {
        url: variants.medium || variants.original,
        key: baseKey,
        size: file.size,
        mimetype: file.mimetype,
        variants
      };
    } else {
      // Single file upload (videos, documents, etc.)
      const key = `${baseKey}${ext}`;
      
      await this.s3Client.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
        CacheControl: file.mimetype.startsWith('video/') ? 'public, max-age=31536000' : undefined,
        Metadata: {
          originalName: file.originalname
        }
      }));
      
      return {
        url: this.getUrl(key),
        key,
        size: file.size,
        mimetype: file.mimetype,
      };
    }
  }

  async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    try {
      await this.s3Client.send(command);
    } catch (error) {
      console.error('Failed to delete file from Spaces:', error);
    }
  }

  getUrl(key: string): string {
    // Use CDN URL for better performance
    const region = env.DO_SPACES_REGION || 'nyc3';
    return `https://${this.bucket}.${region}.cdn.digitaloceanspaces.com/${key}`;
  }
}

// Factory function to create the appropriate storage service
export function createStorageService(): StorageService {
  if (env.STORAGE_TYPE === 'spaces') {
    return new DigitalOceanSpacesService();
  }
  return new LocalStorageService();
}

// Export a singleton instance
export const storageService = createStorageService();