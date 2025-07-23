import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService, { User, AuthResponse, OTPResponse, AuthError } from '../services/auth.service';
import { client } from '../config/apollo-client';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  errorCode?: string;
  isRecoverable?: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  signup: (username: string, email: string, password: string, fullName: string) => Promise<AuthResponse>;
  verifyAccount: (otp: string) => Promise<AuthResponse>;
  resendOTP: () => Promise<OTPResponse>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  retryAuth: () => Promise<void>;
  clearError: () => void;
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
  const [authState, setAuthState] = useState<AuthState>({
    user: authService.getUser(),
    loading: true,
    error: null,
  });

  const verifyAuth = useCallback(async () => {
    if (import.meta.env.DEV) {
      console.log('🔍 AUTH_PROVIDER: Starting auth verification');
    }
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      if (authService.isAuthenticated()) {
        if (import.meta.env.DEV) {
          console.log('🔍 AUTH_PROVIDER: Token exists, verifying...');
        }
        const user = await authService.verify();
        if (user) {
          if (import.meta.env.DEV) {
            console.log('✅ AUTH_PROVIDER: Verification successful');
          }
          setAuthState({
            user,
            loading: false,
            error: null,
          });
        } else {
          if (import.meta.env.DEV) {
            console.log('❌ AUTH_PROVIDER: Token invalid, clearing state');
          }
          setAuthState({
            user: null,
            loading: false,
            error: null,
          });
        }
      } else {
        if (import.meta.env.DEV) {
          console.log('🔍 AUTH_PROVIDER: No token found');
        }
        setAuthState({
          user: null,
          loading: false,
          error: null,
        });
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('❌ AUTH_PROVIDER: Verification failed:', error);
      }
      setAuthState({
        user: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      });
    }
  }, []);

  useEffect(() => {
    verifyAuth();
  }, []); // Remove verifyAuth dependency to prevent infinite loop

  const login = async (emailOrUsername: string, password: string): Promise<AuthResponse> => {
    const response = await authService.login(emailOrUsername, password);
    if (response.status === 'success' && response.data?.user) {
      setAuthState(prev => ({ ...prev, user: response.data!.user, error: null }));
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
      setAuthState(prev => ({ ...prev, user: response.data!.user, error: null }));
      await client.resetStore();
    }
    return response;
  };

  const verifyAccount = async (otp: string): Promise<AuthResponse> => {
    const response = await authService.verifyAccount(otp);
    if (response.status === 'success' && response.data?.user) {
      setAuthState(prev => ({ ...prev, user: response.data!.user, error: null }));
      await client.resetStore();
    }
    return response;
  };

  const resendOTP = async (): Promise<OTPResponse> => {
    return await authService.resendOTP();
  };

  const logout = async () => {
    await authService.logout();
    setAuthState({
      user: null,
      loading: false,
      error: null,
    });
    await client.clearStore();
  };

  const updateUser = (updates: Partial<User>) => {
    if (authState.user) {
      const updatedUser = { ...authState.user, ...updates };
      setAuthState(prev => ({ ...prev, user: updatedUser }));
      const USER_KEY = import.meta.env.VITE_AUTH_USER_KEY || 'passport_buddy_user';
      localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    }
  };

  const retryAuth = useCallback(async () => {
    if (import.meta.env.DEV) {
      console.log('🔄 AUTH_PROVIDER: Retrying authentication');
    }
    await verifyAuth();
  }, [verifyAuth]);

  const clearError = useCallback(() => {
    if (import.meta.env.DEV) {
      console.log('🧹 AUTH_PROVIDER: Clearing error state');
    }
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  const needsVerificationValue = authState.user ? !authState.user.emailVerified : false;
  
  const value: AuthContextType = {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    errorCode: undefined,
    isRecoverable: true,
    login,
    signup,
    verifyAccount,
    resendOTP,
    logout,
    updateUser,
    retryAuth,
    clearError,
    isAuthenticated: !!authState.user && !!authService.getToken(),
    needsVerification: needsVerificationValue,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};