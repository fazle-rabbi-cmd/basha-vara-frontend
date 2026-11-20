'use client';

import React, { useState, useEffect } from 'react';
import { Header } from './header';
import { Footer } from './footer';
import { MobileAppHeader } from './mobile-app-header';
import { WebMobileHeader } from './web-mobile-header';
import { MobileBottomNav } from './mobile-bottom-nav';
import { usePlatform } from '@/lib/platform/platform-context';

interface PageLayoutProps {
  children: React.ReactNode;
  hideHeader?: boolean;
  hideFooter?: boolean;
  hideBottomNav?: boolean;
}

export function PageLayout({
  children,
  hideHeader = false,
  hideFooter = false,
  hideBottomNav = false,
}: PageLayoutProps) {
  const { isNative, isMobile } = usePlatform();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      {/* Top Header: Different for each platform */}
      {!hideHeader && (
        <>
          {/* Desktop Web Header */}
          <div className="hidden md:block" suppressHydrationWarning>
            <Header />
          </div>
          {/* Mobile Web Header (browser on mobile) - Different from Capacitor app */}
          {isMounted && !isNative && (
            <div className="block md:hidden" suppressHydrationWarning>
              <WebMobileHeader />
            </div>
          )}
          {/* Capacitor App Header - Native-style navigation */}
          {isMounted && isNative && (
            <div className="block md:hidden" suppressHydrationWarning>
              <MobileAppHeader />
            </div>
          )}
        </>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 w-full max-w-full ${isMounted && isMobile && !hideBottomNav ? 'pb-20 md:pb-0' : ''}`}>
        {children}
      </main>

      {/* Desktop Web Footer: Shown only on desktop web, completely hidden on mobile/native */}
      {isMounted && !hideFooter && !isNative && (
        <div className="hidden md:block">
          <Footer />
        </div>
      )}

      {/* Mobile Bottom Navigation Bar: Only shown in Capacitor app, not web mobile */}
      {isMounted && !hideBottomNav && isNative && (
        <div className="block md:hidden">
          <MobileBottomNav />
        </div>
      )}
    </div>
  );
}
