'use client';

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { App } from '@capacitor/app';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useRouter } from 'next/navigation';

export function useCapacitorNative() {
  const router = useRouter();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // Initialize Status Bar
    const initStatusBar = async () => {
      try {
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setBackgroundColor({ color: '#0b1115' });
      } catch (error) {
        console.error('StatusBar init error:', error);
      }
    };

    // Initialize Keyboard
    const initKeyboard = async () => {
      try {
        await Keyboard.setAccessoryBarVisible({ isVisible: false });
      } catch (error) {
        console.error('Keyboard init error:', error);
      }
    };

    // Handle back button
    const handleBackButton = async () => {
      try {
        const canGoBack = window.history.length > 1;
        if (canGoBack) {
          window.history.back();
        } else {
          // Exit app or go to home
          await App.exitApp();
        }
      } catch (error) {
        console.error('Back button error:', error);
      }
    };

    // Setup listeners
    const setupListeners = async () => {
      try {
        // Back button listener
        const backButtonListener = await App.addListener('backButton', handleBackButton);

        // Keyboard listeners
        const keyboardShowListener = await Keyboard.addListener('keyboardWillShow', () => {
          document.body.classList.add('keyboard-open');
        });

        const keyboardHideListener = await Keyboard.addListener('keyboardWillHide', () => {
          document.body.classList.remove('keyboard-open');
        });

        // Initialize plugins
        await initStatusBar();
        await initKeyboard();

        // Cleanup
        return () => {
          backButtonListener.remove();
          keyboardShowListener.remove();
          keyboardHideListener.remove();
        };
      } catch (error) {
        console.error('Capacitor setup error:', error);
      }
    };

    const cleanup = setupListeners();

    return () => {
      if (cleanup) {
        cleanup.then((fn) => fn && fn());
      }
    };
  }, [router]);

  // Haptic feedback utility
  const triggerHaptic = async (style: ImpactStyle = ImpactStyle.Light) => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await Haptics.impact({ style });
    } catch (error) {
      console.error('Haptic error:', error);
    }
  };

  return { triggerHaptic };
}
