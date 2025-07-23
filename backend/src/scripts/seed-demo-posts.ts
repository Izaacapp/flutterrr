import mongoose from 'mongoose';
import User from '../models/User';
import Post from '../models/Post';
import { env } from '../config/env';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/passport_buddy';

async function seedDemoPosts() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find your user
    const user = await User.findOne({ username: 'beck1' });
    if (!user) {
      console.log('User beck1 not found');
      return;
    }

    // Create some demo posts
    const demoPosts = [
      {
        content: "Just landed in Tokyo! 🇯🇵 The flight was incredible and the city lights from above were breathtaking. Ready to explore!",
        author: user._id,
        location: {
          name: "Tokyo, Japan",
          latitude: 35.6762,
          longitude: 139.6503
        },
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        likes: Math.floor(Math.random() * 50),
        comments: []
      },
      {
        content: "My boarding pass collection is growing! ✈️ Nothing beats the excitement of a new adventure. Where should I go next?",
        author: user._id,
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
        likes: Math.floor(Math.random() * 30),
        comments: []
      },
      {
        content: "Airport lounges hit different when you're traveling solo 🧳 Perfect time to plan the next destination. Thinking about New Zealand!",
        author: user._id,
        location: {
          name: "JFK Airport, New York",
          latitude: 40.6413,
          longitude: -73.7781
        },
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
        likes: Math.floor(Math.random() * 25),
        comments: []
      },
      {
        content: "Flight delayed but the sunset view from the terminal is unreal 🌅 Sometimes the journey is just as beautiful as the destination",
        author: user._id,
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        likes: Math.floor(Math.random() * 40),
        comments: []
      },
      {
        content: "Mile high club... of coffee drinkers ☕ Third cup at 35,000 feet. The wifi up here is surprisingly good!",
        author: user._id,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        likes: Math.floor(Math.random() * 60),
        comments: []
      }
    ];

    // Clear existing posts for this user
    await Post.deleteMany({ author: user._id });

    // Insert demo posts
    const createdPosts = await Post.insertMany(demoPosts);
    console.log(`✅ Created ${createdPosts.length} demo posts for ${user.username}`);

    console.log('Demo posts created successfully!');
  } catch (error) {
    console.error('Error seeding demo posts:', error);
  } finally {
    await mongoose.disconnect();
  }
}

seedDemoPosts();