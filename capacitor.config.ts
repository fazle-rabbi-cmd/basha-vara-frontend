import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'com.bashavara.app',
  appName: 'Basha Vara',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    cleartext: true,
    // Removed live URL to use local build for true native experience
    // App will load from built files instead of live web URL
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    SplashScreen: {
      launchShowDuration: 3000, // Maximum safety duration before auto-hiding
      launchAutoHide: false, // Don't auto-hide immediately, frontend hides after hydration
      backgroundColor: '#0d9488',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
      launchFadeOutDuration: 300,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#0b1115',
    },
    Keyboard: {
      resize: KeyboardResize.Body,
      resizeOnFullScreen: true,
    },
    App: {
      // App plugin configuration
    },
  },
};

export default config;
