const API_URL = `${import.meta.env.VITE_API_URL}/api/auth`;

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
  email?: string;
}

class AuthService {
  private token: string | null = null;
  private user: User | null = null;

  constructor() {
    // Load token from localStorage on init
    const TOKEN_KEY = import.meta.env.VITE_AUTH_TOKEN_KEY || 'passport_buddy_token';
    const USER_KEY = import.meta.env.VITE_AUTH_USER_KEY || 'passport_buddy_user';
    this.token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    if (userStr) {
      try {
        this.user = JSON.parse(userStr);
      } catch (e) {
        console.error('Failed to parse user data');
      }
    }
  }

  async signup(
    username: string,
    email: string,
    password: string,
    fullName: string
  ): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username, email, password, fullName }),
      });

      const data = await response.json();
      
      // Handle successful signup with token
      if (data.status === 'success' && data.token && data.data?.user) {
        console.log('Signup response:', data);
        console.log('User emailVerified:', data.data.user.emailVerified);
        this.setAuthData(data.token, data.data.user);
      }

      return data;
    } catch (error) {
      console.error('Signup error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  async verifyAccount(otp: string): Promise<AuthResponse> {
    if (!this.token) {
      return { success: false, message: 'No authentication token found' };
    }

    try {
      const response = await fetch(`${API_URL}/verify-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ otp }),
      });

      const data = await response.json();

      if (data.status === 'success' && data.data?.user) {
        // Update user data with verified status
        this.user = data.data.user;
        const USER_KEY = import.meta.env.VITE_AUTH_USER_KEY || 'passport_buddy_user';
        localStorage.setItem(USER_KEY, JSON.stringify(data.data.user));
      }

      return data;
    } catch (error) {
      console.error('Verify account error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  async resendOTP(): Promise<OTPResponse> {
    if (!this.token) {
      return { success: false, message: 'No authentication token found' };
    }

    try {
      const response = await fetch(`${API_URL}/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        credentials: 'include',
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Resend OTP error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  async login(emailOrUsername: string, password: string): Promise<AuthResponse> {
    try {
      // Determine if it's an email or username
      const isEmail = emailOrUsername.includes('@');
      const body = isEmail 
        ? { email: emailOrUsername, password }
        : { username: emailOrUsername, password };
      
      console.log('Login attempt:', { emailOrUsername, isEmail, body });
      console.log('API URL:', `${API_URL}/login`);
        
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.status === 'success' && data.token) {
        this.setAuthData(data.token, data.data?.user || data.user);
        
        // Check if user needs verification
        if (data.needsVerification) {
          return {
            ...data,
            success: true,
          };
        }
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  async verify(): Promise<AuthResponse> {
    if (!this.token) {
      return { success: false, message: 'No token found' };
    }

    try {
      const response = await fetch(`${API_URL}/verify`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success && data.user) {
        this.user = data.user;
        const USER_KEY = import.meta.env.VITE_AUTH_USER_KEY || 'passport_buddy_user';
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      } else {
        this.logout();
      }

      return data;
    } catch (error) {
      console.error('Verify error:', error);
      return {
        success: false,
        message: 'Failed to verify token',
      };
    }
  }

  async forgotPassword(email: string): Promise<OTPResponse> {
    try {
      const response = await fetch(`${API_URL}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Forgot password error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  async resetPassword(
    email: string, 
    otp: string, 
    password: string, 
    passwordConfirm: string
  ): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, otp, password, passwordConfirm }),
      });

      const data = await response.json();
      
      if (data.status === 'success' && data.token && data.data?.user) {
        this.setAuthData(data.token, data.data.user);
      }

      return data;
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${API_URL}/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.token = null;
      this.user = null;
      const TOKEN_KEY = import.meta.env.VITE_AUTH_TOKEN_KEY || 'passport_buddy_token';
      const USER_KEY = import.meta.env.VITE_AUTH_USER_KEY || 'passport_buddy_user';
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  }

  private setAuthData(token: string, user: User): void {
    this.token = token;
    this.user = user;
    const TOKEN_KEY = import.meta.env.VITE_AUTH_TOKEN_KEY || 'passport_buddy_token';
    const USER_KEY = import.meta.env.VITE_AUTH_USER_KEY || 'passport_buddy_user';
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
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

  needsVerification(): boolean {
    return this.user ? !this.user.emailVerified : false;
  }

}

export default new AuthService();