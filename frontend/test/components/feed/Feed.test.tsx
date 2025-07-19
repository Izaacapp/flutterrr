import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Feed } from '../../../src/components/feed/Feed';
import { MockedProvider } from '@apollo/client/testing';
import React from 'react';

// Mock the generated query hook
vi.mock('../../../src/gql/generated', () => ({
  useGetPostsQuery: vi.fn(),
}));

// Mock the post service
vi.mock('../../../src/services/post.service', () => ({
  default: {
    toggleLike: vi.fn(),
  },
}));

import { useGetPostsQuery } from '../../../src/gql/generated';
import postService from '../../../src/services/post.service';

const mockUser = {
  _id: '1',
  username: 'testuser',
  email: 'test@example.com',
  fullName: 'Test User',
};

const mockPosts = [
  {
    _id: '1',
    content: 'First test post',
    author: {
      _id: '2',
      username: 'author1',
      fullName: 'Author One',
      avatar: null,
    },
    images: [],
    likes: [],
    comments: [],
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    _id: '2',
    content: 'Second test post',
    author: {
      _id: '3',
      username: 'author2',
      fullName: 'Author Two',
      avatar: null,
    },
    images: ['image.jpg'],
    likes: ['1'],
    comments: [],
    createdAt: '2024-01-02T00:00:00Z',
  },
];

// Create a mock AuthContext
const AuthContext = React.createContext({
  user: mockUser,
  setUser: vi.fn(),
  logout: vi.fn()
});

// Mock the useAuth hook
vi.mock('../../../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser
  })
}));

const renderFeed = () => {
  return render(
    <MockedProvider>
      <Feed />
    </MockedProvider>
  );
};

describe('Feed Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display loading state', () => {
    (useGetPostsQuery as any).mockReturnValue({
      loading: true,
      error: null,
      data: null,
      refetch: vi.fn(),
    });

    renderFeed();
    expect(screen.getByText('', { selector: '.spinner' })).toBeInTheDocument();
  });

  it('should display error state', () => {
    const mockError = new Error('Failed to fetch posts');
    (useGetPostsQuery as any).mockReturnValue({
      loading: false,
      error: mockError,
      data: null,
      refetch: vi.fn(),
    });

    renderFeed();
    expect(screen.getByText('Error loading posts')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch posts')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('should display empty state when no posts', () => {
    (useGetPostsQuery as any).mockReturnValue({
      loading: false,
      error: null,
      data: { posts: [] },
      refetch: vi.fn(),
    });

    renderFeed();
    expect(screen.getByText('Welcome to Passport Buddy')).toBeInTheDocument();
    expect(screen.getByText('No posts yet. Be the first to share your journey!')).toBeInTheDocument();
  });

  it('should display posts when data is available', () => {
    (useGetPostsQuery as any).mockReturnValue({
      loading: false,
      error: null,
      data: { posts: mockPosts },
      refetch: vi.fn(),
    });

    renderFeed();
    expect(screen.getByText('First test post')).toBeInTheDocument();
    expect(screen.getByText('Second test post')).toBeInTheDocument();
  });

  it('should handle like toggle', async () => {
    const mockRefetch = vi.fn();
    (useGetPostsQuery as any).mockReturnValue({
      loading: false,
      error: null,
      data: { posts: mockPosts },
      refetch: mockRefetch,
    });

    postService.toggleLike = vi.fn().mockResolvedValue({});

    renderFeed();
    
    // Find like buttons by aria-label
    const likeButtons = screen.getAllByLabelText('Like');
    await userEvent.click(likeButtons[0]);

    await waitFor(() => {
      expect(postService.toggleLike).toHaveBeenCalledWith('1');
      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  it('should poll for new posts', () => {
    const mockRefetch = vi.fn();
    (useGetPostsQuery as any).mockReturnValue({
      loading: false,
      error: null,
      data: { posts: mockPosts },
      refetch: mockRefetch,
    });

    renderFeed();

    // Verify the hook was called with pollInterval
    expect(useGetPostsQuery).toHaveBeenCalledWith({
      pollInterval: 10000,
    });
  });
});