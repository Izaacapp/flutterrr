const API_URL = `${import.meta.env.VITE_API_URL}/api/users`;

export interface BookmarkResponse {
  status: string;
  message?: string;
  error?: string;
}

export interface BookmarksResponse {
  status: string;
  data?: {
    bookmarks: any[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalBookmarks: number;
      hasMore: boolean;
    };
  };
  message?: string;
  error?: string;
}

class BookmarkService {
  private getAuthHeaders() {
    const TOKEN_KEY = import.meta.env.VITE_AUTH_TOKEN_KEY || 'passport_buddy_token';
    const token = localStorage.getItem(TOKEN_KEY);
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  async bookmarkPost(postId: string): Promise<BookmarkResponse> {
    try {
      const response = await fetch(`${API_URL}/bookmark/${postId}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        credentials: 'include',
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Bookmark post error:', error);
      return {
        status: 'error',
        message: 'Failed to bookmark post',
      };
    }
  }

  async unbookmarkPost(postId: string): Promise<BookmarkResponse> {
    try {
      const response = await fetch(`${API_URL}/bookmark/${postId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
        credentials: 'include',
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Unbookmark post error:', error);
      return {
        status: 'error',
        message: 'Failed to remove bookmark',
      };
    }
  }

  async getBookmarks(page: number = 1, limit: number = 10): Promise<BookmarksResponse> {
    try {
      const response = await fetch(`${API_URL}/bookmarks?page=${page}&limit=${limit}`, {
        headers: this.getAuthHeaders(),
        credentials: 'include',
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get bookmarks error:', error);
      return {
        status: 'error',
        message: 'Failed to fetch bookmarks',
      };
    }
  }
}

export default new BookmarkService();