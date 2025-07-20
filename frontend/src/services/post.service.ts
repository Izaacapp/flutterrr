const API_URL = `${import.meta.env.VITE_API_URL}/api`;

export const postService = {
  async toggleLike(postId: string): Promise<{ status: string; message: string }> {
    const token = localStorage.getItem('passport_buddy_token');
    
    const response = await fetch(`${API_URL}/posts/${postId}/like`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to toggle like');
    }

    return response.json();
  },

  async addComment(postId: string, content: string): Promise<{ status: string; message: string; comment: any }> {
    const token = localStorage.getItem('passport_buddy_token');
    
    const response = await fetch(`${API_URL}/posts/${postId}/comment`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      throw new Error('Failed to add comment');
    }

    return response.json();
  },

  async deleteComment(postId: string, commentId: string): Promise<{ status: string; message: string }> {
    const token = localStorage.getItem('passport_buddy_token');
    
    const response = await fetch(`${API_URL}/posts/${postId}/comment/${commentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete comment');
    }

    return response.json();
  },
};

export default postService;