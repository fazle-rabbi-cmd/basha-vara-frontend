import { useMemo } from 'react';
import { useAuth } from './auth-context';
import type { SystemPermission } from '@/types';

export function usePermissions() {
  const { user } = useAuth();

  const hasPermission = (permission: SystemPermission): boolean => {
    if (!user?.permissions) return false;
    return user.permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: SystemPermission[]): boolean => {
    return permissions.some((p) => hasPermission(p));
  };

  const hasAllPermissions = (permissions: SystemPermission[]): boolean => {
    return permissions.every((p) => hasPermission(p));
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    permissions: user?.permissions || [],
  };
}
