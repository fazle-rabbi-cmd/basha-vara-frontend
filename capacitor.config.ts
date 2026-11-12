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
      launchShowDuration: 2500,
      launchAutoHide: true,
      backgroundColor: '#0d9488',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
      launchFadeOutDuration: 800,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#0b1115',
    },
  },
};

export default config;
