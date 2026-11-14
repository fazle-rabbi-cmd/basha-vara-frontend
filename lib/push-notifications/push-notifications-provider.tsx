'use client';

import { ReactNode } from 'react';
import { usePushNotifications } from './use-push-notifications';

export function PushNotificationsProvider({ children }: { children: ReactNode }) {
  usePushNotifications();
  return <>{children}</>;
}
