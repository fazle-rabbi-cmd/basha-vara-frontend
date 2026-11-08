import { registerPlugin } from '@capacitor/core';

interface AppUpdaterPlugin {
  downloadAndInstall(options: { url: string; fileName: string }): Promise<{ downloadId: number }>;
}

export const AppUpdater = registerPlugin<AppUpdaterPlugin>('AppUpdater');