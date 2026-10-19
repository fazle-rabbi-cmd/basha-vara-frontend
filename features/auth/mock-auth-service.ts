// Mock Authentication Service for Prototype
// This is clearly marked as prototype-only and should never be used in production

import React from 'react';
import { User, LoginCredentials, RegisterData, UserRole } from '@/types';
import { mockUsers } from '@/mocks/data';

// Simple in-memory state for prototype (resets on refresh)
let currentUser: User | null = null;

export const mockAuthService = {
  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return currentUser !== null;
  },

  // Get current user
  getCurrentUser: (): User | null => {
    return currentUser;
  },

  // Login with credentials
  login: async (credentials: LoginCredentials): Promise<User> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // For prototype, accept any valid-looking email
    // In production, this would validate against a real backend
    const user = mockUsers.find(u => u.email === credentials.email);

    if (user) {
      currentUser = user;
      return user;
    }

    // For prototype testing, create a temporary user if not found
    // This allows testing without pre-registered accounts
    const tempUser: User = {
      id: `temp-${Date.now()}`,
      email: credentials.email,
      name: credentials.email.split('@')[0],
      role: 'tenant', // Default to tenant for prototype
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    currentUser = tempUser;
    return tempUser;
  },

  // Register new user
  register: async (data: RegisterData): Promise<User> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const newUser: User = {
      id: `user-${Date.now()}`,
      email: data.email,
      name: data.name,
      phone: data.phone,
      role: data.role,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockUsers.push(newUser);
    currentUser = newUser;
    return newUser;
  },

  // Logout
  logout: async (): Promise<void> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    currentUser = null;
  },

  // Quick login for prototype testing (bypasses form)
  quickLogin: (role: UserRole): User => {
    const user = mockUsers.find(u => u.role === role);
    if (user) {
      currentUser = user;
      return user;
    }
    throw new Error(`No mock user found for role: ${role}`);
  },
};

// React hook for authentication state
export const useAuth = () => {
  const [user, setUser] = React.useState<User | null>(mockAuthService.getCurrentUser());
  const [isLoading, setIsLoading] = React.useState(false);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const loggedInUser = await mockAuthService.login(credentials);
      setUser(loggedInUser);
      return loggedInUser;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const newUser = await mockAuthService.register(data);
      setUser(newUser);
      return newUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await mockAuthService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = (role: UserRole) => {
    const user = mockAuthService.quickLogin(role);
    setUser(user);
    return user;
  };

  return {
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    register,
    logout,
    quickLogin,
  };
};
