'use client';

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | undefined;
let messaging: Messaging | undefined;

function initializeFirebase(): FirebaseApp | undefined {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn('Firebase config not found - push notifications disabled');
    return undefined;
  }

  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  return app;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    const result = await PushNotifications.requestPermissions();
    return result.receive === 'granted';
  } else {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }
}

export async function getPushToken(): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    try {
      return new Promise((resolve, reject) => {
        let listenerHandle: any = null;

        PushNotifications.addListener('registration', (token) => {
          if (listenerHandle) {
            listenerHandle.remove();
          }
          resolve(token.value);
        }).then((handle) => {
          listenerHandle = handle;
        }).catch(reject);

        PushNotifications.register().catch((error) => {
          if (listenerHandle) {
            listenerHandle.remove();
          }
          reject(error);
        });
      });
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  } else {
    const app = initializeFirebase();
    if (!app) return null;

    try {
      messaging = getMessaging(app);
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      });
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }
}

export async function registerDeviceToken(userId: string, token: string): Promise<void> {
  const deviceType = Capacitor.isNativePlatform() 
    ? (Capacitor.getPlatform() as 'android' | 'ios')
    : 'web';

  const deviceName = Capacitor.isNativePlatform()
    ? `${Capacitor.getPlatform()} Device`
    : 'Web Browser';

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/push-notifications/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: JSON.stringify({
        token,
        deviceType,
        deviceName,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to register device token');
    }
  } catch (error) {
    console.error('Error registering device token:', error);
  }
}

export async function unregisterDeviceToken(token: string): Promise<void> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/push-notifications/unregister`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      throw new Error('Failed to unregister device token');
    }
  } catch (error) {
    console.error('Error unregistering device token:', error);
  }
}

export function setupPushNotificationListeners(
  onNotification: (notification: any) => void
): () => void {
  if (Capacitor.isNativePlatform()) {
    let listenerHandle: any = null;

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      onNotification(notification);
    }).then((handle) => {
      listenerHandle = handle;
    });

    return () => {
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  } else {
    const app = initializeFirebase();
    if (!app) return () => {};

    try {
      messaging = getMessaging(app);
      const unsubscribe = onMessage(messaging, (payload) => {
        onNotification(payload);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up message listener:', error);
      return () => {};
    }
  }
}

export async function initializePushNotifications(userId: string): Promise<void> {
  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.log('Notification permission denied');
      return;
    }

    const token = await getPushToken();
    if (token) {
      await registerDeviceToken(userId, token);
    }
  } catch (error) {
    console.error('Error initializing push notifications:', error);
  }
}
