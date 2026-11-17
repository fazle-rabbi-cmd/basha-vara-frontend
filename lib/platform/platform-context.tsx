'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Network } from '@capacitor/network';

export type PlatformType = 'ios' | 'android' | 'web';

export interface PlatformContextType {
  isNative: boolean;
  platform: PlatformType;
  isMobile: boolean;
  isDesktop: boolean;
  isOnline: boolean;
  connectionType: string;
  triggerHaptic: (style?: ImpactStyle) => Promise<void>;
}

const PlatformContext = createContext<PlatformContextType | undefined>(undefined);

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const [isNative, setIsNative] = useState(false);
  const [platform, setPlatform] = useState<PlatformType>('web');
  const [isMobile, setIsMobile] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [connectionType, setConnectionType] = useState('unknown');

  // Detect platform and screen size
  useEffect(() => {
    const native = Capacitor.isNativePlatform();
    setIsNative(native);
    const plat = Capacitor.getPlatform() as PlatformType;
    setPlatform(plat || (native ? 'android' : 'web'));

    const checkScreen = () => {
      const mobileWidth = window.innerWidth < 768;
      setIsMobile(native || mobileWidth);
    };

    checkScreen();
    window.addEventListener('resize', checkScreen);

    // Network status listener
    let networkListener: { remove: () => void } | null = null;
    const initNetwork = async () => {
      try {
        const status = await Network.getStatus();
        setIsOnline(status.connected);
        setConnectionType(status.connectionType);

        networkListener = await Network.addListener('networkStatusChange', (s) => {
          setIsOnline(s.connected);
          setConnectionType(s.connectionType);
        });
      } catch (err) {
        // Fallback for standard browser
        if (typeof window !== 'undefined' && 'onLine' in navigator) {
          setIsOnline(navigator.onLine);
          const handleOnline = () => setIsOnline(true);
          const handleOffline = () => setIsOnline(false);
          window.addEventListener('online', handleOnline);
          window.addEventListener('offline', handleOffline);
        }
      }
    };

    initNetwork();

    return () => {
      window.removeEventListener('resize', checkScreen);
      if (networkListener) {
        networkListener.remove();
      }
    };
  }, []);

  // Safe Haptic feedback trigger
  const triggerHaptic = useCallback(async (style: ImpactStyle = ImpactStyle.Light) => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style });
      } catch {
        // Ignore haptics error if unsupported
      }
    } else if (typeof window !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        const duration = style === ImpactStyle.Heavy ? 25 : style === ImpactStyle.Medium ? 15 : 8;
        navigator.vibrate(duration);
      } catch {
        // Ignore vibration error
      }
    }
  }, []);

  const isDesktop = !isMobile && !isNative;

  return (
    <PlatformContext.Provider
      value={{
        isNative,
        platform,
        isMobile,
        isDesktop,
        isOnline,
        connectionType,
        triggerHaptic,
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatform(): PlatformContextType {
  const context = useContext(PlatformContext);
  if (!context) {
    // Graceful fallback if called outside provider
    const isNat = typeof window !== 'undefined' ? Capacitor.isNativePlatform() : false;
    return {
      isNative: isNat,
      platform: (typeof window !== 'undefined' ? (Capacitor.getPlatform() as PlatformType) : 'web') || 'web',
      isMobile: isNat || (typeof window !== 'undefined' ? window.innerWidth < 768 : false),
      isDesktop: !isNat && (typeof window !== 'undefined' ? window.innerWidth >= 768 : true),
      isOnline: typeof navigator !== 'undefined' && 'onLine' in navigator ? navigator.onLine : true,
      connectionType: 'unknown',
      triggerHaptic: async () => {},
    };
  }
  return context;
}

