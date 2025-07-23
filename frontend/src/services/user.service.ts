import { requestDeduplicator } from '../utils/requestDeduplicator';

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

export const userService = {
  async updateProfile(updates: any) {
    return makeRequest('/api/v1/users/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async getProfile(userId?: string) {
    const endpoint = userId ? `/api/v1/users/${userId}` : '/api/v1/users/profile';
    return makeRequest(endpoint);
  },

  async searchUsers(query: string) {
    return requestDeduplicator.deduplicate(
      `user-search-${query}`,
      () => makeRequest(`/api/v1/users/search?q=${encodeURIComponent(query)}`)
    );
  },

  async getProfileByUsername(username: string) {
    return requestDeduplicator.deduplicate(
      `user-profile-${username}`,
      () => makeRequest(`/api/v1/users/profile/${username}`)
    );
  },

  async followUser(userId: string) {
    return makeRequest(`/api/v1/users/follow/${userId}`, {
      method: 'POST',
    });
  },

  async unfollowUser(userId: string) {
    return makeRequest(`/api/v1/users/follow/${userId}`, {
      method: 'DELETE',
    });
  },

  async blockUser(userId: string) {
    return makeRequest(`/api/v1/users/block/${userId}`, {
      method: 'POST',
    });
  },

  async unblockUser(userId: string) {
    return makeRequest(`/api/v1/users/block/${userId}`, {
      method: 'DELETE',
    });
  },

  async getFollowers(userId: string) {
    return makeRequest(`/api/v1/users/${userId}/followers`);
  },

  async getFollowing(userId: string) {
    return makeRequest(`/api/v1/users/${userId}/following`);
  }
};