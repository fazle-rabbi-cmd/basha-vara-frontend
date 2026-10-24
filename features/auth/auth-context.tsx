'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { User, LoginCredentials, RegisterData, UserRole } from '@/types';
import { apiClient } from '@/lib/api-client';
import { mockAuthService } from './mock-auth-service';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => Promise<void>;
  quickLogin: (role: UserRole) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize and restore session on mount
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      const token = typeof window !== 'undefined' ? localStorage.getItem('basha_vara_token') : null;

      if (token) {
        try {
          const liveUser = await apiClient.auth.getMe();
          if (isMounted) {
            setUser(liveUser);
          }
        } catch {
          // Token expired or invalid
          if (isMounted) {
            localStorage.removeItem('basha_vara_token');
            // Check in-memory fallback
            const fallbackUser = mockAuthService.getCurrentUser();
            setUser(fallbackUser);
          }
        }
      } else {
        const fallbackUser = mockAuthService.getCurrentUser();
        if (isMounted) {
          setUser(fallbackUser);
        }
      }

      if (isMounted) {
        setIsLoading(false);
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (credentials: LoginCredentials): Promise<User> => {
    setIsLoading(true);
    try {
      // Attempt live backend authentication
      const result = await apiClient.auth.login(credentials);
      setUser(result.user);
      return result.user;
    } catch (err: any) {
      // If live backend returns invalid credentials, throw it
      if (err.statusCode === 401 || err.statusCode === 400) {
        throw err;
      }
      // If network failure / connection refused, fallback to mock auth
      try {
        const fallbackUser = await mockAuthService.login(credentials);
        setUser(fallbackUser);
        return fallbackUser;
      } catch {
        throw err;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<User> => {
    setIsLoading(true);
    try {
      const result = await apiClient.auth.register(data);
      setUser(result.user);
      return result.user;
    } catch (err: any) {
      if (err.statusCode === 409 || err.statusCode === 400) {
        throw err;
      }
      try {
        const fallbackUser = await mockAuthService.register(data);
        setUser(fallbackUser);
        return fallbackUser;
      } catch {
        throw err;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await apiClient.auth.logout();
      await mockAuthService.logout();
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  };

  const quickLogin = async (role: UserRole): Promise<User> => {
    setIsLoading(true);
    try {
      let email = 'tenant1@example.com';
      if (role === 'landlord') email = 'landlord1@example.com';
      if (role === 'admin') email = 'admin@bashavara.com';

      const result = await apiClient.auth.login({
        email,
        password: 'Password123!',
      });
      setUser(result.user);
      return result.user;
    } catch {
      const fallbackUser = mockAuthService.quickLogin(role);
      setUser(fallbackUser);
      return fallbackUser;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        quickLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
