import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AuthProvider } from '../contexts/AuthContext';
import { App } from '../App';
import authService from '../services/auth.service';

// Mock the auth service
jest.mock('../services/auth.service');
const mockAuthService = authService as jest.Mocked<typeof authService>;

// Mock Apollo Client
jest.mock('../config/apollo-client', () => ({
  client: {
    resetStore: jest.fn(),
    clearStore: jest.fn(),
  }
}));

// Mock fetch for testing network failures
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Auth Service Resilience Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('Environment-aware API endpoints', () => {
    test('Auth service uses correct API endpoint in production', () => {
      // Mock production environment
      Object.defineProperty(window, 'location', {
        value: {
          hostname: 'myapp.com',
          origin: 'https://myapp.com'
        },
        writable: true
      });

      // Create new auth service instance to pick up new environment
      const AuthService = require('../services/auth.service').default;
      expect(AuthService.getBaseUrl()).toBe('https://myapp.com/api');
    });

    test('Auth service uses localhost in development', () => {
      // Mock development environment
      Object.defineProperty(window, 'location', {
        value: {
          hostname: 'localhost',
          origin: 'http://localhost:3001'
        },
        writable: true
      });

      const AuthService = require('../services/auth.service').default;
      expect(AuthService.getBaseUrl()).toContain('localhost');
    });
  });

  describe('Retry logic and timeout handling', () => {
    test('Retries failed requests with exponential backoff', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, user: { id: '1', username: 'test' } })
        });

      const user = await authService.verify(3);
      
      // Should have made 3 attempts (2 failures + 1 success)
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(user).toEqual({ id: '1', username: 'test' });
    });

    test('Handles timeout errors gracefully', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'AbortError';
      mockFetch.mockRejectedValue(timeoutError);

      const user = await authService.verify(2);
      
      expect(user).toBeNull();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    test('Does not retry on 4xx client errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: 'Invalid credentials' })
      });

      const user = await authService.verify(3);
      
      // Should not retry on 401 error
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(user).toBeNull();
    });
  });

  describe('Error UI and user experience', () => {
    test('Shows auth error UI when verification fails', async () => {
      mockAuthService.verify.mockRejectedValue({
        message: 'Network error. Please check your connection and try again.',
        code: 'NETWORK_ERROR',
        recoverable: true
      });
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getUser.mockReturnValue({ id: '1', username: 'test' });

      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Connection issues - Retry')).toBeInTheDocument();
      });
    });

    test('Shows retry button for recoverable errors', async () => {
      mockAuthService.verify.mockRejectedValue({
        message: 'Request timed out. Please check your connection and try again.',
        code: 'TIMEOUT',
        recoverable: true
      });
      mockAuthService.isAuthenticated.mockReturnValue(true);

      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('retry-auth-button')).toBeInTheDocument();
      });
    });

    test('Does not show retry button for non-recoverable errors', async () => {
      mockAuthService.verify.mockRejectedValue({
        message: 'Access denied. Please check your credentials.',
        code: 'FORBIDDEN',
        recoverable: false
      });
      mockAuthService.isAuthenticated.mockReturnValue(true);

      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('retry-auth-button')).not.toBeInTheDocument();
        expect(screen.getByText('Go to Login')).toBeInTheDocument();
      });
    });

    test('Retry button triggers new auth verification', async () => {
      const retryMock = jest.fn();
      mockAuthService.verify
        .mockRejectedValueOnce({
          message: 'Network error',
          code: 'NETWORK_ERROR',
          recoverable: true
        })
        .mockResolvedValueOnce({ id: '1', username: 'test' });

      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('retry-auth-button')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('retry-auth-button'));

      await waitFor(() => {
        expect(mockAuthService.verify).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Loading states', () => {
    test('Shows loading spinner during initial auth verification', () => {
      mockAuthService.verify.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(null), 1000))
      );
      mockAuthService.isAuthenticated.mockReturnValue(true);

      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      expect(screen.getByText('Authenticating...')).toBeInTheDocument();
    });

    test('Shows loading spinner during retry attempts', async () => {
      mockAuthService.verify
        .mockRejectedValueOnce({
          message: 'Network error',
          code: 'NETWORK_ERROR',
          recoverable: true
        })
        .mockImplementation(
          () => new Promise(resolve => setTimeout(() => resolve(null), 1000))
        );

      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('retry-auth-button')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('retry-auth-button'));

      expect(screen.getByText('Authenticating...')).toBeInTheDocument();
    });
  });

  describe('Error recovery scenarios', () => {
    test('Clears error state after successful retry', async () => {
      mockAuthService.verify
        .mockRejectedValueOnce({
          message: 'Network error',
          code: 'NETWORK_ERROR',
          recoverable: true
        })
        .mockResolvedValueOnce({ id: '1', username: 'test' });
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getUser.mockReturnValue({ id: '1', username: 'test' });

      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByTestId('retry-auth-button')).toBeInTheDocument();
      });

      // Click retry
      fireEvent.click(screen.getByTestId('retry-auth-button'));

      // Wait for success - error UI should disappear
      await waitFor(() => {
        expect(screen.queryByTestId('retry-auth-button')).not.toBeInTheDocument();
      });
    });

    test('Handles session expiry with redirect to login', async () => {
      mockAuthService.verify.mockRejectedValue({
        message: 'Your session has expired. Please log in again.',
        code: 'UNAUTHORIZED',
        recoverable: true
      });
      mockAuthService.isAuthenticated.mockReturnValue(true);

      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Go to Login')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Go to Login'));

      // Should clear auth state and show login page
      expect(mockAuthService.logout).toHaveBeenCalled();
    });
  });

  describe('Network resilience edge cases', () => {
    test('Handles complete network failure', async () => {
      mockFetch.mockRejectedValue(new Error('Network request failed'));

      const user = await authService.verify(3);
      
      expect(user).toBeNull();
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    test('Handles server 500 errors with retry', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error'
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, user: { id: '1' } })
        });

      const user = await authService.verify(3);
      
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(user).toEqual({ id: '1' });
    });

    test('Handles malformed JSON responses', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => { throw new Error('Malformed JSON'); }
      });

      const user = await authService.verify(2);
      
      expect(user).toBeNull();
    });
  });
});

describe('Auth Service API Compatibility', () => {
  test('Maintains backward compatibility with existing auth flow', () => {
    expect(authService.login).toBeDefined();
    expect(authService.signup).toBeDefined();
    expect(authService.verify).toBeDefined();
    expect(authService.logout).toBeDefined();
    expect(authService.isAuthenticated).toBeDefined();
    expect(authService.getUser).toBeDefined();
    expect(authService.getToken).toBeDefined();
  });

  test('Auth context provides all required methods', () => {
    const TestComponent = () => {
      const auth = require('../contexts/AuthContext').useAuth();
      
      // Verify all methods exist
      expect(auth.login).toBeDefined();
      expect(auth.logout).toBeDefined();
      expect(auth.retryAuth).toBeDefined();
      expect(auth.clearError).toBeDefined();
      expect(auth.isAuthenticated).toBeDefined();
      
      return null;
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
  });
});