import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { notificationService } from '../services/notification.service';
import * as dotenv from 'dotenv';

dotenv.config();

const testUsers = [
  {
    username: 'johndoe',
    email: 'john@example.com',
    fullName: 'John Doe',
    bio: 'Travel enthusiast | Photography lover | 🌍',
    password: 'password123',
    avatar: 'https://i.pravatar.cc/150?u=johndoe'
  },
  {
    username: 'janedoe',
    email: 'jane@example.com',
    fullName: 'Jane Doe',
    bio: 'Adventure seeker | Coffee addict ☕',
    password: 'password123',
    avatar: 'https://i.pravatar.cc/150?u=janedoe'
  },
  {
    username: 'traveler22',
    email: 'traveler@example.com',
    fullName: 'Alex Traveler',
    bio: '✈️ 45 countries and counting',
    password: 'password123',
    avatar: 'https://i.pravatar.cc/150?u=traveler22'
  },
  {
    username: 'photosnap',
    email: 'photo@example.com',
    fullName: 'Sarah Photographer',
    bio: 'Capturing moments around the world 📸',
    password: 'password123',
    avatar: 'https://i.pravatar.cc/150?u=photosnap'
  },
  {
    username: 'adventuremike',
    email: 'mike@example.com',
    fullName: 'Mike Adventure',
    bio: 'Mountain climber | Sky diver | Living on the edge',
    password: 'password123',
    avatar: 'https://i.pravatar.cc/150?u=adventuremike'
  },
  {
    username: 'beachbum',
    email: 'beach@example.com',
    fullName: 'Lisa Beach',
    bio: '🏖️ Beach lover | Sunset chaser',
    password: 'password123',
    avatar: 'https://i.pravatar.cc/150?u=beachbum'
  },
  {
    username: 'citylights',
    email: 'city@example.com',
    fullName: 'Chris Urban',
    bio: 'City explorer | Street food connoisseur',
    password: 'password123',
    avatar: 'https://i.pravatar.cc/150?u=citylights'
  },
  {
    username: 'naturefreak',
    email: 'nature@example.com',
    fullName: 'Emma Green',
    bio: '🌲 Nature lover | Hiker | Environmentalist',
    password: 'password123',
    avatar: 'https://i.pravatar.cc/150?u=naturefreak'
  },
  {
    username: 'foodietravels',
    email: 'foodie@example.com',
    fullName: 'David Foodie',
    bio: 'Eating my way around the world 🍜',
    password: 'password123',
    avatar: 'https://i.pravatar.cc/150?u=foodietravels'
  },
  {
    username: 'nomadlife',
    email: 'nomad@example.com',
    fullName: 'Nina Nomad',
    bio: 'Digital nomad | Remote worker | 💻',
    password: 'password123',
    avatar: 'https://i.pravatar.cc/150?u=nomadlife'
  }
];

async function seedTestUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/passport-buddy');
    console.log('🔗 Connected to MongoDB');

    // Clear existing test users (optional)
    const testUsernames = testUsers.map(u => u.username);
    await User.deleteMany({ username: { $in: testUsernames } });
    console.log('🧹 Cleared existing test users');

    // Create users
    const createdUsers = [];
    for (const userData of testUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await User.create({
        ...userData,
        password: hashedPassword,
        isEmailVerified: true
      });
      createdUsers.push(user);
      console.log(`✅ Created user: ${user.username}`);
    }

    // Create relationships
    console.log('\n📊 Creating relationships...');

    // John follows Jane, Alex, Sarah, Mike
    await User.findByIdAndUpdate(createdUsers[0]._id, {
      $addToSet: { 
        following: [createdUsers[1]._id, createdUsers[2]._id, createdUsers[3]._id, createdUsers[4]._id]
      }
    });
    await User.findByIdAndUpdate(createdUsers[1]._id, { $addToSet: { followers: createdUsers[0]._id } });
    await User.findByIdAndUpdate(createdUsers[2]._id, { $addToSet: { followers: createdUsers[0]._id } });
    await User.findByIdAndUpdate(createdUsers[3]._id, { $addToSet: { followers: createdUsers[0]._id } });
    await User.findByIdAndUpdate(createdUsers[4]._id, { $addToSet: { followers: createdUsers[0]._id } });

    // Jane follows John (mutual), Sarah, Emma
    await User.findByIdAndUpdate(createdUsers[1]._id, {
      $addToSet: { 
        following: [createdUsers[0]._id, createdUsers[3]._id, createdUsers[7]._id]
      }
    });
    await User.findByIdAndUpdate(createdUsers[0]._id, { $addToSet: { followers: createdUsers[1]._id } });
    await User.findByIdAndUpdate(createdUsers[3]._id, { $addToSet: { followers: createdUsers[1]._id } });
    await User.findByIdAndUpdate(createdUsers[7]._id, { $addToSet: { followers: createdUsers[1]._id } });

    // Alex follows everyone except John
    for (let i = 1; i < createdUsers.length; i++) {
      if (i !== 2) { // Skip self
        await User.findByIdAndUpdate(createdUsers[2]._id, {
          $addToSet: { following: createdUsers[i]._id }
        });
        await User.findByIdAndUpdate(createdUsers[i]._id, {
          $addToSet: { followers: createdUsers[2]._id }
        });
      }
    }

    // Create some blocked relationships
    // Mike blocks Chris
    await User.findByIdAndUpdate(createdUsers[4]._id, {
      $addToSet: { blockedUsers: createdUsers[6]._id }
    });
    console.log('🚫 Mike blocked Chris');

    // Emma blocks David
    await User.findByIdAndUpdate(createdUsers[7]._id, {
      $addToSet: { blockedUsers: createdUsers[8]._id }
    });
    console.log('🚫 Emma blocked David');

    // Create some mutual follows
    // Sarah and Emma follow each other
    await User.findByIdAndUpdate(createdUsers[3]._id, {
      $addToSet: { following: createdUsers[7]._id, followers: createdUsers[7]._id }
    });
    await User.findByIdAndUpdate(createdUsers[7]._id, {
      $addToSet: { following: createdUsers[3]._id, followers: createdUsers[3]._id }
    });

    // Lisa and Nina follow each other
    await User.findByIdAndUpdate(createdUsers[5]._id, {
      $addToSet: { following: createdUsers[9]._id, followers: createdUsers[9]._id }
    });
    await User.findByIdAndUpdate(createdUsers[9]._id, {
      $addToSet: { following: createdUsers[5]._id, followers: createdUsers[5]._id }
    });

    console.log('\n✅ Test users created successfully!');
    console.log('\n📋 User credentials:');
    console.log('Username: any of the above usernames');
    console.log('Password: password123');
    
    console.log('\n🔗 Relationships created:');
    console.log('- John follows: Jane, Alex, Sarah, Mike');
    console.log('- Jane follows: John, Sarah, Emma');
    console.log('- Alex follows: everyone except John');
    console.log('- Sarah ↔️ Emma (mutual)');
    console.log('- Lisa ↔️ Nina (mutual)');
    console.log('- Mike blocked Chris');
    console.log('- Emma blocked David');

  } catch (error) {
    console.error('❌ Error seeding test users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the seed script
seedTestUsers();