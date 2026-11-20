'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Heart, Building2, Calendar, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/features/auth/auth-context';
import { usePlatform } from '@/lib/platform/platform-context';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const { triggerHaptic } = usePlatform();

  const isLandlord = user?.role === 'landlord' || user?.roles?.includes('landlord');
  const isAdmin = user?.role === 'admin' || user?.roles?.includes('admin');

  // Define tab navigation based on role
  const tabs = [
    {
      href: '/',
      label: 'Home',
      icon: Home,
      isActive: pathname === '/',
    },
    {
      href: '/properties',
      label: 'Explore',
      icon: Search,
      isActive: pathname === '/properties' || (pathname.startsWith('/properties/') && pathname !== '/properties'),
    },
    {
      href: isLandlord ? '/landlord/properties' : '/tenant/favourites',
      label: isLandlord ? 'Listings' : 'Saved',
      icon: isLandlord ? Building2 : Heart,
      isActive: isLandlord
        ? pathname.startsWith('/landlord/properties')
        : pathname.startsWith('/tenant/favourites'),
    },
    {
      href: isLandlord ? '/landlord/visits' : '/tenant/visits',
      label: 'Visits',
      icon: Calendar,
      isActive: isLandlord
        ? pathname.startsWith('/landlord/visits')
        : pathname.startsWith('/tenant/visits'),
    },
    {
      href: !isAuthenticated
        ? '/login'
        : isAdmin
        ? '/admin/dashboard'
        : isLandlord
        ? '/landlord/dashboard'
        : '/tenant/dashboard',
      label: 'Account',
      icon: isAdmin ? ShieldCheck : User,
      isActive: !isAuthenticated
        ? pathname === '/login' || pathname === '/register'
        : pathname.includes('/dashboard') || pathname.includes('/profile'),
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85 pb-[max(0.35rem,env(safe-area-inset-bottom,0px))] transition-colors"
      aria-label="Mobile Bottom Navigation"
    >
      <div className="flex h-14 items-center justify-around px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.isActive;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={() => triggerHaptic()}
              className={`flex flex-1 flex-col items-center justify-center py-1 transition-all active:scale-90 touch-manipulation select-none ${
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  className={`h-5 w-5 transition-transform ${
                    active ? 'scale-110 stroke-[2.25px]' : 'stroke-[1.75px]'
                  }`}
                />
                {active && (
                  <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-primary" />
                )}
              </div>
              <span
                className={`mt-1 text-[10px] tracking-tight transition-colors ${
                  active ? 'font-semibold text-primary' : 'font-medium'
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

