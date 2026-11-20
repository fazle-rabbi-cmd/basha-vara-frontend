'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LandlordRoute } from '@/features/auth/protected-route';

function NewPropertyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Redirect to main properties page with dialog open
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.set('dialog', 'add');
    router.replace(`/landlord/properties?${currentParams.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

export default function NewPropertyPage() {
  return (
    <LandlordRoute>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }>
        <NewPropertyContent />
      </Suspense>
    </LandlordRoute>
  );
}
