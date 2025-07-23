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

export const postService = {
  async toggleLike(postId: string): Promise<{ status: string; message: string }> {
    return makeRequest(`/api/v1/posts/${postId}/like`, { method: 'POST' });
  },

  async addComment(postId: string, content: string): Promise<{ status: string; message: string; comment: any }> {
    return makeRequest(`/api/v1/posts/${postId}/comment`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  async deleteComment(postId: string, commentId: string): Promise<{ status: string; message: string }> {
    return makeRequest(`/api/v1/posts/${postId}/comment/${commentId}`, { method: 'DELETE' });
  },

  async deletePost(postId: string): Promise<{ status: string; message: string }> {
    return makeRequest(`/api/v1/posts/${postId}`, { method: 'DELETE' });
  },

  async incrementVideoViews(postId: string): Promise<{ status: string; message: string }> {
    return makeRequest(`/api/v1/posts/${postId}/views`, { method: 'POST' });
  },

  async createPost(data: FormData): Promise<{ status: string; message: string; post: any }> {
    const token = localStorage.getItem('passport_buddy_token');
    const response = await fetch(`${API_BASE}/api/v1/posts`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: data,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  },

  async sharePost(postId: string): Promise<{ status: string; message: string }> {
    return makeRequest(`/api/v1/posts/${postId}/share`, { method: 'POST' });
  }
};