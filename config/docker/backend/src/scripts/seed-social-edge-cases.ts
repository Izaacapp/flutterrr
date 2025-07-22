import { strictDateExtraction } from "../utils/dateStrict";
import { safeStrictDateExtraction } from "../utils/dateStrict";
import mongoose from 'mongoose';
import User from '../models/User';
import Post from '../models/Post';
import { storageService } from '../services/storage.service';
import dotenv from 'dotenv';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://root:pass@localhost:27017/devdb?authSource=admin';

// Edge case test users
const edgeCaseUsers = [
  {
    username: 'unicode_user_🌍✈️',
    email: 'unicode@test.com',
    fullName: '测试用户 🌏',
    password: 'Test123!',
    bio: 'Testing unicode in bio: 你好世界 🌍 مرحبا بالعالم こんにちは世界',
    location: 'Tokyo 東京',
    homeAirport: 'NRT',
    passportCountry: 'Japan',
    emailVerified: true
  },
  {
    username: 'long_username_that_exceeds_normal_limits_123456789',
    email: 'longusername@test.com',
    fullName: 'User With Extremely Long Display Name That Tests UI Limits',
    password: 'Test123!',
    bio: 'This is a very long bio that tests the limits of our bio field. '.repeat(10),
    emailVerified: true
  },
  {
    username: 'empty_profile',
    email: 'empty@test.com',
    fullName: 'Empty Profile',
    password: 'Test123!',
    bio: '',
    location: '',
    homeAirport: '',
    passportCountry: '',
    milesFlown: 0,
    countriesVisited: [],
    emailVerified: true
  },
  {
    username: 'special-chars_user.2024',
    email: 'special.chars+test@example.com',
    fullName: "O'Brien-Smith, Jr. (PhD)",
    password: 'Test123!',
    bio: 'Testing special chars: <script>alert("xss")</script> & symbols like @#$%^&*()',
    emailVerified: true
  },
  {
    username: 'rtl_user',
    email: 'rtl@test.com',
    fullName: 'محمد أحمد',
    password: 'Test123!',
    bio: 'مرحبا بكم في ملفي الشخصي. أحب السفر حول العالم.',
    location: 'دبي',
    homeAirport: 'DXB',
    passportCountry: 'UAE',
    emailVerified: true
  },
  {
    username: 'unverified_user',
    email: 'unverified@test.com',
    fullName: 'Unverified User',
    password: 'Test123!',
    emailVerified: false,
    otp: '123456',
    otpExpires: new Date(Date.now() + 24 * 60 * 60 * 1000)
  },
  {
    username: 'max_countries_user',
    email: 'worldtraveler@test.com',
    fullName: 'World Traveler',
    password: 'Test123!',
    milesFlown: 999999999,
    countriesVisited: Array.from({ length: 195 }, (_, i) => `Country${i + 1}`),
    emailVerified: true
  }
];

// Edge case posts
const edgeCasePostContent = [
  // Empty content edge cases
  {
    content: '',
    expectError: true,
    description: 'Empty post content'
  },
  {
    content: '   ',
    expectError: true,
    description: 'Whitespace only content'
  },
  
  // Length edge cases
  {
    content: 'a',
    description: 'Single character post'
  },
  {
    content: 'This is a very long post that tests the maximum character limit. '.repeat(100),
    description: 'Very long post content'
  },
  
  // Special characters and injections
  {
    content: '<script>alert("XSS test")</script><img src=x onerror=alert("XSS")>',
    description: 'XSS attempt in post'
  },
  {
    content: "'; DROP TABLE posts; --",
    description: 'SQL injection attempt'
  },
  {
    content: '${process.env.JWT_SECRET}',
    description: 'Template injection attempt'
  },
  
  // Unicode and emoji edge cases
  {
    content: '🚀💯🔥✈️🌍🎉🎊🎈🎆🎇✨💫⭐🌟',
    description: 'Emoji overload'
  },
  {
    content: '👨‍👩‍👧‍👦👨‍👨‍👧‍👦👩‍👩‍👧‍👦',
    description: 'Complex emoji families'
  },
  {
    content: '这是一个中文帖子 🇨🇳 مرحبا こんにちは',
    description: 'Mixed languages and scripts'
  },
  {
    content: '‏‏‎ ‎',
    description: 'Zero-width spaces and RTL marks'
  },
  
  // Markdown and formatting
  {
    content: '# Heading\n## Subheading\n**Bold** *Italic* ~~Strikethrough~~\n```code block```',
    description: 'Markdown formatting'
  },
  {
    content: 'Check out this link: https://evil-site.com/phishing?param=<script>alert(1)</script>',
    description: 'URL with malicious parameters'
  },
  
  // Location edge cases
  {
    content: 'Testing location with special chars',
    location: {
      name: '<script>alert("location")</script>',
      lat: 999.999,
      lng: -999.999
    },
    description: 'XSS in location name'
  },
  {
    content: 'Testing invalid coordinates',
    location: {
      name: 'Invalid Location',
      lat: 200, // Invalid latitude
      lng: 400  // Invalid longitude
    },
    description: 'Invalid GPS coordinates'
  },
  
  // Hashtag and mention patterns
  {
    content: '#Travel #Adventure #TravelBlog #Wanderlust #TravelGram #InstaTravel #TravelPhotography #Exploring #TravelAddict #TravelDiaries',
    description: 'Multiple hashtags'
  },
  {
    content: '@user1 @user2 @user3 Check this out! @everyone @here @admin',
    description: 'Multiple mentions'
  },
  {
    content: '#'.repeat(100) + ' hashtag spam',
    description: 'Hashtag spam'
  },
  
  // Performance edge cases
  {
    content: 'Normal post',
    generateLikes: 1000,
    description: 'Post with 1000 likes'
  },
  {
    content: 'Popular post',
    generateComments: 500,
    description: 'Post with 500 comments'
  }
];

// Helper to generate fake image data
function generateFakeImageData(count: number = 1) {
  const images = [];
  const sizes = ['thumbnail', 'small', 'medium', 'large', 'original'];
  
  for (let i = 0; i < count; i++) {
    const baseKey = `posts/${uuidv4()}`;
    const variants: any = {};
    
    sizes.forEach(size => {
      if (process.env.STORAGE_TYPE === 'spaces') {
        const region = process.env.DO_SPACES_REGION || 'nyc3';
        const bucket = process.env.DO_SPACES_BUCKET || 'passportbuddy';
        variants[size] = `https://${bucket}.${region}.cdn.digitaloceanspaces.com/${baseKey}_${size}.jpg`;
      } else {
        variants[size] = `https://www.xbullet.me/uploads/${baseKey}_${size}.jpg`;
      }
    });
    
    images.push({
      url: variants.medium || variants.original,
      key: baseKey,
      size: Math.floor(Math.random() * 5000000) + 100000, // 100KB to 5MB
      mimetype: 'image/jpeg',
      variants
    });
  }
  
  return images;
}

async function seedSocialEdgeCases() {
  try {
    console.log('🧪 Starting social media edge case seed...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Create edge case users
    console.log('\n👥 Creating edge case users...');
    const createdUsers: any[] = [];
    
    for (const userData of edgeCaseUsers) {
      try {
        const user = await User.create(userData);
        createdUsers.push(user);
        console.log(`✅ Created edge case user: ${user.username}`);
      } catch (error: any) {
        console.log(`⚠️  Expected error for user ${userData.username}: ${error.message}`);
      }
    }

    // Create edge case posts
    console.log('\n📝 Creating edge case posts...');
    
    for (const postData of edgeCasePostContent) {
      if (postData.expectError) {
        try {
          await Post.create({
            content: postData.content,
            author: createdUsers[0]._id,
            images: []
          });
          console.log(`❌ Unexpected success for: ${postData.description}`);
        } catch (error) {
          console.log(`✅ Expected error for: ${postData.description}`);
        }
        continue;
      }
      
      const author = createdUsers[Math.floor(Math.random() * createdUsers.length)];
      const post: any = {
        content: postData.content,
        author: author._id,
        images: [],
        likes: [],
        comments: []
      };
      
      // Add location if specified
      if (postData.location) {
        post.location = postData.location;
      }
      
      // Add random images (0-10)
      const imageCount = Math.floor(Math.random() * 11);
      if (imageCount > 0) {
        post.images = generateFakeImageData(imageCount);
      }
      
      const createdPost = await Post.create(post);
      
      // Generate likes if specified
      if (postData.generateLikes) {
        // Create fake user IDs for likes (simulating many users)
        const fakeUserIds = Array.from({ length: postData.generateLikes }, () => new mongoose.Types.ObjectId());
        createdPost.likes = fakeUserIds as any;
      }
      
      // Generate comments if specified
      if (postData.generateComments) {
        const comments = [];
        for (let i = 0; i < postData.generateComments; i++) {
          comments.push({
            author: createdUsers[Math.floor(Math.random() * createdUsers.length)]._id,
            content: `Test comment #${i + 1}: ${Math.random() < 0.5 ? 'Great post!' : 'Amazing! 🎉'}`,
            createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
          });
        }
        createdPost.comments = comments;
      }
      
      await createdPost.save();
      console.log(`✅ Created edge case post: ${postData.description}`);
    }
    
    // Create posts with maximum images
    console.log('\n🖼️  Creating posts with many images...');
    const imageHeavyPost = await Post.create({
      content: 'Check out my travel photo collection! 📸',
      author: createdUsers[0]._id,
      images: generateFakeImageData(20), // 20 images
      likes: [],
      comments: []
    });
    console.log('✅ Created post with 20 images');
    
    // Create deeply nested comment threads
    console.log('\n💬 Creating posts with nested comments...');
    const commentPost = await Post.create({
      content: 'What\'s your favorite travel destination?',
      author: createdUsers[0]._id,
      images: [],
      likes: createdUsers.map(u => u._id),
      comments: []
    });
    
    // Add varied comments
    const commentPatterns = [
      'Just a normal comment',
      '❤️💕🥰 Love this!',
      'This is a very long comment that goes on and on. '.repeat(20),
      '@' + createdUsers[1].username + ' check this out!',
      'https://example.com/malicious-link?param=<script>alert(1)</script>',
      '```code block in comment```',
      ''
    ];
    
    for (const pattern of commentPatterns) {
      commentPost.comments.push({
        author: createdUsers[Math.floor(Math.random() * createdUsers.length)]._id,
        content: pattern,
        createdAt: strictDateExtraction()
      });
    }
    await commentPost.save();
    console.log('✅ Created post with varied comment patterns');
    
    console.log('\n📊 Edge Case Summary:');
    console.log('====================');
    console.log(`Users created: ${createdUsers.length}`);
    console.log(`Posts created: ${await Post.countDocuments()}`);
    console.log('\n🔑 Test Accounts:');
    console.log('- Unicode: unicode_user_🌍✈️ / Test123!');
    console.log('- Long name: long_username_that_exceeds_normal_limits_123456789 / Test123!');
    console.log('- Empty profile: empty_profile / Test123!');
    console.log('- Special chars: special-chars_user.2024 / Test123!');
    console.log('- RTL: rtl_user / Test123!');
    console.log('- Unverified: unverified_user / Test123! (OTP: 123456)');
    
    console.log('\n✅ Social media edge case seed completed!');
    
  } catch (error) {
    console.error('❌ Edge case seed failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the seed function
seedSocialEdgeCases();