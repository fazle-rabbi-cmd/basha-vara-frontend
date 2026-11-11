'use client';

import React from 'react';
import { usePermissions } from '@/features/auth/use-permissions';
import type { SystemPermission } from '@/types';

interface PermissionGateProps {
  children: React.ReactNode;
  permissions: SystemPermission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
}

export function PermissionGate({
  children,
  permissions,
  requireAll = false,
  fallback = null,
}: PermissionGateProps) {
  const { hasAnyPermission, hasAllPermissions } = usePermissions();

  const hasAccess = requireAll
    ? hasAllPermissions(permissions)
    : hasAnyPermission(permissions);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
