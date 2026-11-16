'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Bell, User, Home, Search, Heart, LayoutDashboard, Building2, FileText, DollarSign, Settings } from 'lucide-react';
import { useAuth } from '@/features/auth/auth-context';
import { useNotifications } from '@/features/notifications/notification-service';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function MobileHeader() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const { unreadCount } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getPageTitle = () => {
    if (pathname === '/') return 'Basha Vara';
    if (pathname === '/properties') return 'Find Properties';
    if (pathname === '/tenant/dashboard') return 'My Dashboard';
    if (pathname === '/landlord/dashboard') return 'Landlord Dashboard';
    if (pathname === '/admin/dashboard') return 'Admin Dashboard';
    if (pathname === '/tenant/favourites') return 'Saved Properties';
    if (pathname === '/landlord/properties') return 'My Properties';
    if (pathname === '/landlord/visits') return 'Visit Requests';
    if (pathname === '/landlord/applications') return 'Applications';
    if (pathname === '/landlord/rent-ledger') return 'Rent Ledger';
    if (pathname === '/tenant/visits') return 'My Visits';
    if (pathname === '/tenant/applications') return 'My Applications';
    if (pathname === '/settings') return 'Settings';
    if (pathname === '/notifications') return 'Notifications';
    if (pathname.startsWith('/properties/')) return 'Property Details';
    return 'Basha Vara';
  };

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border safe-area-top">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Logo/Title */}
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold text-foreground">{getPageTitle()}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {isAuthenticated && (
            <Link href="/notifications" className="relative p-2 rounded-lg hover:bg-muted">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          )}

          <button
            className="p-2 rounded-lg hover:bg-muted"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-background border-b border-border shadow-lg">
          <nav className="py-2">
            {isAuthenticated ? (
              <>
                <Link
                  href={user?.roles?.includes('tenant') ? '/tenant/dashboard' : user?.roles?.includes('landlord') ? '/landlord/dashboard' : '/admin/dashboard'}
                  className="flex items-center px-4 py-3 text-sm font-medium hover:bg-muted"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LayoutDashboard className="h-4 w-4 mr-3" />
                  Dashboard
                </Link>
                <Link
                  href="/properties"
                  className="flex items-center px-4 py-3 text-sm font-medium hover:bg-muted"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Search className="h-4 w-4 mr-3" />
                  Browse Properties
                </Link>
                {user?.roles?.includes('tenant') && (
                  <>
                    <Link
                      href="/tenant/favourites"
                      className="flex items-center px-4 py-3 text-sm font-medium hover:bg-muted"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Heart className="h-4 w-4 mr-3" />
                      Saved Properties
                    </Link>
                    <Link
                      href="/tenant/visits"
                      className="flex items-center px-4 py-3 text-sm font-medium hover:bg-muted"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="h-4 w-4 mr-3" />
                      My Visits
                    </Link>
                    <Link
                      href="/tenant/applications"
                      className="flex items-center px-4 py-3 text-sm font-medium hover:bg-muted"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <FileText className="h-4 w-4 mr-3" />
                      My Applications
                    </Link>
                  </>
                )}
                {user?.roles?.includes('landlord') && (
                  <>
                    <Link
                      href="/landlord/properties"
                      className="flex items-center px-4 py-3 text-sm font-medium hover:bg-muted"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Building2 className="h-4 w-4 mr-3" />
                      My Properties
                    </Link>
                    <Link
                      href="/landlord/visits"
                      className="flex items-center px-4 py-3 text-sm font-medium hover:bg-muted"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="h-4 w-4 mr-3" />
                      Visit Requests
                    </Link>
                    <Link
                      href="/landlord/applications"
                      className="flex items-center px-4 py-3 text-sm font-medium hover:bg-muted"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <FileText className="h-4 w-4 mr-3" />
                      Applications
                    </Link>
                    <Link
                      href="/landlord/rent-ledger"
                      className="flex items-center px-4 py-3 text-sm font-medium hover:bg-muted"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <DollarSign className="h-4 w-4 mr-3" />
                      Rent Ledger
                    </Link>
                  </>
                )}
                <Link
                  href="/settings"
                  className="flex items-center px-4 py-3 text-sm font-medium hover:bg-muted"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Settings className="h-4 w-4 mr-3" />
                  Settings
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="flex items-center px-4 py-3 text-sm font-medium hover:bg-muted"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="h-4 w-4 mr-3" />
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="flex items-center px-4 py-3 text-sm font-medium hover:bg-muted"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Heart className="h-4 w-4 mr-3" />
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
