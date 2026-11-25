'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, Home, Heart, LayoutDashboard, Building2, LogOut, User, ShieldCheck, Users, Settings, FileText, Receipt, ChevronDown, ChevronRight, Bell, Sun, Moon, Info, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/auth-context';
import { useNotifications } from '@/features/notifications/notification-service';
import { useTheme } from '@/components/shared/theme-provider';
import { useLocale } from '@/components/shared/language-provider';
import { NotificationDropdown } from './notification-dropdown';
import { useState, useEffect, useRef } from 'react';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { unreadCount, fetchUnreadCount } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const { locale, toggleLocale } = useLocale();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [navMenuOpen, setNavMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (navMenuRef.current && !navMenuRef.current.contains(event.target as Node)) {
        setNavMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch unread notification count
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchUnreadCount();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user?.id, fetchUnreadCount]);

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
    router.push('/login');
  };

  const navLinks = isAuthenticated && user?.roles?.includes('tenant') ? [
    { href: '/', label: 'Home', icon: Home },
    { href: '/tenant/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ] : isAuthenticated && user?.roles?.includes('landlord') ? [
    { href: '/', label: 'Home', icon: Home },
    { href: '/landlord/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ] : isAuthenticated && user?.roles?.includes('moderator') ? [
    { href: '/', label: 'Home', icon: Home },
    { href: '/moderator/dashboard', label: 'Dashboard', icon: ShieldCheck },
  ] : isAuthenticated && (user?.roles?.includes('admin') || user?.roles?.includes('super_admin')) ? [
    { href: '/', label: 'Home', icon: Home },
    { href: '/admin/dashboard', label: 'Dashboard', icon: ShieldCheck },
  ] : [
    { href: '/', label: 'Home', icon: Home },
    { href: '/properties', label: 'Browse', icon: Building2 },
  ];

  const additionalNavLinks = isAuthenticated && user?.roles?.includes('tenant') ? [
    { href: '/tenant/favourites', label: 'Saved', icon: Heart },
    { href: '/tenant/visits', label: 'Visits', icon: User },
    { href: '/tenant/applications', label: 'Applications', icon: FileText },
  ] : isAuthenticated && user?.roles?.includes('landlord') ? [
    { href: '/landlord/properties', label: 'My Properties', icon: Building2 },
    { href: '/landlord/visits', label: 'Visit Requests', icon: User },
    { href: '/landlord/applications', label: 'Applications', icon: FileText },
    { href: '/landlord/rent-ledger', label: 'Rent Ledger', icon: Receipt },
  ] : isAuthenticated && user?.roles?.includes('moderator') ? [
    { href: '/moderator/properties', label: 'Properties', icon: Building2 },
  ] : isAuthenticated && (user?.roles?.includes('admin') || user?.roles?.includes('super_admin')) ? [] : [
    { href: '/about', label: 'About', icon: Info },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border glass supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="relative h-9 w-9 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 p-0.5 shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
              <img src="/icons/icon-48.webp" alt="Basha Vara" className="h-full w-full rounded-[10px] object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-foreground leading-none">Basha Vara</span>
              <span className="text-[10px] font-semibold text-teal-600 dark:text-teal-400 leading-tight tracking-wider uppercase">Direct Rentals</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1" suppressHydrationWarning>
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-muted ${
                    isActive ? 'text-primary bg-primary/5' : 'text-muted-foreground'
                  }`}
                >
                  <link.icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            {/* More Navigation Dropdown */}
            {additionalNavLinks.length > 0 && (
              <div className="relative" ref={navMenuRef}>
                <button
                  onClick={() => setNavMenuOpen(!navMenuOpen)}
                  className="flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-muted text-muted-foreground"
                >
                  <span>More</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                {navMenuOpen && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-background border border-border rounded-lg shadow-lg py-1 nav-dropdown">
                    {additionalNavLinks.map((link) => {
                      const isActive = pathname === link.href;
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={`flex items-center space-x-2 px-3 py-2 text-sm transition-colors hover:bg-muted ${
                            isActive ? 'text-primary bg-primary/5' : 'text-muted-foreground'
                          }`}
                          onClick={() => setNavMenuOpen(false)}
                        >
                          <link.icon className="h-4 w-4" />
                          <span>{link.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Auth Buttons & Theme/Language Toggle */}
          <div className="hidden md:flex items-center space-x-2" suppressHydrationWarning>
            <button
              type="button"
              onClick={toggleLocale}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Toggle language"
            >
              <Languages className="h-4 w-4" />
              <span className="ml-1 text-xs font-medium">{locale === 'en' ? 'EN' : 'বাং'}</span>
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            {isAuthenticated ? (
              <>
                <NotificationDropdown />
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-muted text-muted-foreground"
                  >
                    <span>{user?.name}</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute top-full right-0 mt-1 w-48 bg-background border border-border rounded-lg shadow-lg py-1">
                      <Link
                        href="/settings"
                        className={`flex items-center space-x-2 px-3 py-2 text-sm transition-colors hover:bg-muted ${
                          pathname === '/settings' ? 'text-primary bg-primary/5' : 'text-muted-foreground'
                        }`}
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                      <Link
                        href="/about"
                        className={`flex items-center space-x-2 px-3 py-2 text-sm transition-colors hover:bg-muted ${
                          pathname === '/about' ? 'text-primary bg-primary/5' : 'text-muted-foreground'
                        }`}
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Info className="h-4 w-4" />
                        <span>About</span>
                      </Link>
                      <div className="border-t border-border my-1" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border" suppressHydrationWarning>
            <nav className="flex flex-col space-y-1">
              {[...navLinks, ...additionalNavLinks].map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-muted ${
                      isActive ? 'bg-muted text-primary' : 'text-muted-foreground'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <link.icon className="h-4 w-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
              {isAuthenticated && (
                <>
                  <Link
                    href="/settings"
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-muted ${
                      pathname === '/settings' ? 'bg-muted text-primary' : 'text-muted-foreground'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                  <Link
                    href="/about"
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-muted ${
                      pathname === '/about' ? 'bg-muted text-primary' : 'text-muted-foreground'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Info className="h-4 w-4" />
                    <span>About</span>
                  </Link>
                </>
              )}
              <div className="border-t border-border pt-3 mt-3">
                {isAuthenticated ? (
                  <>
                    <div className="px-4 py-2">
                      <NotificationDropdown />
                    </div>
                    <div className="px-4 py-2 text-sm text-muted-foreground">
                      Signed in as {user?.name}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <div className="p-3 mx-4 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-muted/40 border border-primary/20">
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-xs text-foreground">Welcome to Basha Vara</p>
                        <p className="text-[11px] text-muted-foreground">Sign in to save homes & book visits</p>
                      </div>
                    </div>
                    <Button asChild size="sm" className="w-full justify-between font-medium">
                      <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                        <span className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Sign In or Register
                        </span>
                        <ChevronRight className="h-4 w-4 opacity-70" />
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
