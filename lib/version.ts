// Version management for OTA updates

export interface AppVersion {
  version: string;
  buildNumber: number;
  releaseDate: string;
  features: string[];
  isCritical: boolean;
}

// Current app version (increment this when deploying)
export const CURRENT_VERSION: AppVersion = {
  version: '1.0.0',
  buildNumber: 1,
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

// Check if update is available
export async function checkForUpdate(): Promise<AppVersion | null> {
  try {
    // Fetch latest version from API or version file
    const response = await fetch('/api/version');
    if (!response.ok) return null;

    const latestVersion: AppVersion = await response.json();

    // Compare versions
    if (isUpdateAvailable(CURRENT_VERSION, latestVersion)) {
      return latestVersion;
    }

    return null;
  } catch (error) {
    console.error('Failed to check for updates:', error);
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
  const oneHour = 60 * 60 * 1000;

  // Check at most once per hour
  return now - lastCheck > oneHour;
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
