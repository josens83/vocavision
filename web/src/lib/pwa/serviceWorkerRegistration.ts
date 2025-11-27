/**
 * Service Worker Registration
 *
 * Registers and manages the service worker for PWA functionality
 *
 * @module lib/pwa/serviceWorkerRegistration
 */

export interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

let swRegistration: ServiceWorkerRegistration | null = null;

/**
 * Register service worker
 */
export async function register(config?: ServiceWorkerConfig): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker not supported');
    return;
  }

  // Wait for page load
  if (document.readyState !== 'complete') {
    await new Promise((resolve) => {
      window.addEventListener('load', resolve);
    });
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    swRegistration = registration;

    // Check for updates
    registration.onupdatefound = () => {
      const installingWorker = registration.installing;

      if (!installingWorker) {
        return;
      }

      installingWorker.onstatechange = () => {
        if (installingWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New update available
            console.log('New content available, please refresh.');
            if (config?.onUpdate) {
              config.onUpdate(registration);
            }
          } else {
            // First install
            console.log('Content cached for offline use.');
            if (config?.onSuccess) {
              config.onSuccess(registration);
            }
          }
        }
      };
    };

    console.log('✅ Service Worker registered successfully');
  } catch (error) {
    console.error('❌ Service Worker registration failed:', error);
    if (config?.onError) {
      config.onError(error as Error);
    }
  }
}

/**
 * Unregister service worker
 */
export async function unregister(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.unregister();
    console.log('✅ Service Worker unregistered');
  } catch (error) {
    console.error('❌ Service Worker unregister failed:', error);
  }
}

/**
 * Update service worker
 */
export async function update(): Promise<void> {
  if (swRegistration) {
    await swRegistration.update();
  }
}

/**
 * Send message to service worker
 */
export async function sendMessage(message: any): Promise<void> {
  if (!swRegistration || !swRegistration.active) {
    throw new Error('Service Worker not active');
  }

  swRegistration.active.postMessage(message);
}

/**
 * Request permission for notifications
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    throw new Error('Notifications not supported');
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!swRegistration) {
    throw new Error('Service Worker not registered');
  }

  try {
    const subscription = await swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
      ) as BufferSource,
    });

    console.log('✅ Push notification subscribed');
    return subscription;
  } catch (error) {
    console.error('❌ Push subscription failed:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(): Promise<void> {
  if (!swRegistration) {
    return;
  }

  try {
    const subscription = await swRegistration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      console.log('✅ Push notification unsubscribed');
    }
  } catch (error) {
    console.error('❌ Push unsubscribe failed:', error);
  }
}

/**
 * Check if offline
 */
export function isOffline(): boolean {
  return !navigator.onLine;
}

/**
 * Listen to online/offline events
 */
export function onOnlineStatusChange(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}

/**
 * Convert VAPID key to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export default {
  register,
  unregister,
  update,
  sendMessage,
  requestNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  isOffline,
  onOnlineStatusChange,
};
