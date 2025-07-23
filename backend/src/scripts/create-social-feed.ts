import mongoose from 'mongoose';
import User from '../models/User';
import Post from '../models/Post';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/passport_buddy';

async function createSocialFeed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create additional demo users
    const demoUsers = [
      { username: 'sarah_travels', email: 'sarah@example.com', password: 'hashedpassword', fullName: 'Sarah Johnson' },
      { username: 'mike_explorer', email: 'mike@example.com', password: 'hashedpassword', fullName: 'Mike Chen' },
      { username: 'jenny_wanderer', email: 'jenny@example.com', password: 'hashedpassword', fullName: 'Jenny Rodriguez' },
      { username: 'alex_nomad', email: 'alex@example.com', password: 'hashedpassword', fullName: 'Alex Thompson' }
    ];

    const createdUsers = [];
    for (const userData of demoUsers) {
      let user = await User.findOne({ username: userData.username });
      if (!user) {
        user = await User.create(userData);
        console.log(`✅ Created user: ${user.username}`);
      }
      createdUsers.push(user);
    }

    // Clear existing posts
    await Post.deleteMany({});

    // Create diverse posts from multiple users
    const socialPosts = [
      {
        content: "Just landed in Bali! 🏝️ The rice terraces are even more beautiful than the photos. Can't wait to explore Ubud tomorrow!",
        author: createdUsers[0]._id,
        location: { name: "Bali, Indonesia", latitude: -8.3405, longitude: 115.0920 },
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
      },
      {
        content: "Mountain hiking in the Swiss Alps ⛰️ The view from 3000m is absolutely breathtaking. Worth every step of the climb!",
        author: createdUsers[1]._id,
        location: { name: "Swiss Alps, Switzerland", latitude: 46.5197, longitude: 8.2842 },
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
      },
      {
        content: "Airport coffee hits different at 5am ☕ Red-eye flight to Paris but so excited for this spontaneous weekend trip!",
        author: createdUsers[2]._id,
        location: { name: "LAX Airport", latitude: 33.9425, longitude: -118.4081 },
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
      },
      {
        content: "Street food in Bangkok is next level 🍜 This pad thai from a random cart is better than any restaurant back home!",
        author: createdUsers[3]._id,
        location: { name: "Bangkok, Thailand", latitude: 13.7563, longitude: 100.5018 },
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000)
      },
      {
        content: "Boarding pass collection update! ✈️ Just hit 47 countries. Next goal: all 7 continents by next year!",
        author: createdUsers[0]._id,
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
      },
      {
        content: "Solo travel update: Currently writing from a café in Prague 🇨🇿 The architecture here is unreal. Every building tells a story!",
        author: createdUsers[1]._id,
        location: { name: "Prague, Czech Republic", latitude: 50.0755, longitude: 14.4378 },
        createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000)
      },
      {
        content: "Flight delayed 3 hours but made friends with fellow travelers 😊 Sometimes the best parts of travel are unexpected!",
        author: createdUsers[2]._id,
        location: { name: "JFK Airport, New York", latitude: 40.6413, longitude: -73.7781 },
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      },
      {
        content: "Sunset over Santorini 🌅 No filter needed when nature provides this kind of beauty. Greece, you have my heart!",
        author: createdUsers[3]._id,
        location: { name: "Santorini, Greece", latitude: 36.3932, longitude: 25.4615 },
        createdAt: new Date(Date.now() - 30 * 60 * 60 * 1000)
      }
    ];

    // Add posts for beck1 too
    const beck1 = await User.findOne({ username: 'beck1' });
    if (beck1) {
      socialPosts.push(
        {
          content: "Just landed in Tokyo! 🇯🇵 The flight was incredible and the city lights from above were breathtaking. Ready to explore!",
          author: beck1._id,
          location: { name: "Tokyo, Japan", latitude: 35.6762, longitude: 139.6503 },
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
        },
        {
          content: "My boarding pass collection is growing! ✈️ Nothing beats the excitement of a new adventure. Where should I go next?",
          author: beck1._id,
          createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000)
        }
      );
    }

    const createdPosts = await Post.insertMany(socialPosts);
    console.log(`✅ Created ${createdPosts.length} social feed posts`);

    // Verify the feed
    const allPosts = await Post.find().populate('author', 'username').sort({ createdAt: -1 });
    console.log(`📄 Total posts in feed: ${allPosts.length}`);
    
    console.log('\n🌍 Social Feed Preview:');
    allPosts.slice(0, 5).forEach(post => {
      const author = (post.author as any).username;
      const content = post.content.substring(0, 60);
      const timeAgo = Math.floor((Date.now() - post.createdAt.getTime()) / (1000 * 60 * 60));
      console.log(`- ${author}: "${content}..." (${timeAgo}h ago)`);
    });

  } catch (error) {
    console.error('Error creating social feed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createSocialFeed();