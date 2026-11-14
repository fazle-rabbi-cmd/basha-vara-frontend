'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Heart, User, LayoutDashboard, Building2 } from 'lucide-react';
import { useAuth } from '@/features/auth/auth-context';
import { cn } from '@/lib/utils';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();

  const isTenant = user?.roles?.includes('tenant');
  const isLandlord = user?.roles?.includes('landlord');

  const navItems = isAuthenticated ? [
    {
      href: isTenant ? '/tenant/dashboard' : isLandlord ? '/landlord/dashboard' : '/admin/dashboard',
      label: 'Home',
      icon: Home,
      active: pathname === (isTenant ? '/tenant/dashboard' : isLandlord ? '/landlord/dashboard' : '/admin/dashboard'),
    },
    {
      href: '/properties',
      label: 'Search',
      icon: Search,
      active: pathname === '/properties' || pathname.startsWith('/properties/'),
    },
    {
      href: isTenant ? '/tenant/favourites' : isLandlord ? '/landlord/properties' : '/admin/properties',
      label: isTenant ? 'Saved' : 'Properties',
      icon: isTenant ? Heart : Building2,
      active: pathname === (isTenant ? '/tenant/favourites' : isLandlord ? '/landlord/properties' : '/admin/properties'),
    },
    {
      href: isTenant ? '/tenant/visits' : isLandlord ? '/landlord/visits' : '/admin/dashboard',
      label: 'Visits',
      icon: User,
      active: pathname === (isTenant ? '/tenant/visits' : isLandlord ? '/landlord/visits' : '/admin/dashboard'),
    },
    {
      href: isTenant ? '/tenant/applications' : isLandlord ? '/landlord/applications' : '/admin/dashboard',
      label: 'Apps',
      icon: LayoutDashboard,
      active: pathname === (isTenant ? '/tenant/applications' : isLandlord ? '/landlord/applications' : '/admin/dashboard'),
    },
  ] : [
    {
      href: '/',
      label: 'Home',
      icon: Home,
      active: pathname === '/',
    },
    {
      href: '/properties',
      label: 'Search',
      icon: Search,
      active: pathname === '/properties' || pathname.startsWith('/properties/'),
    },
    {
      href: '/about',
      label: 'About',
      icon: User,
      active: pathname === '/about',
    },
    {
      href: '/login',
      label: 'Login',
      icon: User,
      active: pathname === '/login',
    },
    {
      href: '/register',
      label: 'Sign Up',
      icon: Heart,
      active: pathname === '/register',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-lg transition-colors',
              item.active
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            <item.icon className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
