'use client';

import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { App } from '@capacitor/app';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useRouter, usePathname } from 'next/navigation';

export function useCapacitorNative() {
  const router = useRouter();
  const pathname = usePathname();
  const lastBackPressRef = useRef<number>(0);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // Mark document with native platform classes for CSS styling
    document.documentElement.classList.add('capacitor-native');
    const plat = Capacitor.getPlatform();
    document.documentElement.classList.add(`platform-${plat}`);

    // Initialize Status Bar with correct contrast (Style.Light = white icons, Style.Dark = dark icons)
    const updateStatusBar = async () => {
      try {
        const isDark = document.documentElement.classList.contains('dark');
        await StatusBar.setStyle({
          style: isDark ? Style.Light : Style.Dark,
        });
        await StatusBar.setBackgroundColor({
          color: isDark ? '#0b1115' : '#ffffff',
        });
      } catch (error) {
        console.warn('StatusBar init warning:', error);
      }
    };

    // Initialize Keyboard
    const initKeyboard = async () => {
      try {
        await Keyboard.setAccessoryBarVisible({ isVisible: false });
      } catch (error) {
        console.warn('Keyboard init warning:', error);
      }
    };

    // Handle back button on Android
    const handleBackButton = async () => {
      try {
        // 1. Check if an open modal, dialog, or drawer exists
        const openModal = document.querySelector('[role="dialog"], [data-state="open"]');
        if (openModal) {
          const escEvent = new KeyboardEvent('keydown', {
            key: 'Escape',
            code: 'Escape',
            keyCode: 27,
            bubbles: true,
          });
          document.dispatchEvent(escEvent);
          return;
        }

        // 2. If on a sub-page, navigate back
        if (pathname && pathname !== '/') {
          if (window.history.length > 1) {
            window.history.back();
            return;
          }
          router.push('/');
          return;
        }

        // 3. If on home page, double press back to exit
        const now = Date.now();
        if (now - lastBackPressRef.current < 2000) {
          await App.exitApp();
        } else {
          lastBackPressRef.current = now;
          // Trigger subtle haptic
          try {
            await Haptics.impact({ style: ImpactStyle.Medium });
          } catch {}

          // Show native-feeling Android exit toast
          const existingToast = document.getElementById('native-back-exit-toast');
          if (!existingToast) {
            const exitToast = document.createElement('div');
            exitToast.id = 'native-back-exit-toast';
            exitToast.className = 'fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-neutral-900/90 text-white text-xs font-medium rounded-full shadow-lg pointer-events-none transition-opacity duration-300 backdrop-blur-sm animate-in fade-in';
            exitToast.innerText = 'Press back again to exit';
            document.body.appendChild(exitToast);
            setTimeout(() => {
              exitToast.remove();
            }, 2000);
          }
        }
      } catch (error) {
        console.error('Back button handler error:', error);
      }
    };

    // Setup listeners
    let backButtonListener: { remove: () => void } | null = null;
    let keyboardShowListener: { remove: () => void } | null = null;
    let keyboardHideListener: { remove: () => void } | null = null;

    const setupListeners = async () => {
      try {
        backButtonListener = await App.addListener('backButton', handleBackButton);

        keyboardShowListener = await Keyboard.addListener('keyboardWillShow', () => {
          document.body.classList.add('keyboard-open');
        });

        keyboardHideListener = await Keyboard.addListener('keyboardWillHide', () => {
          document.body.classList.remove('keyboard-open');
        });

        await updateStatusBar();
        await initKeyboard();
      } catch (error) {
        console.warn('Capacitor listener setup warning:', error);
      }
    };

    setupListeners();

    // Watch for theme changes to update status bar
    const observer = new MutationObserver(() => {
      updateStatusBar();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      observer.disconnect();
      if (backButtonListener) backButtonListener.remove();
      if (keyboardShowListener) keyboardShowListener.remove();
      if (keyboardHideListener) keyboardHideListener.remove();
      document.documentElement.classList.remove('capacitor-native', `platform-${plat}`);
    };
  }, [router, pathname]);

  // Haptic feedback utility
  const triggerHaptic = async (style: ImpactStyle = ImpactStyle.Light) => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await Haptics.impact({ style });
    } catch (error) {
      console.warn('Haptic warning:', error);
    }
  };

  return { triggerHaptic };
}
