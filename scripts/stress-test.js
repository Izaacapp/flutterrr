#!/usr/bin/env node

const API_URL = 'http://localhost:3000/api';

// Test users from seed data
const testUsers = [
  { username: 'izaacplambeck', password: 'Test123' },
  { username: 'diab', password: 'Test123' },
  { username: 'devonvill', password: 'Test123' },
  { username: 'masonmiles', password: 'Test123' },
  { username: 'jacobroberts', password: 'Test123' },
  { username: 'laylale', password: 'Test123' },
  { username: 'evahocking', password: 'Test123' },
  { username: 'testuser', password: 'Test123' }
];

// Login a user and get their token
async function login(username, password) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await response.json();
  return data.token;
}

// Get posts
async function getPosts(token) {
  const response = await fetch(`${API_URL}/posts`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
}

// Like a post
async function likePost(token, postId) {
  const response = await fetch(`${API_URL}/posts/${postId}/like`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
}

// Add comment
async function addComment(token, postId, content) {
  const response = await fetch(`${API_URL}/posts/${postId}/comment`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ content })
  });
  return response.json();
}

// Run stress test
async function runStressTest() {
  console.log('🚀 Starting stress test...\n');

  // Login all users
  console.log('👥 Logging in users...');
  const userSessions = [];
  for (const user of testUsers) {
    try {
      const token = await login(user.username, user.password);
      userSessions.push({ ...user, token });
      console.log(`✅ Logged in: ${user.username}`);
    } catch (error) {
      console.log(`❌ Failed to login: ${user.username}`);
    }
  }

  // Get posts
  console.log('\n📝 Fetching posts...');
  const posts = await getPosts(userSessions[0].token);
  console.log(`Found ${posts.length} posts`);

  if (posts.length === 0) {
    console.log('❌ No posts found. Please seed the database first.');
    return;
  }

  // Test concurrent likes
  console.log('\n❤️  Testing concurrent likes...');
  const targetPost = posts[0];
  const likePromises = userSessions.map(session => 
    likePost(session.token, targetPost._id)
      .then(() => console.log(`✅ ${session.username} liked post`))
      .catch(() => console.log(`❌ ${session.username} failed to like`))
  );
  await Promise.all(likePromises);

  // Test concurrent comments
  console.log('\n💬 Testing concurrent comments...');
  const commentPromises = userSessions.map((session, index) => 
    addComment(session.token, targetPost._id, `Test comment ${index + 1} from ${session.username}`)
      .then(() => console.log(`✅ ${session.username} added comment`))
      .catch(() => console.log(`❌ ${session.username} failed to comment`))
  );
  await Promise.all(commentPromises);

  // Test rapid fire operations
  console.log('\n⚡ Testing rapid fire operations...');
  const rapidOps = [];
  for (let i = 0; i < 20; i++) {
    const randomUser = userSessions[Math.floor(Math.random() * userSessions.length)];
    const randomPost = posts[Math.floor(Math.random() * posts.length)];
    
    if (i % 2 === 0) {
      rapidOps.push(
        likePost(randomUser.token, randomPost._id)
          .then(() => console.log(`✅ Rapid like by ${randomUser.username}`))
          .catch(() => console.log(`❌ Rapid like failed`))
      );
    } else {
      rapidOps.push(
        addComment(randomUser.token, randomPost._id, `Rapid comment ${i}`)
          .then(() => console.log(`✅ Rapid comment by ${randomUser.username}`))
          .catch(() => console.log(`❌ Rapid comment failed`))
      );
    }
  }
  await Promise.all(rapidOps);

  console.log('\n✅ Stress test complete!');
}

// Run the test
runStressTest().catch(console.error);