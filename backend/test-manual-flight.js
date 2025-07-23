// Test manual flight entry endpoint
const axios = require('axios');

async function testManualFlight() {
  try {
    // First register a new user
    const timestamp = Date.now();
    const randomEmail = `test${timestamp}@example.com`;
    const registerResponse = await axios.post('http://localhost:3000/api/auth/signup', {
      username: `testuser${timestamp}`,
      fullName: 'Test User',
      email: randomEmail,
      password: 'Test123!'
    });
    
    console.log('Registration successful');
    
    // Login with the new user
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: randomEmail,
      password: 'Test123!'
    });
    
    const token = loginResponse.data.token;
    console.log('Login successful, token received');
    
    // Now test manual flight entry
    const flightData = {
      origin: {
        airportCode: 'JFK',
        city: 'New York',
        country: 'USA'
      },
      destination: {
        airportCode: 'LAX',
        city: 'Los Angeles',
        country: 'USA'
      },
      scheduledDepartureTime: new Date('2025-01-25T10:00:00'),
      airline: 'Delta',
      flightNumber: 'DL123',
      seatNumber: '12A',
      status: 'upcoming'
    };
    
    const flightResponse = await axios.post('http://localhost:3000/api/v1/flights/manual-entry', 
      flightData,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('Manual flight entry successful:', flightResponse.data);
    
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

testManualFlight();