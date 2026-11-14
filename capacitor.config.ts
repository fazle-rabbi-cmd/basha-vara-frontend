import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bashavara.app',
  appName: 'Basha Vara',
  webDir: '.next',
  server: {
    androidScheme: 'https',
    cleartext: true,
    url: 'https://basha-vara-frontend-beta.vercel.app',
    allowNavigation: ['https://basha-vara-frontend-beta.vercel.app'],
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    SplashScreen: {
      launchShowDuration: 0, // Hide immediately, we'll control it via frontend
      launchAutoHide: false, // Don't auto-hide, we'll hide it after app loads
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
      resize: 'ion',
      resizeOnFullScreen: true,
    },
    App: {
      // App plugin configuration
    },
  },
};

export default config;
