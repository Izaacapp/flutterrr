import '@testing-library/jest-dom';
import { expect, afterEach, vi, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// 🔧 FIX #4: TEST ENVIRONMENT - Proper API URL and mocks for tests
beforeAll(() => {
  // Set up environment variables for tests
  vi.stubEnv('VITE_API_URL', 'http://localhost:3000');
  vi.stubEnv('VITE_AUTH_TOKEN_KEY', 'passport_buddy_token');
  vi.stubEnv('VITE_GRAPHQL_ENDPOINT', 'http://localhost:3000/graphql');
  
  console.log('🧪 TEST_ENV: Environment variables configured for testing');
  console.log('🧪 TEST_ENV: API_URL =', import.meta.env.VITE_API_URL);
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// 🔧 FIX #4: Mock fetch for API calls during tests
global.fetch = vi.fn().mockImplementation((url: string, options?: any) => {
  console.log('🧪 MOCK_FETCH:', url, options?.method || 'GET');
  
  // Mock API responses based on URL patterns
  if (url.includes('/api/users/block/')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        status: 'success',
        message: options?.method === 'DELETE' ? 'User unblocked' : 'User blocked'
      })
    });
  }
  
  if (url.includes('/api/users/')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        status: 'success',
        data: {
          user: {
            _id: 'test-user-id',
            username: 'test_user',
            fullName: 'Test User',
            avatar: null,
            isBlocked: false,
            followersCount: 0,
            followingCount: 0
          }
        }
      })
    });
  }
  
  // Default mock response
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ status: 'success', data: {} })
  });
});

// 🔧 FIX #4: Mock localStorage for token management
const localStorageMock = {
  getItem: vi.fn().mockImplementation((key: string) => {
    if (key === 'passport_buddy_token') {
      return 'mock-test-token';
    }
    return null;
  }),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// 🔧 FIX #4: Mock performance API for performance tests
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn().mockReturnValue(Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
  },
});

console.log('✅ TEST_ENV: Test environment setup complete with all mocks');