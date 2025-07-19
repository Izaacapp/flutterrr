import request from 'supertest';
import express from 'express';

// Create a simple test app
const app = express();
app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'UP', 
    environment: process.env.NODE_ENV || 'test',
    timestamp: new Date()
  });
});

// Simple API endpoint
app.get('/api/test', (_req, res) => {
  res.json({ message: 'Test endpoint working' });
});

// Protected endpoint simulation
app.get('/api/protected', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.json({ message: 'Protected resource accessed' });
});

describe('API Integration Tests', () => {
  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('UP');
      expect(response.body.environment).toBe('test');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('API Endpoints', () => {
    it('should return test message', async () => {
      const response = await request(app)
        .get('/api/test')
        .expect(200);

      expect(response.body.message).toBe('Test endpoint working');
    });
  });

  describe('Authentication', () => {
    it('should reject request without auth token', async () => {
      const response = await request(app)
        .get('/api/protected')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    it('should accept request with auth token', async () => {
      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', 'Bearer fake-token')
        .expect(200);

      expect(response.body.message).toBe('Protected resource accessed');
    });
  });

  describe('Content Type', () => {
    it('should handle JSON requests', async () => {
      const testData = { test: 'data' };
      
      // Add a POST endpoint for testing
      app.post('/api/echo', (req, res) => {
        res.json(req.body);
      });

      const response = await request(app)
        .post('/api/echo')
        .send(testData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual(testData);
    });
  });
});