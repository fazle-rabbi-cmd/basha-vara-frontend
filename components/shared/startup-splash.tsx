'use client';

import { Building2, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { useAuth } from '@/features/auth/auth-context';

export function StartupSplash() {
  const { isLoading } = useAuth();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    if (!isLoading) {
      SplashScreen.hide().catch(() => undefined);
      const timeout = window.setTimeout(() => setVisible(false), 250);
      return () => window.clearTimeout(timeout);
    }
  }, [isLoading]);

  if (!Capacitor.isNativePlatform() || !visible) return null;

  return (
    <div className="startup-splash" role="status" aria-label="Loading Basha Vara">
      <div className="startup-splash__glow startup-splash__glow--one" />
      <div className="startup-splash__glow startup-splash__glow--two" />
      <div className="startup-splash__rings" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="startup-splash__content">
        <div className="startup-splash__logo">
          <Building2 strokeWidth={1.8} />
          <Sparkles className="startup-splash__sparkle" aria-hidden="true" />
        </div>
        <p className="startup-splash__brand">Basha Vara</p>
        <p className="startup-splash__tagline">Find your next place to belong</p>
        <div className="startup-splash__loader" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}
