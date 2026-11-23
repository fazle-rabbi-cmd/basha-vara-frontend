'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  Menu,
  X,
  Bell,
  Sun,
  Moon,
  WifiOff,
  Home,
  Heart,
  LayoutDashboard,
  Settings,
  LogOut,
  Info,
  HelpCircle,
  FileText,
  User,
  ChevronRight,
  PlusCircle,
  Calendar,
  LifeBuoy,
  BookOpen,
  Receipt,
  ShieldCheck,
  Users
} from 'lucide-react';
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

  const isLandlord = user?.role === 'landlord' || user?.roles?.includes('landlord');
  const isAdmin = user?.role === 'admin' || user?.roles?.includes('admin');
  const isTenant = !isLandlord && !isAdmin;

  const dashboardHref = isAdmin
    ? '/admin/dashboard'
    : isLandlord
    ? '/landlord/dashboard'
    : '/tenant/dashboard';

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
        <div className="flex h-16 items-center justify-between px-4">
          {/* Left: Brand Identity */}
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/icons/icon-48.webp" alt="Basha Vara" className="h-9 w-9 rounded-xl shadow-xs" />
            <div className="flex flex-col">
              <span className="font-extrabold text-base text-foreground tracking-tight leading-none">Basha Vara</span>
              <span className="text-[10px] text-muted-foreground font-medium">Rental Marketplace</span>
            </div>
          </Link>

          {/* Center: Tablet/Desktop Navigation Fallback (md+) */}
          <nav className="hidden md:flex items-center gap-6" suppressHydrationWarning>
            <Link href="/properties" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Properties
            </Link>
            {isAuthenticated && (
              <>
                {isTenant && (
                  <Link href="/tenant/favourites" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                    Saved
                  </Link>
                )}
                {isLandlord && (
                  <Link href="/landlord/properties" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                    My Listings
                  </Link>
                )}
                <Link href={dashboardHref} className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                  Dashboard
                </Link>
              </>
            )}
          </nav>

          {/* Right: Quick Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {isAuthenticated && (
              <Link
                href={dashboardHref}
                className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            )}

            {/* Mobile Hamburger / Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-lg text-foreground"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            {!isAuthenticated && (
              <div className="hidden md:flex items-center gap-2" suppressHydrationWarning>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Professional Mobile Menu Drawer */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border bg-background/98 backdrop-blur pb-6 animate-in slide-in-from-top-2 duration-200">
            {/* 1. Top Auth & Profile Header Card */}
            {isAuthenticated ? (
              <div className="p-4 mx-3 my-3 rounded-2xl bg-muted/50 border border-border/80 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-11 w-11 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-base shrink-0">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{user?.name || 'User'}</p>
                    <p className="text-xs text-muted-foreground capitalize flex items-center gap-1.5 mt-0.5">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {isAdmin ? 'Admin' : isLandlord ? 'Landlord' : 'Tenant'} Account
                    </p>
                  </div>
                </div>
                <Button variant="secondary" size="sm" asChild className="shrink-0 text-xs h-8">
                  <Link href={dashboardHref} onClick={() => setIsMenuOpen(false)}>
                    Dashboard
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="p-4 mx-3 my-3 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-muted/40 border border-primary/20 shadow-xs">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-foreground">Welcome to Basha Vara</h3>
                    <p className="text-xs text-muted-foreground">Sign in to save homes & schedule visits</p>
                  </div>
                </div>
                <Button asChild size="default" className="w-full font-semibold shadow-xs justify-between px-4 h-10">
                  <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                    <span className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Sign In or Register
                    </span>
                    <ChevronRight className="h-4 w-4 opacity-70" />
                  </Link>
                </Button>
              </div>
            )}

            <nav className="flex flex-col px-3 space-y-4">
              {/* -------------------- UNTOUCHED GUEST NAVIGATION -------------------- */}
              {!isAuthenticated && (
                <>
                  <div>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1">
                      Explore Marketplace
                    </p>
                    <div className="space-y-0.5">
                      <Link
                        href="/"
                        className={`flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                          pathname === '/' ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <div className="flex items-center gap-3">
                          <Home className="h-4 w-4 text-muted-foreground" />
                          <span>Home</span>
                        </div>
                      </Link>

                      <Link
                        href="/properties"
                        className={`flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                          pathname === '/properties' ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <div className="flex items-center gap-3">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>Explore Properties</span>
                        </div>
                      </Link>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/60">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1">
                      Guides & Resources
                    </p>
                    <div className="space-y-0.5">
                      <Link
                        href="/how-it-works"
                        className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted rounded-xl transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        <span>How It Works</span>
                      </Link>

                      <Link
                        href="/tenant-guide"
                        className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted rounded-xl transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span>Tenant Guide</span>
                      </Link>

                      <Link
                        href="/landlord-guide"
                        className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted rounded-xl transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>Landlord Guide</span>
                      </Link>

                      <Link
                        href="/help"
                        className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted rounded-xl transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <LifeBuoy className="h-4 w-4 text-muted-foreground" />
                        <span>Help & Support</span>
                      </Link>

                      <Link
                        href="/about"
                        className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted rounded-xl transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Info className="h-4 w-4 text-muted-foreground" />
                        <span>About Basha Vara</span>
                      </Link>
                    </div>
                  </div>
                </>
              )}

              {/* -------------------- LOGGED IN AS TENANT -------------------- */}
              {isAuthenticated && isTenant && (
                <>
                  <div>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1">
                      Browse & Save
                    </p>
                    <div className="space-y-0.5">
                      <Link
                        href="/properties"
                        className={`flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                          pathname === '/properties' ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <div className="flex items-center gap-3">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>Explore Properties</span>
                        </div>
                      </Link>

                      <Link
                        href="/tenant/favourites"
                        className={`flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                          pathname === '/tenant/favourites' ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <div className="flex items-center gap-3">
                          <Heart className="h-4 w-4 text-rose-500" />
                          <span>Saved Properties</span>
                        </div>
                      </Link>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/60">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1">
                      My Rental Activity
                    </p>
                    <div className="space-y-0.5">
                      <Link
                        href="/tenant/dashboard"
                        className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                          pathname === '/tenant/dashboard' ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                        <span>Tenant Dashboard</span>
                      </Link>

                      <Link
                        href="/tenant/visits"
                        className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                          pathname === '/tenant/visits' ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Visits & Appointments</span>
                      </Link>

                      <Link
                        href="/tenant/applications"
                        className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                          pathname === '/tenant/applications' ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>My Applications</span>
                      </Link>

                      <Link
                        href="/tenant/settings"
                        className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                          pathname === '/tenant/settings' ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        <span>Account Settings</span>
                      </Link>
                    </div>
                  </div>
                </>
              )}

              {/* -------------------- LOGGED IN AS LANDLORD -------------------- */}
              {isAuthenticated && isLandlord && (
                <>
                  <div>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1">
                      Property Management
                    </p>
                    <div className="space-y-0.5">
                      <Link
                        href="/landlord/dashboard"
                        className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                          pathname === '/landlord/dashboard' ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                        <span>Landlord Dashboard</span>
                      </Link>

                      <Link
                        href="/landlord/properties"
                        className={`flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                          pathname === '/landlord/properties' ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <div className="flex items-center gap-3">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>My Properties</span>
                        </div>
                        <span className="text-xs text-primary font-semibold flex items-center gap-1">
                          <PlusCircle className="h-3.5 w-3.5" />
                          Add
                        </span>
                      </Link>

                      <Link
                        href="/landlord/visits"
                        className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                          pathname === '/landlord/visits' ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Visit Requests</span>
                      </Link>

                      <Link
                        href="/landlord/applications"
                        className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                          pathname === '/landlord/applications' ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>Rental Applications</span>
                      </Link>

                      <Link
                        href="/landlord/rent-ledger"
                        className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                          pathname === '/landlord/rent-ledger' ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                        <span>Rent Ledger & Utilities</span>
                      </Link>

                      <Link
                        href="/landlord/settings"
                        className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                          pathname === '/landlord/settings' ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        <span>Landlord Settings</span>
                      </Link>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/60">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1">
                      Marketplace & Guides
                    </p>
                    <div className="space-y-0.5">
                      <Link
                        href="/properties"
                        className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted rounded-xl transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>Explore Marketplace</span>
                      </Link>
                      <Link
                        href="/landlord-guide"
                        className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted rounded-xl transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span>Landlord Guide</span>
                      </Link>
                    </div>
                  </div>
                </>
              )}

              {/* -------------------- LOGGED IN AS ADMIN -------------------- */}
              {isAuthenticated && isAdmin && (
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1">
                    Administration
                  </p>
                  <div className="space-y-0.5">
                    <Link
                      href="/admin/dashboard"
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted rounded-xl transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                      <span>Admin Dashboard</span>
                    </Link>
                    <Link
                      href="/admin/properties"
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted rounded-xl transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>Moderate Properties</span>
                    </Link>
                    <Link
                      href="/admin/users"
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted rounded-xl transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>Manage Users</span>
                    </Link>
                    <Link
                      href="/admin/permissions"
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted rounded-xl transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                      <span>RBAC Permissions</span>
                    </Link>
                  </div>
                </div>
              )}

              {/* 5. Footer Actions */}
              <div className="pt-3 border-t border-border/60 space-y-2">
                {isAuthenticated && (
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-xl w-full text-left transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                )}

                <div className="flex items-center justify-between px-3 text-xs text-muted-foreground pt-1">
                  <div className="flex items-center gap-3">
                    <Link href="/terms" onClick={() => setIsMenuOpen(false)} className="hover:underline">
                      Terms
                    </Link>
                    <span>•</span>
                    <Link href="/privacy" onClick={() => setIsMenuOpen(false)} className="hover:underline">
                      Privacy
                    </Link>
                    <span>•</span>
                    <Link href="/contact" onClick={() => setIsMenuOpen(false)} className="hover:underline">
                      Contact
                    </Link>
                  </div>
                  <span>© 2026 Basha Vara</span>
                </div>
              </div>
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
