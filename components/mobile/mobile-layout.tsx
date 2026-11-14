'use client';

import { ReactNode } from 'react';
import { MobileHeader } from './mobile-header';
import { MobileBottomNav } from './mobile-bottom-nav';
import { cn } from '@/lib/utils';

interface MobileLayoutProps {
  children: ReactNode;
  showBottomNav?: boolean;
  showHeader?: boolean;
  className?: string;
}

export function MobileLayout({
  children,
  showBottomNav = true,
  showHeader = true,
  className,
}: MobileLayoutProps) {
  return (
    <div className={cn('min-h-screen bg-background', className)}>
      {showHeader && <MobileHeader />}
      <main className={cn(
        'pb-20', // Space for bottom nav
        showBottomNav && 'pb-20'
      )}>
        {children}
      </main>
      {showBottomNav && <MobileBottomNav />}
    </div>
  );
}
