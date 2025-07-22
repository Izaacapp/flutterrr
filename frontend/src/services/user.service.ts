// Unused imports removed for cleanliness.

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
        // Use a custom Error class or object if you have one, otherwise this is fine.
        const errorData = await response.json().catch(() => ({ 
            message: 'An unknown error occurred' 
        }));
        const error = new Error(errorData.message || `Request failed with status ${response.status}`);
        // Attach the response object for more context in the calling code
        (error as any).response = response; 
        throw error;
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

  async getProfile(): Promise<ApiResponse> {
    return this.makeRequest(`${this.baseUrl}/profile`);
  }

  async getProfileByUsername(username: string): Promise<ApiResponse> {
    return this.makeRequest(`${this.baseUrl}/profile/${username}`);
  }
  
  async updateAvatar(image: File): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('avatar', image);

    const token = this.getAuthToken();
    const response = await fetch(`${this.baseUrl}/avatar`, {
        method: 'POST',
        headers: {
            ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: formData
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update avatar' }));
        const error = new Error(errorData.message);
        (error as any).response = response;
        throw error;
    }
    
    return response.json();
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

  // Merged method signature, combining the safety of 'main' with the new field from 'feats'
  async updateProfile(profileData: {
    fullName?: string;
    username?: string; // Added from the 'feats' branch functionality
    bio?: string;
    location?: string;
    homeAirport?: string;
    passportCountry?: string;
  }): Promise<ApiResponse> {
    return this.makeRequest(`${this.baseUrl}/profile`, {
      method: 'PATCH',
      body: JSON.stringify(profileData),
    });
  }
}

export const userService = new UserService();