import mongoose from 'mongoose';
import User from '../models/User';
import Post from '../models/Post';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/passport_buddy';

async function createSimplePosts() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ username: 'beck1' });
    if (!user) {
      console.log('User beck1 not found');
      return;
    }

    // Clear existing posts
    await Post.deleteMany({ author: user._id });

    // Create simple posts without the problematic likes field
    const simplePosts = [
      {
        content: "Just landed in Tokyo! 🇯🇵 The flight was incredible and the city lights from above were breathtaking. Ready to explore!",
        author: user._id,
        images: [],
        videos: [],
        likes: [], // Empty array of ObjectIds
        comments: [],
        location: {
          name: "Tokyo, Japan",
          latitude: 35.6762,
          longitude: 139.6503
        },
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        content: "My boarding pass collection is growing! ✈️ Nothing beats the excitement of a new adventure. Where should I go next?",
        author: user._id,
        images: [],
        videos: [],
        likes: [],
        comments: [],
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000)
      },
      {
        content: "Airport lounges hit different when you're traveling solo 🧳 Perfect time to plan the next destination. Thinking about New Zealand!",
        author: user._id,
        images: [],
        videos: [],
        likes: [],
        comments: [],
        location: {
          name: "JFK Airport, New York",
          latitude: 40.6413,
          longitude: -73.7781
        },
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000)
      }
    ];

    const createdPosts = await Post.insertMany(simplePosts);
    console.log(`✅ Created ${createdPosts.length} posts successfully!`);
    
    // Verify posts were created
    const allPosts = await Post.find().populate('author', 'username');
    console.log(`📄 Total posts in database: ${allPosts.length}`);
    
    allPosts.forEach(post => {
      console.log(`- "${post.content.substring(0, 50)}..." by ${(post.author as any).username}`);
    });

  } catch (error) {
    console.error('Error creating posts:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createSimplePosts();