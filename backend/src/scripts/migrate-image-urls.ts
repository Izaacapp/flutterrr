import { safeStrictDateExtraction } from "../utils/dateStrict";
import mongoose from 'mongoose';
import Post from '../models/Post';
import { env } from '../config/env';

async function migrateImageUrls() {
  try {
    // Connect to MongoDB
    await mongoose.connect(env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find all posts with localhost image URLs
    const posts = await Post.find({
      'images.url': { $regex: /http:\/\/localhost:3000\/uploads/ }
    });

    console.log(`Found ${posts.length} posts with localhost URLs`);

    // Update each post
    for (const post of posts) {
      let updated = false;
      
      // Update image URLs
      post.images = post.images.map(image => {
        if (image.url.includes('http://localhost:3000/uploads/')) {
          // Extract the path after /uploads/
          const path = image.url.replace('http://localhost:3000/uploads/', '');
          
          // If in production, use DigitalOcean Spaces URL
          if (env.STORAGE_TYPE === 'spaces') {
            // Convert to Spaces URL format
            const region = env.DO_SPACES_REGION || 'nyc3';
            const bucket = env.DO_SPACES_BUCKET || 'passportbuddy';
            image.url = `https://${bucket}.${region}.cdn.digitaloceanspaces.com/${path}`;
          } else {
            // Use the production URL
            image.url = `https://www.xbullet.me/uploads/${path}`;
          }
          updated = true;
        }
        return image;
      });

      if (updated) {
        await post.save();
        console.log(`Updated post ${post._id}`);
      }
    }

    console.log('Migration completed');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateImageUrls();