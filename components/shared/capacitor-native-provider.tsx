'use client';

import { ReactNode } from 'react';
import { useCapacitorNative } from '@/lib/capacitor-native';

export function CapacitorNativeProvider({ children }: { children: ReactNode }) {
  useCapacitorNative();
  return <>{children}</>;
}
