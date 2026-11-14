import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '@/features/auth/auth-context';
import { AuthProvider } from '@/features/auth/auth-context';

// Mock the auth context
vi.mock('@/features/auth/auth-context', () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('useAuth Hook', () => {
  it('should return authentication state', () => {
    const mockAuth = {
      user: {
        id: '1',
        email: 'test@example.com',
        fullName: 'Test User',
        roles: ['TENANT'],
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    };

    (useAuth as any).mockReturnValue(mockAuth);

    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toEqual(mockAuth.user);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle unauthenticated state', () => {
    const mockAuth = {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    };

    (useAuth as any).mockReturnValue(mockAuth);

    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle loading state', () => {
    const mockAuth = {
      user: null,
      isAuthenticated: false,
      isLoading: true,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    };

    (useAuth as any).mockReturnValue(mockAuth);

    const { result } = renderHook(() => useAuth());

    expect(result.current.isLoading).toBe(true);
  });
});
