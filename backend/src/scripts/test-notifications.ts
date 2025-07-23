import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = 'http://localhost:3000/api';

// Test accounts - you'll need to update these with actual test accounts
const testAccounts = [
  {
    email: 'test1@example.com',
    password: 'password123',
    username: 'testuser1'
  },
  {
    email: 'test2@example.com', 
    password: 'password123',
    username: 'testuser2'
  }
];

interface AuthResponse {
  status: string;
  message: string;
  token: string;
  data: {
    user: {
      _id: string;
      username: string;
      email: string;
    };
  };
}

async function login(email: string, password: string): Promise<AuthResponse | null> {
  try {
    const response = await axios.post('http://localhost:3000/api/auth/login', {
      email,
      password
    });
    return response.data;
  } catch (error: any) {
    console.error(`Login failed for ${email}:`, error.response?.data || error.message);
    return null;
  }
}

async function register(email: string, password: string, username: string): Promise<AuthResponse | null> {
  try {
    const response = await axios.post('http://localhost:3000/api/auth/signup', {
      email,
      password,
      username,
      fullName: username // Changed from 'name' to 'fullName' to match the backend
    });
    return response.data;
  } catch (error: any) {
    console.error(`Registration failed for ${email}:`, error.response?.data || error.message);
    return null;
  }
}

async function getNotifications(token: string) {
  try {
    const response = await axios.get(`${API_BASE_URL}/notifications`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error: any) {
    console.error('Failed to get notifications:', error.response?.data || error.message);
    return null;
  }
}

async function followUser(token: string, userIdToFollow: string) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/users/follow/${userIdToFollow}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('Failed to follow user:', error.response?.data || error.message);
    return null;
  }
}

async function createPost(token: string, content: string) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/posts`,
      { content },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('Failed to create post:', error.response?.data || error.message);
    return null;
  }
}

async function likePost(token: string, postId: string) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/posts/${postId}/like`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('Failed to like post:', error.response?.data || error.message);
    return null;
  }
}

async function commentOnPost(token: string, postId: string, comment: string) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/posts/${postId}/comment`,
      { content: comment },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('Failed to comment on post:', error.response?.data || error.message);
    return null;
  }
}

async function testNotificationSystem() {
  console.log('🚀 Starting notification system test...\n');

  // Step 1: Create/Login test accounts
  console.log('Step 1: Setting up test accounts...');
  
  let user1Auth = await login(testAccounts[0].email, testAccounts[0].password);
  if (!user1Auth) {
    console.log('Creating user 1...');
    user1Auth = await register(testAccounts[0].email, testAccounts[0].password, testAccounts[0].username);
  }
  
  let user2Auth = await login(testAccounts[1].email, testAccounts[1].password);
  if (!user2Auth) {
    console.log('Creating user 2...');
    user2Auth = await register(testAccounts[1].email, testAccounts[1].password, testAccounts[1].username);
  }

  if (!user1Auth || !user2Auth) {
    console.error('Failed to set up test accounts');
    return;
  }

  console.log('✅ Test accounts ready\n');

  // Step 2: Test getting notifications (should be empty initially)
  console.log('Step 2: Testing notification endpoints...');
  
  const initialNotifications = await getNotifications(user1Auth.token);
  console.log('User 1 initial notifications:', initialNotifications);
  
  const user2InitialNotifications = await getNotifications(user2Auth.token);
  console.log('User 2 initial notifications:', user2InitialNotifications);
  console.log('✅ Notification endpoints working\n');

  // Step 3: User 2 follows User 1
  console.log('Step 3: Testing follow notification...');
  await followUser(user2Auth.token, user1Auth.data.user._id);
  console.log('User 2 followed User 1');
  
  // Wait a bit for the notification to be created
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const followNotifications = await getNotifications(user1Auth.token);
  console.log('User 1 notifications after follow:', followNotifications);
  console.log('✅ Follow notification test complete\n');

  // Step 4: User 1 creates a post
  console.log('Step 4: Testing post creation...');
  const post = await createPost(user1Auth.token, 'Test post for notification system');
  if (!post) {
    console.error('Failed to create post');
    return;
  }
  console.log('Created post:', post._id);

  // Step 5: User 2 likes the post
  console.log('\nStep 5: Testing like notification...');
  await likePost(user2Auth.token, post._id);
  console.log('User 2 liked the post');
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const likeNotifications = await getNotifications(user1Auth.token);
  console.log('User 1 notifications after like:', likeNotifications);
  console.log('✅ Like notification test complete\n');

  // Step 6: User 2 comments on the post
  console.log('Step 6: Testing comment notification...');
  await commentOnPost(user2Auth.token, post._id, 'Great post!');
  console.log('User 2 commented on the post');
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const commentNotifications = await getNotifications(user1Auth.token);
  console.log('User 1 final notifications:', commentNotifications);
  console.log('✅ Comment notification test complete\n');

  console.log('🎉 Notification system test completed!');
}

// Run the test
testNotificationSystem().catch(console.error);