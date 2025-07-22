import React, { createContext, useContext, useState, useEffect } from 'react';
import authService, { User, AuthResponse, OTPResponse } from '../services/auth.service';
import { userService } from '../services/user.service';
import { client } from '../main';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  signup: (username: string, email: string, password: string, fullName: string) => Promise<AuthResponse>;
  verifyAccount: (otp: string) => Promise<AuthResponse>;
  resendOTP: () => Promise<OTPResponse>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  refreshUserProfile: () => Promise<void>;
  isAuthenticated: boolean;
  needsVerification: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(authService.getUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verify token on mount
    const verifyAuth = async () => {
      if (authService.isAuthenticated()) {
        const response = await authService.verify();
        if (response.success && response.user) {
          setUser(response.user);
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    };

    verifyAuth();
  }, []);

  const login = async (emailOrUsername: string, password: string): Promise<AuthResponse> => {
    const response = await authService.login(emailOrUsername, password);
    if (response.status === 'success' && response.data?.user) {
      setUser(response.data.user);
      // Reset Apollo cache to refetch all queries with new auth token
      await client.resetStore();
    }
    return response;
  };

  const signup = async (
    username: string,
    email: string,
    password: string,
    fullName: string
  ): Promise<AuthResponse> => {
    const response = await authService.signup(username, email, password, fullName);
    if (response.status === 'success' && response.data?.user) {
      setUser(response.data.user);
      // Reset Apollo cache to refetch all queries with new auth token
      await client.resetStore();
    }
    return response;
  };

  const verifyAccount = async (otp: string): Promise<AuthResponse> => {
    const response = await authService.verifyAccount(otp);
    if (response.status === 'success' && response.data?.user) {
      setUser(response.data.user);
      // Reset Apollo cache to refetch all queries with new auth token
      await client.resetStore();
    }
    return response;
  };

  const resendOTP = async (): Promise<OTPResponse> => {
    return await authService.resendOTP();
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    // Clear Apollo cache on logout
    await client.clearStore();
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      // Update localStorage as well
      const USER_KEY = import.meta.env.VITE_AUTH_USER_KEY || 'passport_buddy_user';
      localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    }
  };

  const refreshUserProfile = async () => {
    if (authService.isAuthenticated()) {
      try {
        const response = await userService.getProfile();
        if (response.status === 'success' && response.data?.user) {
          setUser(response.data.user);
          // Update localStorage as well
          const USER_KEY = import.meta.env.VITE_AUTH_USER_KEY || 'passport_buddy_user';
          localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
        }
      } catch (error) {
        console.error('Failed to refresh user profile:', error);
      }
    }
  };

  const needsVerificationValue = user ? !user.emailVerified : false;
  console.log('AuthContext - user:', user, 'needsVerification:', needsVerificationValue);
  
  const value: AuthContextType = {
    user,
    loading,
    login,
    signup,
    verifyAccount,
    resendOTP,
    logout,
    updateUser,
    refreshUserProfile,
    isAuthenticated: !!user && !!authService.getToken(),
    needsVerification: needsVerificationValue,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};