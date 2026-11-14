'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/auth-context';
import {
  initializePushNotifications,
  setupPushNotificationListeners,
} from './push-notifications';
import { useToast } from '@/components/shared/toast';

export function usePushNotifications() {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user?.id || isInitialized) return;

    const initPushNotifications = async () => {
      try {
        await initializePushNotifications(user.id);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize push notifications:', error);
      }
    };

    initPushNotifications();
  }, [isAuthenticated, user?.id, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;

    const cleanup = setupPushNotificationListeners((notification) => {
      const title = notification.notification?.title || notification.title || 'New Notification';
      const body = notification.notification?.body || notification.body || 'You have a new notification';

      showToast('info', `${title}: ${body}`);

      if (notification.data) {
        const data = typeof notification.data === 'string' 
          ? JSON.parse(notification.data) 
          : notification.data;

        if (data.applicationId) {
          window.location.href = `/tenant/applications`;
        } else if (data.visitId) {
          window.location.href = `/tenant/visits`;
        } else if (data.propertyId) {
          window.location.href = `/properties/${data.propertyId}`;
        }
      }
    });

    return cleanup;
  }, [isInitialized, showToast]);

  return {
    isInitialized,
  };
}
