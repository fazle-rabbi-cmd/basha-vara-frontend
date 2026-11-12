'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TenantProfileDocumentsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/settings?tab=documents');
  }, [router]);

  return null;
}
