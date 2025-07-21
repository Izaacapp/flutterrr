interface ApiResponse<T = any> {
  status: string;
  data?: T;
  message?: string;
}

class UserService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${import.meta.env.VITE_API_URL}/api/users`;
  }

  private getAuthToken(): string | null {
    const TOKEN_KEY = import.meta.env.VITE_AUTH_TOKEN_KEY || 'passport_buddy_token';
    return localStorage.getItem(TOKEN_KEY);
  }

  private async makeRequest<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const token = this.getAuthToken();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }

    return response.json();
  }

  async followUser(userId: string): Promise<ApiResponse> {
    return this.makeRequest(`${this.baseUrl}/follow/${userId}`, {
      method: 'POST',
    });
  }

  async unfollowUser(userId: string): Promise<ApiResponse> {
    return this.makeRequest(`${this.baseUrl}/follow/${userId}`, {
      method: 'DELETE',
    });
  }

  async getProfileByUsername(username: string): Promise<ApiResponse> {
    return this.makeRequest(`${this.baseUrl}/profile/${username}`);
  }

  async blockUser(userId: string): Promise<ApiResponse> {
    return this.makeRequest(`${this.baseUrl}/block/${userId}`, {
      method: 'POST',
    });
  }

  async unblockUser(userId: string): Promise<ApiResponse> {
    return this.makeRequest(`${this.baseUrl}/block/${userId}`, {
      method: 'DELETE',
    });
  }
}

export const userService = new UserService();