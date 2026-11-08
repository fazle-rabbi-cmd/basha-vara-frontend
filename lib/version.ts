// Version management for OTA updates
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export interface AppVersion {
  version: string;
  buildNumber: number;
  releaseDate: string;
  features: string[];
  isCritical: boolean;
  apkUrl?: string;
}

// Current app version (increment this when deploying)
export const CURRENT_VERSION: AppVersion = {
  version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  buildNumber: Number(process.env.NEXT_PUBLIC_APP_BUILD_NUMBER || '1'),
  releaseDate: '2026-11-06',
  features: [
    'Custom branding with beautiful splash screen',
    'Performance optimizations',
    'OTA updates enabled',
  ],
  isCritical: false,
};

// Storage keys
const VERSION_STORAGE_KEY = 'basha_vara_version';
const LAST_CHECK_KEY = 'basha_vara_last_version_check';
const SKIP_VERSION_KEY = 'basha_vara_skip_version';

export async function getCurrentVersion(): Promise<AppVersion> {
  if (!Capacitor.isNativePlatform()) {
    return CURRENT_VERSION;
  }

  const nativeInfo = await App.getInfo();
  return {
    ...CURRENT_VERSION,
    version: nativeInfo.version,
    buildNumber: Number(nativeInfo.build),
  };
}

// Check if update is available
export async function checkForUpdate(currentVersion = CURRENT_VERSION): Promise<AppVersion | null> {
  try {
    // Fetch latest version from API or version file
    const response = await fetch('/api/version', { cache: 'no-store' });
    if (!response.ok) return null;

    const latestVersion: AppVersion = await response.json();

    // Compare versions
    if (isUpdateAvailable(currentVersion, latestVersion)) {
      return latestVersion;
    }

    return null;
  } catch {
    return null;
  }
}

// Compare versions
function isUpdateAvailable(current: AppVersion, latest: AppVersion): boolean {
  return latest.buildNumber > current.buildNumber;
}

// Save current version to storage
export function saveCurrentVersion(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(VERSION_STORAGE_KEY, JSON.stringify(CURRENT_VERSION));
  }
}

// Get stored version
export function getStoredVersion(): AppVersion | null {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(VERSION_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  }
  return null;
}

// Save last check timestamp
export function saveLastCheck(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LAST_CHECK_KEY, Date.now().toString());
  }
}

// Get last check timestamp
export function getLastCheck(): number {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(LAST_CHECK_KEY);
    return stored ? parseInt(stored, 10) : 0;
  }
  return 0;
}

// Check if we should check for updates (avoid checking too frequently)
export function shouldCheckForUpdate(): boolean {
  const lastCheck = getLastCheck();
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;

  // Check at most once per 5 minutes (more frequent for better UX)
  return now - lastCheck > fiveMinutes;
}

// Skip a specific version
export function skipVersion(version: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SKIP_VERSION_KEY, version);
  }
}

// Check if version was skipped
export function isVersionSkipped(version: string): boolean {
  if (typeof window !== 'undefined') {
    const skipped = localStorage.getItem(SKIP_VERSION_KEY);
    return skipped === version;
  }
  return false;
}

// Clear skipped version (call after update)
export function clearSkippedVersion(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SKIP_VERSION_KEY);
  }
}
