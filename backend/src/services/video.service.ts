import ffmpeg from 'fluent-ffmpeg';
import { storageService } from './storage.service';
import path from 'path';
import { Readable } from 'stream';

export interface VideoMetadata {
  duration: number;
  aspectRatio: number;
  hasAudio: boolean;
  thumbnailUrl?: string;
}

export class VideoService {
  async generateThumbnail(videoBuffer: Buffer, originalName: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const inputStream = new Readable();
      inputStream.push(videoBuffer);
      inputStream.push(null);

      const thumbnailChunks: Buffer[] = [];
      
      console.log('🎬 VIDEO_THUMBNAIL: Starting thumbnail generation for', originalName);
      
      ffmpeg()
        .input(inputStream)
        .inputFormat('mp4') // Assume mp4 format
        .seekInput(1) // Capture at 1 second
        .outputOptions([
          '-vframes 1',
          '-q:v 2', // High quality
          '-vf scale=640:360' // 16:9 aspect ratio thumbnail
        ])
        .format('mjpeg')
        .on('error', (err) => {
          console.error('❌ VIDEO_THUMBNAIL: FFmpeg error:', err);
          reject(new Error(`Thumbnail generation failed: ${err.message}`));
        })
        .on('end', async () => {
          try {
            console.log('✅ VIDEO_THUMBNAIL: Generation complete, uploading...');
            const thumbnailBuffer = Buffer.concat(thumbnailChunks);
            
            // Upload thumbnail to storage
            const thumbnailFile = {
              buffer: thumbnailBuffer,
              mimetype: 'image/jpeg',
              originalname: `${path.parse(originalName).name}_thumbnail.jpg`,
              size: thumbnailBuffer.length
            } as Express.Multer.File;
            
            const result = await storageService.upload(thumbnailFile, {
              generateVariants: false,
              folder: 'posts/video-thumbnails'
            });
            
            console.log('✅ VIDEO_THUMBNAIL: Uploaded to:', result.url);
            resolve(result.url);
          } catch (uploadError) {
            console.error('❌ VIDEO_THUMBNAIL: Upload failed:', uploadError);
            reject(uploadError);
          }
        })
        .pipe()
        .on('data', (chunk: Buffer) => {
          thumbnailChunks.push(chunk);
        });
    });
  }

  async extractMetadata(videoBuffer: Buffer): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      const inputStream = new Readable();
      inputStream.push(videoBuffer);
      inputStream.push(null);

      console.log('🎬 VIDEO_METADATA: Extracting video metadata');
      
      ffmpeg()
        .input(inputStream)
        .ffprobe((err, metadata) => {
          if (err) {
            console.error('❌ VIDEO_METADATA: FFprobe error:', err);
            reject(new Error(`Metadata extraction failed: ${err.message}`));
            return;
          }

          try {
            const videoStream = metadata.streams.find(s => s.codec_type === 'video');
            const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
            
            if (!videoStream) {
              throw new Error('No video stream found');
            }

            const duration = parseFloat(String(metadata.format.duration || '0'));
            const width = videoStream.width || 1;
            const height = videoStream.height || 1;
            const aspectRatio = width / height;
            const hasAudio = !!audioStream;

            console.log('✅ VIDEO_METADATA: Extracted:', {
              duration: `${duration}s`,
              aspectRatio: aspectRatio.toFixed(2),
              hasAudio,
              resolution: `${width}x${height}`
            });

            resolve({
              duration,
              aspectRatio,
              hasAudio
            });
          } catch (parseError) {
            console.error('❌ VIDEO_METADATA: Parse error:', parseError);
            reject(parseError);
          }
        });
    });
  }

  async processVideo(videoBuffer: Buffer, originalName: string): Promise<{
    thumbnailUrl: string;
    metadata: VideoMetadata;
  }> {
    console.log('🎬 VIDEO_PROCESS: Starting video processing for', originalName);
    
    try {
      // Generate thumbnail and extract metadata in parallel
      const [thumbnailUrl, metadata] = await Promise.all([
        this.generateThumbnail(videoBuffer, originalName),
        this.extractMetadata(videoBuffer)
      ]);

      console.log('✅ VIDEO_PROCESS: Processing complete');
      
      return {
        thumbnailUrl,
        metadata: {
          ...metadata,
          thumbnailUrl
        }
      };
    } catch (error) {
      console.error('❌ VIDEO_PROCESS: Processing failed:', error);
      throw error;
    }
  }
}

export const videoService = new VideoService();