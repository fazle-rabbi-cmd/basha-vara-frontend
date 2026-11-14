'use client';

import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if running in Capacitor (native app)
    if (Capacitor.isNativePlatform()) {
      setIsMobile(true);
      return;
    }

    // Check screen size for web
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}
