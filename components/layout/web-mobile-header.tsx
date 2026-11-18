'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, Menu, Bell, Sun, Moon, WifiOff } from 'lucide-react';
import { useAuth } from '@/features/auth/auth-context';
import { useNotifications } from '@/features/notifications/notification-service';
import { useTheme } from '@/components/shared/theme-provider';
import { usePlatform } from '@/lib/platform/platform-context';
import { Button } from '@/components/ui/button';

export function WebMobileHeader() {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuth();
  const { unreadCount } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const { isOnline } = usePlatform();

  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex h-16 items-center justify-between px-4">
          {/* Left: Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg text-foreground tracking-tight hidden sm:block">Basha Vara</span>
          </Link>

          {/* Center: Navigation (hidden on small mobile, shown on larger screens) */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/properties" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Properties
            </Link>
            {isAuthenticated && (
              <>
                <Link href="/favourites" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                  Saved
                </Link>
                <Link href={user?.role === 'landlord' ? '/landlord/dashboard' : '/tenant/dashboard'} className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                  Dashboard
                </Link>
              </>
            )}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {isAuthenticated && (
              <Link
                href={user?.role === 'landlord' ? '/landlord/dashboard' : '/tenant/dashboard'}
                className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {!isAuthenticated && (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <nav className="flex flex-col p-4 space-y-3">
              <Link href="/properties" className="text-sm font-medium text-foreground hover:text-primary" onClick={() => setIsMenuOpen(false)}>
                Properties
              </Link>
              {isAuthenticated ? (
                <>
                  <Link href="/favourites" className="text-sm font-medium text-foreground hover:text-primary" onClick={() => setIsMenuOpen(false)}>
                    Saved
                  </Link>
                  <Link href={user?.role === 'landlord' ? '/landlord/dashboard' : '/tenant/dashboard'} className="text-sm font-medium text-foreground hover:text-primary" onClick={() => setIsMenuOpen(false)}>
                    Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-sm font-medium text-foreground hover:text-primary" onClick={() => setIsMenuOpen(false)}>
                    Sign In
                  </Link>
                  <Link href="/register" className="text-sm font-medium text-foreground hover:text-primary" onClick={() => setIsMenuOpen(false)}>
                    Sign Up
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}

        {/* Offline indicator banner */}
        {!isOnline && (
          <div className="flex items-center justify-center gap-2 bg-destructive/90 text-destructive-foreground py-1.5 px-3 text-xs font-medium">
            <WifiOff className="h-3.5 w-3.5 animate-pulse" />
            <span>You are offline. Showing cached listings.</span>
          </div>
        )}
      </header>
    </>
  );
}
