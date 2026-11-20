'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft, Building2, Bell, Sun, Moon, WifiOff } from 'lucide-react';
import { useAuth } from '@/features/auth/auth-context';
import { useNotifications } from '@/features/notifications/notification-service';
import { useTheme } from '@/components/shared/theme-provider';
import { usePlatform } from '@/lib/platform/platform-context';

export function MobileAppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { unreadCount } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const { triggerHaptic, isOnline } = usePlatform();

  // Root pages that don't need a back button
  const isRootTab = pathname === '/' || pathname === '/properties';
  const canGoBack = !isRootTab;

  const handleBack = () => {
    triggerHaptic();
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  // Determine screen title based on path
  const getScreenTitle = () => {
    if (pathname === '/') return 'Basha Vara';
    if (pathname.startsWith('/properties/') && pathname !== '/properties') return 'Property Details';
    if (pathname === '/properties') return 'Explore Homes';
    if (pathname.includes('/favourites')) return 'Saved Properties';
    if (pathname.includes('/visits')) return 'Visits & Tours';
    if (pathname.includes('/applications')) return 'Applications';
    if (pathname.includes('/dashboard')) return 'My Dashboard';
    if (pathname.includes('/profile')) return 'My Profile';
    if (pathname.includes('/settings')) return 'Settings';
    if (pathname === '/login') return 'Sign In';
    if (pathname === '/register') return 'Create Account';
    if (pathname.includes('/landlord/properties')) return 'My Portfolio';
    if (pathname.includes('/admin')) return 'Admin Portal';
    return 'Basha Vara';
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pt-[env(safe-area-inset-top,0px)]">
        <div className="flex h-14 items-center justify-between px-3">
          {/* Left: Back button or Logo */}
          <div className="flex items-center min-w-[70px]">
            {canGoBack ? (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1 p-1.5 -ml-1 text-foreground hover:text-primary transition-colors active:scale-95 touch-manipulation"
                aria-label="Go back"
              >
                <ChevronLeft className="h-6 w-6" />
                <span className="text-xs font-medium">Back</span>
              </button>
            ) : (
              <Link href="/" className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-teal-600 to-emerald-500 p-0.5 shadow-sm">
                  <img src="/icons/icon-48.webp" alt="Basha Vara" className="h-full w-full rounded-[6px] object-cover" />
                </div>
                <span className="font-extrabold text-sm text-foreground tracking-tight">Basha Vara</span>
              </Link>
            )}
          </div>

          {/* Center: Title (only shown when in sub-routes so it's clean) */}
          {canGoBack && (
            <div className="flex-1 text-center px-2">
              <h1 className="text-sm font-semibold text-foreground truncate">{getScreenTitle()}</h1>
            </div>
          )}

          {/* Right: Notification & Theme Toggle */}
          <div className="flex items-center justify-end gap-1 min-w-[70px]">
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                toggleTheme();
              }}
              className="p-2 text-muted-foreground hover:text-foreground active:scale-95 transition-transform"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {isAuthenticated && (
              <Link
                href={user?.role === 'landlord' ? '/landlord/dashboard' : '/tenant/dashboard'}
                onClick={() => triggerHaptic()}
                className="relative p-2 text-muted-foreground hover:text-foreground active:scale-95 transition-transform"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            )}
          </div>
        </div>

        {/* Offline indicator banner */}
        {!isOnline && (
          <div className="flex items-center justify-center gap-2 bg-destructive/90 text-destructive-foreground py-1 px-3 text-xs font-medium shadow-sm">
            <WifiOff className="h-3.5 w-3.5 animate-pulse" />
            <span>You are offline. Showing cached listings.</span>
          </div>
        )}
      </header>
    </>
  );
}

