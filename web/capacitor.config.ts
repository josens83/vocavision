import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'kr.vocavision.app',
  appName: 'VocaVision AI',
  webDir: 'out',

  // Live URL 방식 - Vercel 배포된 웹앱 사용
  server: {
    url: 'https://www.vocavision.kr',
    cleartext: true,
  },

  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#14b8a6',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#14b8a6',
    },
  },
};

export default config;
