// Test helpers with retry logic and robust patterns

export interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: number;
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  delay: 1000,
  backoff: 2
};

// Retry helper for flaky operations
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = DEFAULT_RETRY_OPTIONS
): Promise<T> {
  const { maxAttempts = 3, delay = 1000, backoff = 2 } = options;
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        throw error;
      }
      
      const waitTime = delay * Math.pow(backoff, attempt - 1);
      console.log(`Attempt ${attempt} failed, retrying in ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError || new Error('All retry attempts failed');
}

// Wait for condition with timeout
export async function waitForCondition(
  condition: () => Promise<boolean>,
  timeoutMs: number = 10000,
  intervalMs: number = 100
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  
  throw new Error(`Condition not met within ${timeoutMs}ms`);
}

// Test database connection helper
export async function waitForDatabase(
  mongoUri: string,
  maxWaitTime: number = 30000
): Promise<void> {
  const mongoose = require('mongoose');
  
  await withRetry(
    async () => {
      await mongoose.connect(mongoUri);
      await mongoose.connection.close();
    },
    {
      maxAttempts: 10,
      delay: 3000,
      backoff: 1
    }
  );
}

// Email delivery test helper
export async function testEmailDelivery(
  apiUrl: string,
  testEmail: string
): Promise<boolean> {
  try {
    const response = await fetch(`${apiUrl}/api/test-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: testEmail })
    });
    
    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error('Email test failed:', error);
    return false;
  }
}

// Service health check helper
export async function checkServiceHealth(
  serviceUrl: string
): Promise<boolean> {
  try {
    const response = await fetch(`${serviceUrl}/api/health`);
    const health = await response.json();
    return health.status === 'UP';
  } catch {
    return false;
  }
}

// Network connectivity test
export async function testNetworkConnectivity(
  endpoints: string[]
): Promise<{ endpoint: string; success: boolean; error?: string }[]> {
  const results = await Promise.all(
    endpoints.map(async endpoint => {
      try {
        const response = await fetch(endpoint, { 
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });
        return {
          endpoint,
          success: response.ok,
          error: response.ok ? undefined : `HTTP ${response.status}`
        };
      } catch (error) {
        return {
          endpoint,
          success: false,
          error: (error as Error).message
        };
      }
    })
  );
  
  return results;
}

// Mock data generators
export function generateTestUser(overrides = {}) {
  const id = Math.random().toString(36).substring(7);
  return {
    username: `testuser_${id}`,
    email: `test_${id}@example.com`,
    password: 'Test123!',
    ...overrides
  };
}

export function generateTestOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Test cleanup helper
export async function cleanupTestData(
  modelName: string,
  filter: any
): Promise<void> {
  try {
    const mongoose = require('mongoose');
    const Model = mongoose.model(modelName);
    await Model.deleteMany(filter);
  } catch (error) {
    console.warn(`Failed to cleanup ${modelName}:`, error);
  }
}