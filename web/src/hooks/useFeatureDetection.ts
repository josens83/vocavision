// Phase 2-6: Feature Detection Hook
// Detect browser features and provide fallbacks

'use client';

import { useState, useEffect } from 'react';

export interface FeatureSupport {
  serviceWorker: boolean;
  indexedDB: boolean;
  webGL: boolean;
  webWorker: boolean;
  localStorage: boolean;
  sessionStorage: boolean;
  geolocation: boolean;
  notifications: boolean;
  webRTC: boolean;
  webSockets: boolean;
  speechRecognition: boolean;
  clipboard: boolean;
}

/**
 * Hook to detect browser feature support
 */
export function useFeatureDetection(): FeatureSupport {
  const [features, setFeatures] = useState<FeatureSupport>({
    serviceWorker: false,
    indexedDB: false,
    webGL: false,
    webWorker: false,
    localStorage: false,
    sessionStorage: false,
    geolocation: false,
    notifications: false,
    webRTC: false,
    webSockets: false,
    speechRecognition: false,
    clipboard: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setFeatures({
      serviceWorker: 'serviceWorker' in navigator,
      indexedDB: 'indexedDB' in window,
      webGL: detectWebGL(),
      webWorker: 'Worker' in window,
      localStorage: detectLocalStorage(),
      sessionStorage: detectSessionStorage(),
      geolocation: 'geolocation' in navigator,
      notifications: 'Notification' in window,
      webRTC: 'RTCPeerConnection' in window,
      webSockets: 'WebSocket' in window,
      speechRecognition: 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window,
      clipboard: 'clipboard' in navigator,
    });
  }, []);

  return features;
}

/**
 * Detect WebGL support
 */
function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')
    );
  } catch {
    return false;
  }
}

/**
 * Detect localStorage support
 */
function detectLocalStorage(): boolean {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Detect sessionStorage support
 */
function detectSessionStorage(): boolean {
  try {
    const test = '__sessionStorage_test__';
    sessionStorage.setItem(test, test);
    sessionStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Hook to detect specific feature
 */
export function useFeature(featureName: keyof FeatureSupport): boolean {
  const features = useFeatureDetection();
  return features[featureName];
}

/**
 * Get browser info
 */
export function getBrowserInfo() {
  if (typeof window === 'undefined') {
    return {
      name: 'unknown',
      version: 'unknown',
      mobile: false,
    };
  }

  const ua = navigator.userAgent;
  let name = 'unknown';
  let version = 'unknown';

  // Detect browser
  if (ua.includes('Firefox')) {
    name = 'Firefox';
    version = ua.match(/Firefox\/(\d+\.\d+)/)?.[1] || version;
  } else if (ua.includes('Chrome') && !ua.includes('Edge')) {
    name = 'Chrome';
    version = ua.match(/Chrome\/(\d+\.\d+)/)?.[1] || version;
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    name = 'Safari';
    version = ua.match(/Version\/(\d+\.\d+)/)?.[1] || version;
  } else if (ua.includes('Edge')) {
    name = 'Edge';
    version = ua.match(/Edge\/(\d+\.\d+)/)?.[1] || version;
  }

  const mobile = /Mobile|Android|iPhone|iPad/i.test(ua);

  return { name, version, mobile };
}

/**
 * Check if feature is supported, with fallback message
 */
export function requireFeature(
  featureName: keyof FeatureSupport,
  message?: string
): boolean {
  const features = useFeatureDetection();
  const supported = features[featureName];

  if (!supported && message) {
    console.warn(`[Feature Detection] ${featureName} not supported: ${message}`);
  }

  return supported;
}
