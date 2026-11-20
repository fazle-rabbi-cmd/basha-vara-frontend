'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/auth-context';

export default function ApplicationsRedirect() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace('/login?redirect=/tenant/applications');
        return;
      }

      const role = user?.role?.toLowerCase();
      if (role === 'landlord' || user?.roles?.includes('landlord')) {
        router.replace('/landlord/applications');
      } else {
        router.replace('/tenant/applications');
      }
    }
  }, [user, isAuthenticated, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <p className="text-sm text-muted-foreground font-medium">Loading applications...</p>
      </div>
    </div>
  );
}
