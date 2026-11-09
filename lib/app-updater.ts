import { registerPlugin } from '@capacitor/core';

export interface AppUpdaterListenerHandle {
  remove: () => Promise<void>;
}

interface AppUpdaterPlugin {
  downloadAndInstall(options: { url: string; fileName: string }): Promise<{ downloadId: number }>;
  addListener(
    eventName: 'downloadProgress',
    listener: (event: { progress: number }) => void,
  ): Promise<AppUpdaterListenerHandle>;
  addListener(
    eventName: 'downloadComplete',
    listener: () => void,
  ): Promise<AppUpdaterListenerHandle>;
  addListener(
    eventName: 'downloadError',
    listener: (event: { message: string }) => void,
  ): Promise<AppUpdaterListenerHandle>;
}

export const AppUpdater = registerPlugin<AppUpdaterPlugin>('AppUpdater');