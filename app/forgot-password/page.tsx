'use client';

import { type FormEvent, useState } from 'react';
import Link from 'next/link';
import { PageLayout } from '@/components/layout/page-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/shared/toast';
import { apiClient } from '@/lib/api-client';

export default function ForgotPasswordPage() {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const result = await apiClient.auth.requestPasswordLink(email);
      setIsSubmitted(true);
      showToast('success', result.message);
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Unable to request a password link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout>
      <main className="mx-auto flex min-h-[calc(100vh-12rem)] w-full max-w-lg items-center px-4 py-12">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Set or reset your password</CardTitle>
            <CardDescription>We will email a secure, one-time link if an account matches.</CardDescription>
          </CardHeader>
          <CardContent>
            {isSubmitted ? (
              <div className="space-y-4" role="status">
                <p className="text-sm text-muted-foreground">
                  If an account exists for that email, a password link will be sent.
                </p>
                <Link href="/login" className="text-sm font-medium text-primary hover:underline">
                  Return to sign in
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Sending link...' : 'Email me a password link'}
                </Button>
                <Link href="/login" className="block text-center text-sm text-muted-foreground hover:text-primary">
                  Back to sign in
                </Link>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </PageLayout>
  );
}