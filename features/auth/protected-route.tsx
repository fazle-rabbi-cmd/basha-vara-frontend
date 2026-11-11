'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-context';
import { usePermissions } from './use-permissions';
import { UserRole, Permission } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredPermissions?: Permission[];
  requireAllPermissions?: boolean;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  requiredPermissions,
  requireAllPermissions = false,
  fallback,
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { hasAnyPermission, hasAllPermissions } = usePermissions();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const rolesKey = allowedRoles?.join(',') || '';
  const permsKey = requiredPermissions?.join(',') || '';

  useEffect(() => {
    if (!isLoading && isAuthenticated && user && allowedRoles) {
      const userRoles: UserRole[] = (user.roles as UserRole[]) || (user.role ? [user.role] : []);
      const hasAllowedRole = allowedRoles.some(role => userRoles.includes(role));

      if (!hasAllowedRole) {
        if (userRoles.includes('tenant')) {
          router.push('/tenant/dashboard');
        } else if (userRoles.includes('landlord')) {
          router.push('/landlord/dashboard');
        } else if (userRoles.includes('moderator') || userRoles.includes('admin') || userRoles.includes('super_admin')) {
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

  const userRoles: UserRole[] = (user?.roles as UserRole[]) || (user?.role ? [user.role] : []);
  const hasRole = !allowedRoles || allowedRoles.some(role => userRoles.includes(role));
  const hasPermission = !requiredPermissions ||
    (requireAllPermissions
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions));

  const hasAccess = hasRole && hasPermission;

  if (!hasAccess) {
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
  return <ProtectedRoute allowedRoles={['admin', 'super_admin']} fallback={fallback}>{children}</ProtectedRoute>;
}

export function ModeratorRoute({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return <ProtectedRoute allowedRoles={['moderator', 'admin', 'super_admin']} fallback={fallback}>{children}</ProtectedRoute>;
}
