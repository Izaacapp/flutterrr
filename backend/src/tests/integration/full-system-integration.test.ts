import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app';
import { User } from '../../models/User';
import { Flight } from '../../models/Flight';
import { Post } from '../../models/Post';

describe('🚨 FULL SYSTEM INTEGRATION STRESS TESTS', () => {
  let authToken: string;
  let testUserId: string;
  let testFlightId: string;
  let testPostId: string;

  beforeAll(async () => {
    // Connect to test database
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = 'test';
    }
    
    // Clean up any existing test data
    await User.deleteMany({ email: /@stresstest\.com$/ });
    await Flight.deleteMany({ confirmationCode: /^TEST/ });
    await Post.deleteMany({ content: /stress test/i });
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({ email: /@stresstest\.com$/ });
    await Flight.deleteMany({ confirmationCode: /^TEST/ });
    await Post.deleteMany({ content: /stress test/i });
  });

  describe('🔐 AUTHENTICATION FLOW STRESS TEST', () => {
    it('should handle complete user registration flow', async () => {
      const userData = {
        username: 'stresstestuser',
        email: 'stresstest@stresstest.com',
        password: 'StressTest123!',
        confirmPassword: 'StressTest123!'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
      
      testUserId = response.body.user._id;
    });

    it('should handle user login and return valid JWT', async () => {
      const loginData = {
        email: 'stresstest@stresstest.com',
        password: 'StressTest123!'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      
      authToken = response.body.token;
    });

    it('should protect routes with valid authentication', async () => {
      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body._id).toBe(testUserId);
    });

    it('should reject invalid authentication tokens', async () => {
      await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('✈️ FLIGHT MANAGEMENT STRESS TESTS', () => {
    it('should create flight via manual entry', async () => {
      const flightData = {
        airline: 'Stress Test Airlines',
        airlineCode: 'ST',
        flightNumber: 'ST123',
        confirmationCode: 'TEST123',
        origin: {
          airportCode: 'LAX',
          airportName: 'Los Angeles International Airport',
          city: 'Los Angeles',
          country: 'United States',
          terminal: '7',
          gate: 'A23'
        },
        destination: {
          airportCode: 'JFK',
          airportName: 'John F. Kennedy International Airport',
          city: 'New York',
          country: 'United States',
          terminal: '4',
          gate: 'B12'
        },
        scheduledDepartureTime: '2024-06-15T14:30:00.000Z',
        scheduledArrivalTime: '2024-06-15T18:45:00.000Z',
        seatNumber: '12A',
        status: 'upcoming',
        distance: 2475,
        duration: 315
      };

      const response = await request(app)
        .post('/api/v1/flights/manual-entry')
        .set('Authorization', `Bearer ${authToken}`)
        .send(flightData)
        .expect(201);

      expect(response.body._id).toBeDefined();
      expect(response.body.airline).toBe(flightData.airline);
      expect(response.body.flightNumber).toBe(flightData.flightNumber);
      expect(response.body.origin.airportCode).toBe(flightData.origin.airportCode);
      
      testFlightId = response.body._id;
    });

    it('should retrieve user flights with filtering', async () => {
      const response = await request(app)
        .get('/api/v1/flights/my-flights?status=upcoming&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.flights).toBeDefined();
      expect(Array.isArray(response.body.flights)).toBe(true);
      expect(response.body.total).toBeGreaterThanOrEqual(1);
      expect(response.body.flights[0].status).toBe('upcoming');
    });

    it('should update flight information', async () => {
      const updateData = {
        seatNumber: '15C',
        boardingGroup: '2',
        status: 'completed'
      };

      const response = await request(app)
        .put(`/api/v1/flights/${testFlightId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.seatNumber).toBe('15C');
      expect(response.body.boardingGroup).toBe('2');
      expect(response.body.status).toBe('completed');
    });

    it('should get flight statistics', async () => {
      const response = await request(app)
        .get('/api/v1/flights/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.summary).toBeDefined();
      expect(response.body.summary.totalFlights).toBeGreaterThanOrEqual(1);
      expect(response.body.summary.totalDistance).toBeGreaterThanOrEqual(0);
    });
  });

  describe('📱 SOCIAL FEED STRESS TESTS', () => {
    it('should create a new post', async () => {
      const postData = {
        content: 'This is a stress test post for our comprehensive testing suite! ✈️ #testing',
        tags: ['testing', 'stresstest'],
        privacy: 'public'
      };

      const response = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(postData)
        .expect(201);

      expect(response.body._id).toBeDefined();
      expect(response.body.content).toBe(postData.content);
      expect(response.body.author._id).toBe(testUserId);
      expect(response.body.tags).toEqual(postData.tags);
      
      testPostId = response.body._id;
    });

    it('should retrieve feed posts', async () => {
      const response = await request(app)
        .get('/api/v1/posts/feed?limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.posts).toBeDefined();
      expect(Array.isArray(response.body.posts)).toBe(true);
      expect(response.body.hasMore).toBeDefined();
    });

    it('should like and unlike posts', async () => {
      // Like the post
      const likeResponse = await request(app)
        .post(`/api/v1/posts/${testPostId}/like`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(likeResponse.body.likes).toContain(testUserId);

      // Unlike the post
      const unlikeResponse = await request(app)
        .delete(`/api/v1/posts/${testPostId}/like`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(unlikeResponse.body.likes).not.toContain(testUserId);
    });

    it('should add and retrieve comments', async () => {
      const commentData = {
        content: 'This is a stress test comment!'
      };

      const response = await request(app)
        .post(`/api/v1/posts/${testPostId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(commentData)
        .expect(201);

      expect(response.body.content).toBe(commentData.content);
      expect(response.body.author._id).toBe(testUserId);
    });
  });

  describe('🔍 GRAPHQL ENDPOINT STRESS TESTS', () => {
    it('should handle GraphQL introspection queries', async () => {
      const introspectionQuery = {
        query: `
          query IntrospectionQuery {
            __schema {
              types {
                name
                description
              }
            }
          }
        `
      };

      const response = await request(app)
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send(introspectionQuery)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.__schema).toBeDefined();
      expect(response.body.data.__schema.types).toBeDefined();
    });

    it('should handle basic GraphQL queries', async () => {
      const basicQuery = {
        query: `
          query {
            __typename
          }
        `
      };

      const response = await request(app)
        .post('/graphql')
        .send(basicQuery)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.__typename).toBe('Query');
    });
  });

  describe('🚀 PERFORMANCE AND LOAD STRESS TESTS', () => {
    it('should handle rapid sequential requests', async () => {
      const promises = [];
      
      for (let i = 0; i < 20; i++) {
        promises.push(
          request(app)
            .get('/health')
            .expect(200)
        );
      }

      const responses = await Promise.all(promises);
      expect(responses.length).toBe(20);
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should handle concurrent authenticated requests', async () => {
      const promises = [];
      
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .get('/api/v1/flights/my-flights')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200)
        );
      }

      const responses = await Promise.all(promises);
      expect(responses.length).toBe(10);
      responses.forEach(response => {
        expect(response.body.flights).toBeDefined();
      });
    });

    it('should handle malformed request data gracefully', async () => {
      const malformedData = {
        invalidField: 'test',
        anotherInvalidField: 12345,
        nestedInvalid: {
          bad: 'data'
        }
      };

      const response = await request(app)
        .post('/api/v1/flights/manual-entry')
        .set('Authorization', `Bearer ${authToken}`)
        .send(malformedData);

      // Should reject with validation error
      expect([400, 422]).toContain(response.status);
    });
  });

  describe('🛡️ SECURITY STRESS TESTS', () => {
    it('should prevent SQL injection attempts', async () => {
      const maliciousData = {
        email: "admin' OR '1'='1",
        password: "password"
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(maliciousData);

      expect([400, 401, 422]).toContain(response.status);
    });

    it('should prevent XSS in post content', async () => {
      const xssData = {
        content: '<script>alert("XSS")</script>This is a test post',
        privacy: 'public'
      };

      const response = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(xssData);

      if (response.status === 201) {
        // If created, ensure script tags are sanitized
        expect(response.body.content).not.toContain('<script>');
      }
    });

    it('should rate limit excessive requests', async () => {
      // This test might be skipped in test environment
      // but ensures rate limiting exists in production
      const promises = [];
      
      for (let i = 0; i < 100; i++) {
        promises.push(
          request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'test@test.com', password: 'wrong' })
        );
      }

      const responses = await Promise.all(promises);
      
      // Should eventually start returning 429 (Too Many Requests)
      // or at least not all should be processed
      const successCount = responses.filter(r => r.status === 401).length;
      expect(successCount).toBeLessThan(100); // Some should be rate limited
    });
  });

  describe('📊 DATA CONSISTENCY STRESS TESTS', () => {
    it('should maintain data consistency across operations', async () => {
      // Create multiple flights and verify count consistency
      const flightPromises = [];
      
      for (let i = 0; i < 5; i++) {
        flightPromises.push(
          request(app)
            .post('/api/v1/flights/manual-entry')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              airline: `Test Airline ${i}`,
              flightNumber: `TEST${i}`,
              confirmationCode: `CONS${i}`,
              origin: {
                airportCode: 'LAX',
                city: 'Los Angeles',
                country: 'United States'
              },
              destination: {
                airportCode: 'JFK',
                city: 'New York',
                country: 'United States'
              },
              scheduledDepartureTime: new Date().toISOString(),
              scheduledArrivalTime: new Date(Date.now() + 7200000).toISOString(),
              seatNumber: `${i}A`,
              status: 'upcoming'
            })
        );
      }

      const flightResponses = await Promise.all(flightPromises);
      const createdFlights = flightResponses.filter(r => r.status === 201);
      
      // Verify all flights were created
      const statsResponse = await request(app)
        .get('/api/v1/flights/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(statsResponse.body.summary.totalFlights).toBeGreaterThanOrEqual(createdFlights.length);
    });
  });
});

// Export for use in other test files
export { };