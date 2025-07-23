// Direct login test
const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login with hardcoded credentials...');
    
    const response = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    console.log('Login successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('Login failed!');
    console.log('Error status:', error.response?.status);
    console.log('Error data:', error.response?.data);
  }
}

testLogin();