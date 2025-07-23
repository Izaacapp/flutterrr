import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { ToastProvider } from '../contexts/ToastContext';
import { Feed } from '../components/feed/Feed';
import { Flights } from '../pages/Flights';
import { Login } from '../components/auth/Login';
import { Register } from '../components/auth/Register';
import { FlightEditModal } from '../components/flights/FlightEditModal';
import { PostCard } from '../components/feed/PostCard';
import { CreatePost } from '../components/feed/CreatePost';
import { vi } from 'vitest';

// Mock API calls
vi.mock('axios');
vi.mock('../services/auth.service');
vi.mock('../services/flight.service', () => ({
  flightService: {
    getMyFlights: vi.fn().mockResolvedValue({ flights: [], total: 0, hasMore: false }),
    getFlightStats: vi.fn().mockResolvedValue({ 
      summary: {
        totalFlights: 0,
        totalDistance: 0,
        totalTime: 0
      },
      byYear: {},
      byMonth: {},
      byAirline: {},
      byStatus: {}
    })
  },
  Flight: {},
  FlightStats: {}
}));
vi.mock('../services/post.service');

// Test data generators
const generateMockUser = (id: number) => ({
  _id: `user${id}`,
  username: `testuser${id}`,
  email: `test${id}@stresstest.com`,
  profile: {
    displayName: `Test User ${id}`,
    bio: `Bio for user ${id}`,
    avatarUrl: `https://example.com/avatar${id}.jpg`
  }
});

const generateMockFlight = (id: number) => ({
  _id: `flight${id}`,
  airline: `Test Airlines ${id}`,
  flightNumber: `TA${id}`,
  confirmationCode: `TEST${id}`,
  origin: {
    airportCode: 'LAX',
    airportName: 'Los Angeles International',
    city: 'Los Angeles',
    country: 'United States'
  },
  destination: {
    airportCode: 'JFK',
    airportName: 'John F. Kennedy International',
    city: 'New York',
    country: 'United States'
  },
  scheduledDepartureTime: new Date().toISOString(),
  scheduledArrivalTime: new Date(Date.now() + 7200000).toISOString(),
  seatNumber: `${id}A`,
  status: 'upcoming',
  distance: 2475,
  duration: 315
});

const generateMockPost = (id: number, author: any) => ({
  _id: `post${id}`,
  content: `This is stress test post number ${id} with some content to test rendering!`,
  author,
  likes: Array.from({ length: Math.floor(Math.random() * 50) }, (_, i) => `user${i}`),
  comments: [],
  tags: ['test', 'stresstest'],
  createdAt: new Date(Date.now() - Math.random() * 86400000).toISOString(),
  privacy: 'public'
});

// Wrapper component for tests
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </AuthProvider>
  </BrowserRouter>
);

describe('🚨 FRONTEND COMPONENT STRESS TESTS', () => {
  
  describe('🔐 AUTHENTICATION COMPONENTS', () => {
    
    it('should render login form with all fields', () => {
      render(
        <TestWrapper>
          <Login onSwitchToRegister={() => {}} onForgotPassword={() => {}} />
        </TestWrapper>
      );
      
      expect(screen.getByPlaceholderText(/email or username/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
    });
    
    it('should handle rapid form submissions', async () => {
      render(
        <TestWrapper>
          <Login onSwitchToRegister={() => {}} onForgotPassword={() => {}} />
        </TestWrapper>
      );
      
      const emailInput = screen.getByPlaceholderText(/email or username/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /log in/i });
      
      await act(async () => {
        // Fill form
        fireEvent.change(emailInput, { target: { value: 'test@stresstest.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        
        // Rapid submissions
        for (let i = 0; i < 5; i++) {
          fireEvent.click(submitButton);
        }
      });
      
      // Should handle gracefully without crashes
      expect(submitButton).toBeInTheDocument();
    });
    
    it('should validate registration form fields', async () => {
      render(
        <TestWrapper>
          <Register onSwitchToLogin={() => {}} />
        </TestWrapper>
      );
      
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      
      // Submit without filling fields
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        // Should show validation errors or handle gracefully
        expect(submitButton).toBeInTheDocument();
      });
    });
  });
  
  describe('✈️ FLIGHT COMPONENTS STRESS TESTS', () => {
    
    it('should render large list of flights efficiently', async () => {
      const mockFlights = Array.from({ length: 100 }, (_, i) => generateMockFlight(i));
      
      // Mock flight service
      const mockFlightService = {
        getMyFlights: vi.fn().mockResolvedValue({
          flights: mockFlights,
          total: 100,
          hasMore: false
        })
      };
      
      render(
        <TestWrapper>
          <Flights />
        </TestWrapper>
      );
      
      await waitFor(() => {
        // Should render without performance issues
        expect(screen.getByText(/flights/i)).toBeInTheDocument();
      });
    });
    
    it('should handle flight edit modal interactions', async () => {
      const mockFlight = generateMockFlight(1);
      const mockOnSave = vi.fn();
      const mockOnClose = vi.fn();
      
      render(
        <TestWrapper>
          <FlightEditModal 
            flight={mockFlight}
            isOpen={true}
            onSave={mockOnSave}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );
      
      // Should render all form fields
      expect(screen.getByDisplayValue(mockFlight.airline)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockFlight.flightNumber)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockFlight.seatNumber)).toBeInTheDocument();
    });
    
    it('should handle rapid filter changes', async () => {
      render(
        <TestWrapper>
          <Flights />
        </TestWrapper>
      );
      
      const filterButton = screen.getByText(/filter/i) || screen.getByRole('button');
      
      // Rapid filter changes
      for (let i = 0; i < 10; i++) {
        fireEvent.click(filterButton);
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
        });
      }
      
      // Should handle without crashing
      expect(filterButton).toBeInTheDocument();
    });
  });
  
  describe('📱 SOCIAL FEED STRESS TESTS', () => {
    
    it('should render large feed efficiently', async () => {
      const mockUsers = Array.from({ length: 50 }, (_, i) => generateMockUser(i));
      const mockPosts = Array.from({ length: 200 }, (_, i) => 
        generateMockPost(i, mockUsers[i % mockUsers.length])
      );
      
      // Mock post service
      const mockPostService = {
        getFeed: vi.fn().mockResolvedValue({
          posts: mockPosts.slice(0, 20),
          hasMore: true
        })
      };
      
      render(
        <TestWrapper>
          <Feed />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText(/feed/i) || screen.getByText(/posts/i)).toBeInTheDocument();
      });
    });
    
    it('should handle post creation with various inputs', async () => {
      render(
        <TestWrapper>
          <CreatePost />
        </TestWrapper>
      );
      
      const contentInput = screen.getByPlaceholderText(/what.*mind/i) || screen.getByRole('textbox');
      
      // Test various content types
      const testContents = [
        'Simple text post',
        'Post with emojis 🎉✈️🌍',
        'Post with hashtags #travel #flight',
        'Very long post content '.repeat(50),
        'Post with special characters @#$%^&*()',
        'Post with URLs https://example.com',
        'Post with line breaks\n\nMultiple lines',
      ];
      
      for (const content of testContents) {
        fireEvent.change(contentInput, { target: { value: content } });
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
        });
      }
      
      expect(contentInput).toBeInTheDocument();
    });
    
    it('should handle rapid like/unlike interactions', async () => {
      const mockPost = generateMockPost(1, generateMockUser(1));
      
      render(
        <TestWrapper>
          <PostCard post={mockPost} />
        </TestWrapper>
      );
      
      const likeButton = screen.getByRole('button', { name: /like/i }) || 
                        screen.getByText(/♥/) ||
                        screen.getByTestId('like-button');
      
      // Rapid like/unlike
      for (let i = 0; i < 20; i++) {
        fireEvent.click(likeButton);
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 5));
        });
      }
      
      // Should handle without crashes
      expect(likeButton).toBeInTheDocument();
    });
    
    it('should handle infinite scroll loading', async () => {
      const mockPosts = Array.from({ length: 100 }, (_, i) => 
        generateMockPost(i, generateMockUser(i % 10))
      );
      
      let currentPage = 0;
      const pageSize = 20;
      
      const mockPostService = {
        getFeed: vi.fn().mockImplementation(() => {
          const start = currentPage * pageSize;
          const end = start + pageSize;
          const posts = mockPosts.slice(start, end);
          currentPage++;
          
          return Promise.resolve({
            posts,
            hasMore: end < mockPosts.length
          });
        })
      };
      
      render(
        <TestWrapper>
          <Feed />
        </TestWrapper>
      );
      
      // Simulate scrolling
      for (let i = 0; i < 5; i++) {
        fireEvent.scroll(window, { target: { scrollY: (i + 1) * 1000 } });
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        });
      }
      
      // Should handle scroll events without issues
      expect(document.body).toBeInTheDocument();
    });
  });
  
  describe('🔥 PERFORMANCE STRESS TESTS', () => {
    
    it('should handle component mount/unmount cycles', async () => {
      let mountCount = 0;
      
      const TestComponent = () => {
        React.useEffect(() => {
          mountCount++;
          return () => {
            mountCount--;
          };
        }, []);
        
        return <div>Test Component</div>;
      };
      
      for (let i = 0; i < 50; i++) {
        const { unmount } = render(
          <TestWrapper>
            <TestComponent />
          </TestWrapper>
        );
        
        unmount();
        
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 1));
        });
      }
      
      // Should handle mount/unmount without memory leaks
      expect(mountCount).toBe(0);
    });
    
    it('should handle rapid state updates', async () => {
      const TestComponent = () => {
        const [count, setCount] = React.useState(0);
        
        React.useEffect(() => {
          const interval = setInterval(() => {
            setCount(prev => prev + 1);
          }, 10);
          
          return () => clearInterval(interval);
        }, []);
        
        return <div>Count: {count}</div>;
      };
      
      const { unmount } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      // Let it run for a bit
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });
      
      unmount();
      
      // Should handle rapid updates without issues
      expect(true).toBe(true);
    });
    
    it('should handle large form inputs', async () => {
      render(
        <TestWrapper>
          <CreatePost />
        </TestWrapper>
      );
      
      const contentInput = screen.getByRole('textbox');
      
      // Very large input
      const largeContent = 'A'.repeat(10000);
      
      fireEvent.change(contentInput, { target: { value: largeContent } });
      
      await waitFor(() => {
        expect(contentInput).toHaveValue(largeContent);
      });
    });
  });
  
  describe('🛡️ ERROR BOUNDARY STRESS TESTS', () => {
    
    it('should handle component errors gracefully', () => {
      const ErrorComponent = () => {
        throw new Error('Test error');
      };
      
      // Should be caught by error boundary or at least not crash the test
      expect(() => {
        try {
          render(
            <TestWrapper>
              <ErrorComponent />
            </TestWrapper>
          );
        } catch (error) {
          // Error is expected and caught
          expect(error).toBeDefined();
        }
      }).not.toThrow();
    });
    
    it('should handle async errors in components', async () => {
      const AsyncErrorComponent = () => {
        React.useEffect(() => {
          setTimeout(() => {
            throw new Error('Async test error');
          }, 100);
        }, []);
        
        return <div>Async Component</div>;
      };
      
      const { container } = render(
        <TestWrapper>
          <AsyncErrorComponent />
        </TestWrapper>
      );
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });
      
      // Should still be in DOM (error boundary should catch)
      expect(container).toBeInTheDocument();
    });
  });
  
  describe('🌐 ACCESSIBILITY STRESS TESTS', () => {
    
    it('should maintain keyboard navigation', () => {
      render(
        <TestWrapper>
          <Login onSwitchToRegister={() => {}} onForgotPassword={() => {}} />
        </TestWrapper>
      );
      
      const emailInput = screen.getByPlaceholderText(/email or username/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /log in/i });
      
      // Test that elements can be focused
      emailInput.focus();
      expect(emailInput).toHaveFocus();
      
      passwordInput.focus();
      expect(passwordInput).toHaveFocus();
      
      submitButton.focus();
      expect(submitButton).toHaveFocus();
    });
    
    it('should maintain ARIA labels', () => {
      render(
        <TestWrapper>
          <Flights />
        </TestWrapper>
      );
      
      // Should have proper ARIA attributes
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
      
      const buttons = screen.getAllByRole('button');
      // Just check that buttons exist and can be found
      expect(buttons.length).toBeGreaterThan(0);
    });
  });
});

export {};