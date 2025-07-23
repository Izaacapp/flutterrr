import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Notification } from '../models/Notification';
import { notificationService } from '../services/notification.service';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI!;
const BATCH_SIZE = 10;
const FOLLOW_PROBABILITY = 0.7; // 70% chance of following

interface StressTestResults {
  totalUsers: number;
  totalFollows: number;
  totalNotifications: number;
  executionTime: number;
  avgFollowersPerUser: number;
  maxFollowers: number;
  errors: string[];
}

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB for stress testing');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

async function createMassiveFollowNetwork(): Promise<StressTestResults> {
  const startTime = Date.now();
  const results: StressTestResults = {
    totalUsers: 0,
    totalFollows: 0,
    totalNotifications: 0,
    executionTime: 0,
    avgFollowersPerUser: 0,
    maxFollowers: 0,
    errors: []
  };

  try {
    // Get all users
    const users = await User.find({}).select('_id username followers following');
    results.totalUsers = users.length;
    
    console.log(`🚀 Starting friend/follow stress test with ${users.length} users`);
    console.log(`📊 Creating random follow relationships...`);

    // Create follow relationships in batches
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);
      const promises = [];

      for (const follower of batch) {
        // Each user follows a random number of other users
        const numToFollow = Math.floor(Math.random() * 50) + 5; // Follow 5-55 users
        const usersToFollow = users
          .filter(u => u._id.toString() !== follower._id.toString())
          .sort(() => Math.random() - 0.5)
          .slice(0, numToFollow);

        for (const targetUser of usersToFollow) {
          if (Math.random() < FOLLOW_PROBABILITY) {
            promises.push(followUser(follower, targetUser, results));
          }
        }
      }

      // Execute batch
      await Promise.all(promises);
      console.log(`✅ Processed batch ${i / BATCH_SIZE + 1}/${Math.ceil(users.length / BATCH_SIZE)}`);
    }

    // Calculate statistics
    const usersWithStats = await User.find({}).select('followers');
    const followerCounts = usersWithStats.map(u => u.followers?.length || 0);
    results.avgFollowersPerUser = followerCounts.reduce((a, b) => a + b, 0) / followerCounts.length;
    results.maxFollowers = Math.max(...followerCounts);

    // Count notifications
    results.totalNotifications = await Notification.countDocuments({ type: 'follow' });

    results.executionTime = Date.now() - startTime;

    return results;
  } catch (error) {
    console.error('❌ Error in stress test:', error);
    results.errors.push(error.message);
    return results;
  }
}

async function followUser(follower: any, targetUser: any, results: StressTestResults) {
  try {
    // Check if already following
    if (targetUser.followers?.includes(follower._id)) {
      return;
    }

    // Update both users
    await User.findByIdAndUpdate(targetUser._id, {
      $addToSet: { followers: follower._id }
    });

    await User.findByIdAndUpdate(follower._id, {
      $addToSet: { following: targetUser._id }
    });

    // Create notification
    await notificationService.createNotification({
      recipientId: targetUser._id.toString(),
      senderId: follower._id.toString(),
      type: 'follow',
      entityId: follower._id.toString(),
      entityType: 'user'
    });

    results.totalFollows++;
  } catch (error) {
    results.errors.push(`Follow error: ${error.message}`);
  }
}

async function generateBurstActivity() {
  console.log('\n🎯 Generating burst activity (simulate viral moment)...');
  
  // Pick a random user to go "viral"
  const users = await User.find({}).select('_id username');
  const viralUser = users[Math.floor(Math.random() * users.length)];
  
  console.log(`🌟 User @${viralUser.username} is going viral!`);
  
  // Have 50% of all users follow them rapidly
  const followersCount = Math.floor(users.length * 0.5);
  const potentialFollowers = users
    .filter(u => u._id.toString() !== viralUser._id.toString())
    .slice(0, followersCount);

  const promises = potentialFollowers.map(follower => 
    followUser(follower, viralUser, {
      totalFollows: 0,
      totalNotifications: 0,
      errors: []
    } as any)
  );

  await Promise.all(promises);
  console.log(`✅ ${followersCount} users followed @${viralUser.username} in burst!`);
}

async function testNotificationPerformance() {
  console.log('\n📊 Testing notification query performance...');
  
  const testUserId = (await User.findOne({}))._id;
  
  // Test notification fetch speed
  const fetchStart = Date.now();
  const notifications = await Notification.find({ recipient: testUserId })
    .populate('sender', 'username avatar')
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();
  const fetchTime = Date.now() - fetchStart;
  
  // Test unread count
  const countStart = Date.now();
  const unreadCount = await Notification.countDocuments({ 
    recipient: testUserId, 
    read: false 
  });
  const countTime = Date.now() - countStart;

  console.log(`📈 Performance Results:`);
  console.log(`   - Fetch 20 notifications: ${fetchTime}ms`);
  console.log(`   - Count unread: ${countTime}ms`);
  console.log(`   - Total notifications: ${notifications.length}`);
  console.log(`   - Unread count: ${unreadCount}`);
}

async function stressTestFollowUnfollow() {
  console.log('\n🔄 Testing rapid follow/unfollow cycles...');
  
  const users = await User.find({}).limit(10).select('_id username');
  const user1 = users[0];
  const user2 = users[1];
  
  const cycles = 50;
  const startTime = Date.now();
  
  for (let i = 0; i < cycles; i++) {
    // Follow
    await User.findByIdAndUpdate(user2._id, {
      $addToSet: { followers: user1._id }
    });
    await User.findByIdAndUpdate(user1._id, {
      $addToSet: { following: user2._id }
    });
    
    // Unfollow
    await User.findByIdAndUpdate(user2._id, {
      $pull: { followers: user1._id }
    });
    await User.findByIdAndUpdate(user1._id, {
      $pull: { following: user2._id }
    });
  }
  
  const duration = Date.now() - startTime;
  console.log(`✅ Completed ${cycles} follow/unfollow cycles in ${duration}ms`);
  console.log(`   Average: ${(duration / cycles).toFixed(2)}ms per cycle`);
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  
  // Remove all follow notifications
  await Notification.deleteMany({ type: 'follow' });
  
  // Reset all follow relationships
  await User.updateMany({}, {
    $set: { followers: [], following: [] }
  });
  
  console.log('✅ Cleanup complete');
}

async function main() {
  await connectDB();
  
  console.log('🚀 Starting Friend/Follow Feature Stress Test');
  console.log('=' .repeat(50));
  
  // Run stress tests
  const results = await createMassiveFollowNetwork();
  
  console.log('\n📊 Stress Test Results:');
  console.log('=' .repeat(50));
  console.log(`Total Users: ${results.totalUsers}`);
  console.log(`Total Follow Relationships: ${results.totalFollows}`);
  console.log(`Total Notifications Created: ${results.totalNotifications}`);
  console.log(`Average Followers per User: ${results.avgFollowersPerUser.toFixed(2)}`);
  console.log(`Max Followers (most popular): ${results.maxFollowers}`);
  console.log(`Execution Time: ${(results.executionTime / 1000).toFixed(2)}s`);
  console.log(`Errors: ${results.errors.length}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    results.errors.slice(0, 10).forEach(err => console.log(`   - ${err}`));
  }
  
  // Additional tests
  await generateBurstActivity();
  await testNotificationPerformance();
  await stressTestFollowUnfollow();
  
  // Cleanup option
  console.log('\n🤔 Do you want to clean up test data? (y/n)');
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  readline.question('', async (answer: string) => {
    if (answer.toLowerCase() === 'y') {
      await cleanup();
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Stress test complete!');
    process.exit(0);
  });
}

// Run the stress test
main().catch(console.error);