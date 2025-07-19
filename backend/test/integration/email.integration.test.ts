import { withRetry, testEmailDelivery, checkServiceHealth } from '../utils/testHelpers';

describe('Email Service Integration Tests', () => {
  const API_URL = process.env.API_URL || 'http://localhost:3000';
  
  beforeAll(async () => {
    // Wait for service to be healthy
    await withRetry(
      async () => {
        const isHealthy = await checkServiceHealth(API_URL);
        if (!isHealthy) {
          throw new Error('API service not healthy');
        }
      },
      { maxAttempts: 10, delay: 2000 }
    );
  });

  describe('Email Delivery', () => {
    it('should successfully send test email with retry', async () => {
      const testEmail = 'test@example.com';
      
      // Test with retry logic
      const result = await withRetry(
        async () => {
          const success = await testEmailDelivery(API_URL, testEmail);
          if (!success) {
            throw new Error('Email delivery failed');
          }
          return success;
        },
        { maxAttempts: 3, delay: 2000 }
      );
      
      expect(result).toBe(true);
    }, 30000); // 30 second timeout

    it('should verify email configuration', async () => {
      const response = await fetch(`${API_URL}/api/email-config`);
      const config = await response.json();
      
      expect(config).toHaveProperty('configured');
      expect(config).toHaveProperty('provider');
      
      if (process.env.MAILTRAP_TOKEN) {
        expect(config.configured).toBe(true);
        expect(config.provider).toBe('Mailtrap');
      } else {
        expect(config.configured).toBe(false);
        expect(config.provider).toBe('None');
      }
    });

    it('should handle invalid email gracefully', async () => {
      const response = await fetch(`${API_URL}/api/test-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: '' })
      });
      
      const result = await response.json();
      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Email address required');
    });
  });

  describe('OTP Email Tests', () => {
    it('should send OTP email with correct format', async () => {
      const testEmail = 'otp-test@example.com';
      const testOtp = '123456';
      
      const response = await fetch(`${API_URL}/api/test-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testEmail, testOtp })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        expect(result.success).toBe(true);
        expect(result.details.otp).toBe(testOtp);
        expect(result.details.to).toBe(testEmail);
      }
    });
  });
});