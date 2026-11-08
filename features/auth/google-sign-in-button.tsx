'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { renderGoogleSignInButton } from './google-identity';

type GoogleSignInButtonProps = {
  clientId: string;
  text: 'signin_with' | 'signup_with';
  disabled?: boolean;
  onCredential: (credential: string) => void;
  onError: (error: Error) => void;
};

export function GoogleSignInButton({
  clientId,
  text,
  disabled = false,
  onCredential,
  onError,
}: GoogleSignInButtonProps) {
  const [scriptReady, setScriptReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const onCredentialRef = useRef(onCredential);
  const onErrorRef = useRef(onError);
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    onCredentialRef.current = onCredential;
    onErrorRef.current = onError;
  }, [onCredential, onError]);

  useEffect(() => {
    const container = containerRef.current;
    if (!scriptReady || !container) {
      return;
    }

    try {
      return renderGoogleSignInButton(
        clientId,
        container,
        (credential) => onCredentialRef.current(credential),
        text,
        (error) => onErrorRef.current(error),
      );
    } catch (error) {
      onErrorRef.current(error instanceof Error ? error : new Error('Google sign-in failed.'));
    }
  }, [clientId, scriptReady, text]);

  return (
    <>
      {isNative && (
        <button
          type="button"
          className="mt-4 flex h-10 w-full items-center justify-center rounded-md border border-border bg-background text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          disabled={disabled}
          onClick={() => {
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1';
            Browser.open({ url: `${apiBaseUrl}/auth/google/native/start` }).catch(() => {
              onErrorRef.current(new Error('Google sign-in could not be opened.'));
            });
          }}
        >
          Continue with Google
        </button>
      )}
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() => onErrorRef.current(new Error('Google services could not be loaded.'))}
      />
      <div
        ref={containerRef}
        className={isNative ? 'hidden' : 'mt-4 flex min-h-10 justify-center'}
        aria-label={text === 'signin_with' ? 'Sign in with Google' : 'Sign up with Google'}
        aria-disabled={disabled}
        style={disabled ? { opacity: 0.6, pointerEvents: 'none' } : undefined}
      />
    </>
  );
}