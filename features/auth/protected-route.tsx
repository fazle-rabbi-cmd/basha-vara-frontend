'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-context';
import { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, allowedRoles, fallback }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const rolesKey = allowedRoles?.join(',') || '';

  useEffect(() => {
    if (!isLoading && isAuthenticated && user && allowedRoles) {
      if (!allowedRoles.includes(user.role)) {
        // Redirect to appropriate dashboard based on role
        if (user.role === 'tenant') {
          router.push('/tenant/dashboard');
        } else if (user.role === 'landlord') {
          router.push('/landlord/dashboard');
        } else if (user.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/');
        }
      }
    }
  }, [user, isLoading, rolesKey, router]);

  if (isLoading) {
    return fallback || <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return fallback || null;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return fallback || null;
  }

  return <>{children}</>;
}

export function TenantRoute({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return <ProtectedRoute allowedRoles={['tenant']} fallback={fallback}>{children}</ProtectedRoute>;
}

export function LandlordRoute({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return <ProtectedRoute allowedRoles={['landlord']} fallback={fallback}>{children}</ProtectedRoute>;
}

export function AdminRoute({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return <ProtectedRoute allowedRoles={['admin']} fallback={fallback}>{children}</ProtectedRoute>;
}
