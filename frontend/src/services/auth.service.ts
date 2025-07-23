export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  avatar?: string;
  bio?: string;
  location?: string;
  homeAirport?: string;
  passportCountry?: string;
  milesFlown?: number;
  countriesVisited?: string[];
  emailVerified?: boolean;
}

export interface AuthResponse {
  status?: string;
  success?: boolean;
  message: string;
  token?: string;
  data?: {
    user: User;
  };
  user?: User;
  needsVerification?: boolean;
}

export interface OTPResponse {
  status?: string;
  success?: boolean;
  message: string;
}

export interface AuthError {
  message: string;
  code: string;
  recoverable: boolean;
}

class AuthService {
  private token: string | null = null;
  private user: User | null = null;
  private readonly TOKEN_KEY: string;
  private readonly USER_KEY: string;
  private baseUrl: string;

  constructor() {
    this.TOKEN_KEY = import.meta.env.VITE_AUTH_TOKEN_KEY || 'passport_buddy_token';
    this.USER_KEY = import.meta.env.VITE_AUTH_USER_KEY || 'passport_buddy_user';
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    
    const storedToken = localStorage.getItem(this.TOKEN_KEY);
    const storedUser = localStorage.getItem(this.USER_KEY);
    
    if (storedToken) {
      this.token = storedToken;
    }
    
    if (storedUser) {
      try {
        this.user = JSON.parse(storedUser);
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem(this.USER_KEY);
      }
    }

    console.log('🔧 AUTH_SERVICE: Initialized with baseUrl:', this.baseUrl);
  }

  private async makeRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}/api/auth${endpoint}`;
    
    try {
      console.log(`🌐 AUTH_REQUEST: ${options.method || 'GET'} ${url}`);
      
      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(this.token && { Authorization: `Bearer ${this.token}` }),
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }
      
      console.log(`✅ AUTH_REQUEST: Success for ${endpoint}`);
      return data;

    } catch (error) {
      console.error(`❌ AUTH_REQUEST: Failed for ${endpoint}:`, error);
      throw error;
    }
  }

  async login(emailOrUsername: string, password: string): Promise<AuthResponse> {
    const response = await this.makeRequest<AuthResponse>('/login', {
      method: 'POST',
      body: JSON.stringify({ emailOrUsername, password }),
    });

    if (response.token) {
      this.setToken(response.token);
    }

    if (response.data?.user || response.user) {
      this.setUser(response.data?.user || response.user!);
    }

    return response;
  }

  async signup(username: string, email: string, password: string, fullName: string): Promise<AuthResponse> {
    const response = await this.makeRequest<AuthResponse>('/signup', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, fullName }),
    });

    if (response.token) {
      this.setToken(response.token);
    }

    if (response.data?.user || response.user) {
      this.setUser(response.data?.user || response.user!);
    }

    return response;
  }

  async verify(): Promise<User | null> {
    try {
      const response = await this.makeRequest<{ user: User }>('/verify');
      
      if (response.user) {
        this.setUser(response.user);
        return response.user;
      }
      
      return null;
    } catch (error) {
      this.clearAuth();
      return null;
    }
  }

  async verifyAccount(otp: string): Promise<AuthResponse> {
    const response = await this.makeRequest<AuthResponse>('/verify-account', {
      method: 'POST',
      body: JSON.stringify({ otp }),
    });

    if (response.data?.user || response.user) {
      this.setUser(response.data?.user || response.user!);
    }

    return response;
  }

  async resendOTP(): Promise<OTPResponse> {
    return await this.makeRequest<OTPResponse>('/resend-otp', {
      method: 'POST',
    });
  }

  async logout(): Promise<void> {
    try {
      await this.makeRequest('/logout', { method: 'POST' });
    } catch (error) {
      console.warn('Logout request failed:', error);
    }
    
    this.clearAuth();
  }

  private setToken(token: string): void {
    this.token = token;
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private setUser(user: User): void {
    this.user = user;
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  private clearAuth(): void {
    this.token = null;
    this.user = null;
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  getToken(): string | null {
    return this.token;
  }

  getUser(): User | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  async forgotPassword(email: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset email');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  async getBackendStatus(): Promise<{healthy: boolean; message?: string}> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
      });

      if (response.ok) {
        return { healthy: true };
      } else {
        return { healthy: false, message: 'Backend is not responding' };
      }
    } catch (error) {
      return { healthy: false, message: 'Cannot connect to backend' };
    }
  }

  async refreshBackendHealth(): Promise<void> {
    // This method is used to refresh the backend health status
    // It can trigger a health check or clear any cached status
    await this.getBackendStatus();
  }
}

export default new AuthService();