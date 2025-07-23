const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function makeRequest(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('passport_buddy_token');
  const url = `${API_BASE}${endpoint}`;
  
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export const bookmarkService = {
  async toggleBookmark(postId: string) {
    return makeRequest(`/api/v1/posts/${postId}/bookmark`, {
      method: 'POST',
    });
  },

  async getBookmarkedPosts() {
    return makeRequest('/api/v1/posts/bookmarked');
  },

  async isBookmarked(postId: string) {
    const response = await makeRequest(`/api/v1/posts/${postId}/bookmark/status`);
    return response.isBookmarked;
  }
};