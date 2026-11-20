'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, Menu, Bell, Sun, Moon, WifiOff, Home, Heart, LayoutDashboard, Settings, LogOut, Info, HelpCircle, FileText, User } from 'lucide-react';
import { useAuth } from '@/features/auth/auth-context';
import { useNotifications } from '@/features/notifications/notification-service';
import { useTheme } from '@/components/shared/theme-provider';
import { usePlatform } from '@/lib/platform/platform-context';
import { Button } from '@/components/ui/button';

export function WebMobileHeader() {
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const { isOnline } = usePlatform();

  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border glass supports-[backdrop-filter]:bg-background/80">
        <div className="flex h-16 items-center justify-between px-4">
          {/* Left: Logo */}
          <Link href="/" className="flex items-center gap-2">
            <img src="/icons/icon-48.webp" alt="Basha Vara" className="h-9 w-9 rounded-lg" />
            <span className="font-bold text-lg text-foreground tracking-tight hidden sm:block">Basha Vara</span>
          </Link>

          {/* Center: Navigation (hidden on small mobile, shown on larger screens) */}
          <nav className="hidden md:flex items-center gap-6" suppressHydrationWarning>
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
              <div className="hidden md:flex items-center gap-2" suppressHydrationWarning>
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
          <div className="md:hidden border-t border-border bg-background mobile-menu">
            <nav className="flex flex-col py-2">
              {/* Main Navigation */}
              <div className="px-4 py-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Explore</p>
                <div className="space-y-1">
                  <Link href="/" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg" onClick={() => setIsMenuOpen(false)}>
                    <Home className="h-4 w-4" />
                    Home
                  </Link>
                  <Link href="/properties" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg" onClick={() => setIsMenuOpen(false)}>
                    <Building2 className="h-4 w-4" />
                    Properties
                  </Link>
                </div>
              </div>

              {/* Account Section - Only if authenticated */}
              {isAuthenticated && (
                <>
                  <div className="border-t border-border my-2" />
                  <div className="px-4 py-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Account</p>
                    <div className="space-y-1">
                      <Link href={user?.role === 'landlord' ? '/landlord/dashboard' : '/tenant/dashboard'} className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg" onClick={() => setIsMenuOpen(false)}>
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </Link>
                      <Link href="/favourites" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg" onClick={() => setIsMenuOpen(false)}>
                        <Heart className="h-4 w-4" />
                        Saved Properties
                      </Link>
                      <Link href="/notifications" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg" onClick={() => setIsMenuOpen(false)}>
                        <Bell className="h-4 w-4" />
                        Notifications
                        {unreadCount > 0 && (
                          <span className="ml-auto bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </Link>
                      <Link href="/settings" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg" onClick={() => setIsMenuOpen(false)}>
                        <Settings className="h-4 w-4" />
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg w-full text-left"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* More Section */}
              <div className="border-t border-border my-2" />
              <div className="px-4 py-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">More</p>
                <div className="space-y-1">
                  <Link href="/about" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg" onClick={() => setIsMenuOpen(false)}>
                    <Info className="h-4 w-4" />
                    About
                  </Link>
                  <Link href="/how-it-works" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg" onClick={() => setIsMenuOpen(false)}>
                    <HelpCircle className="h-4 w-4" />
                    How It Works
                  </Link>
                  <Link href="/help" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg" onClick={() => setIsMenuOpen(false)}>
                    <HelpCircle className="h-4 w-4" />
                    Help & Support
                  </Link>
                  <Link href="/terms" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg" onClick={() => setIsMenuOpen(false)}>
                    <FileText className="h-4 w-4" />
                    Terms of Service
                  </Link>
                  <Link href="/privacy" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg" onClick={() => setIsMenuOpen(false)}>
                    <FileText className="h-4 w-4" />
                    Privacy Policy
                  </Link>
                </div>
              </div>

              {/* Auth Section - Only if not authenticated */}
              {!isAuthenticated && (
                <>
                  <div className="border-t border-border my-2" />
                  <div className="px-4 py-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Account</p>
                    <div className="space-y-1">
                      <Link href="/login" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg" onClick={() => setIsMenuOpen(false)}>
                        <User className="h-4 w-4" />
                        Sign In
                      </Link>
                      <Link href="/register" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg" onClick={() => setIsMenuOpen(false)}>
                        <Heart className="h-4 w-4" />
                        Sign Up
                      </Link>
                    </div>
                  </div>
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
