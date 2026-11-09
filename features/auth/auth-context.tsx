'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { User, LoginCredentials, RegisterData } from '@/types';
import { apiClient } from '@/lib/api-client';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => Promise<void>;
  googleLogin: (credential: string, role?: 'tenant' | 'landlord') => Promise<User>;
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
          }
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

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let subscription: { remove: () => Promise<void> } | undefined;
    App.addListener('appUrlOpen', async ({ url }) => {
      if (!url.startsWith('bashavara://auth/callback')) return;

      const token = new URL(url).searchParams.get('token');
      if (!token) return;

      localStorage.setItem('basha_vara_token', token);
      await Browser.close().catch(() => undefined);
      try {
        const liveUser = await apiClient.auth.getMe();
        setUser(liveUser);
        const destination = liveUser.roles?.includes('landlord')
          ? '/landlord/dashboard'
          : liveUser.roles?.includes('admin')
          ? '/admin/dashboard'
          : '/tenant/dashboard';
        window.location.assign(destination);
      } catch {
        localStorage.removeItem('basha_vara_token');
      }
    }).then((handle) => {
      subscription = handle;
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  const login = async (credentials: LoginCredentials): Promise<User> => {
    setIsLoading(true);
    try {
      const result = await apiClient.auth.login(credentials);
      setUser(result.user);
      return result.user;
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
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await apiClient.auth.logout();
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  };

  const googleLogin = async (credential: string, role?: 'tenant' | 'landlord'): Promise<User> => {
    setIsLoading(true);
    try {
      const result = await apiClient.auth.googleLogin(credential, role);
      setUser(result.user);
      return result.user;
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
        googleLogin,
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
