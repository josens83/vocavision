'use client';

import { useEffect } from 'react';
import { App } from '@capacitor/app';

export default function BackButtonHandler() {
  useEffect(() => {
    const handleBackButton = App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        App.exitApp();
      }
    });

    return () => {
      handleBackButton.then(listener => listener.remove());
    };
  }, []);

  return null;
}
