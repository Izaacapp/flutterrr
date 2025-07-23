// Test auth flow
const axios = require('axios');

async function testAuthFlow() {
  try {
    // Register a new user
    const timestamp = Date.now();
    const email = `test${timestamp}@example.com`;
    
    console.log('1. Registering user...');
    const signupResponse = await axios.post('http://localhost:3000/api/auth/signup', {
      username: `testuser${timestamp}`,
      fullName: 'Test User',
      email: email,
      password: 'Test123!'
    });
    
    console.log('Signup response:', {
      status: signupResponse.data.status,
      hasToken: !!signupResponse.data.token,
      hasUser: !!signupResponse.data.data?.user
    });
    
    // Login with the user
    console.log('\n2. Logging in...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: email,
      password: 'Test123!'
    });
    
    console.log('Login response:', {
      status: loginResponse.data.status,
      hasToken: !!loginResponse.data.token,
      hasUser: !!loginResponse.data.data?.user
    });
    
    const token = loginResponse.data.token;
    console.log('Token received:', token);
    
    // Test protected endpoint
    console.log('\n3. Testing protected endpoint (flight stats)...');
    const statsResponse = await axios.get('http://localhost:3000/api/v1/flights/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Stats response:', statsResponse.data);
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testAuthFlow();