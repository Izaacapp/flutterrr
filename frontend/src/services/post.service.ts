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
};

export default postService;