'use client';

import { Suspense, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PageLayout } from '@/components/layout/page-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/shared/toast';
import { apiClient } from '@/lib/api-client';

function SetPasswordContent() {
  const searchParams = useSearchParams();
  const [token] = useState(() => searchParams.get('token') ?? '');
  const { showToast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (token) {
      window.history.replaceState(null, '', '/set-password');
    }
  }, [token]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      showToast('error', 'This password link is missing or invalid. Request a new one.');
      return;
    }
    if (password !== confirmPassword) {
      showToast('error', 'Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await apiClient.auth.completePasswordSetup(token, password);
      setIsComplete(true);
      showToast('success', result.message);
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Unable to set password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout>
      <main className="mx-auto flex min-h-[calc(100vh-12rem)] w-full max-w-lg items-center px-4 py-12">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>{isComplete ? 'Password updated' : 'Choose a password'}</CardTitle>
            <CardDescription>
              {isComplete ? 'You can now sign in with your email and password.' : 'Use at least 8 characters.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isComplete ? (
              <Link href="/login" className="text-sm font-medium text-primary hover:underline">
                Go to sign in
              </Link>
            ) : !token ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">This link is missing or has expired.</p>
                <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                  Request another link
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
                    required
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving password...' : 'Set password'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </PageLayout>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <SetPasswordContent />
    </Suspense>
  );
}