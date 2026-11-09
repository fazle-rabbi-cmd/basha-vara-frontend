'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Building2, LoaderCircle } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1';

function NativeGoogleStartContent() {
  const searchParams = useSearchParams();
  const [hasError, setHasError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const role = searchParams.get('role') === 'LANDLORD' ? 'LANDLORD' : 'TENANT';

  useEffect(() => {
    let cancelled = false;
    const checkBackend = async () => {
      setHasError(false);
      const deadline = Date.now() + 90_000;

      while (!cancelled && Date.now() < deadline) {
        try {
          const response = await fetch('/api/auth/native-google/health', { cache: 'no-store' });
          const result = await response.json();
          if (response.ok && result.ready) {
            const authUrl = new URL(`${API_BASE_URL.replace(/\/$/, '')}/auth/google/native/start`);
            authUrl.searchParams.set('role', role);
            window.location.replace(authUrl.toString());
            return;
          }
        } catch {
          // Keep the branded waiting screen visible while the API wakes up.
        }

        await new Promise((resolve) => window.setTimeout(resolve, 2500));
      }

      if (!cancelled) setHasError(true);
    };

    void checkBackend();
    return () => {
      cancelled = true;
    };
  }, [attempt, role]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#0b1115] px-6 text-white">
      <section className="w-full max-w-sm text-center" aria-live="polite">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Building2 className="h-9 w-9" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-semibold">Basha Vara</h1>
        <p className="mt-2 text-sm text-white/70">
          {hasError ? 'We could not connect right now.' : 'Connecting securely to Google sign-in...'}
        </p>
        {hasError ? (
          <button
            type="button"
            onClick={() => setAttempt((value) => value + 1)}
            className="mt-6 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
          >
            Try again
          </button>
        ) : (
          <div className="mt-7 flex items-center justify-center gap-3 text-sm text-white/60">
            <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
            <span>Preparing secure sign-in</span>
          </div>
        )}
      </section>
    </main>
  );
}

export default function NativeGoogleStartPage() {
  return (
    <Suspense fallback={<main className="min-h-dvh bg-[#0b1115]" />}>
      <NativeGoogleStartContent />
    </Suspense>
  );
}
