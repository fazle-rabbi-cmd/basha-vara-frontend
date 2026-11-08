'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertTriangle, Rocket } from 'lucide-react';
import type { AppVersion } from '@/lib/version';
import {
  CURRENT_VERSION,
  checkForUpdate,
  saveLastCheck,
  skipVersion,
  isVersionSkipped,
} from '@/lib/version';
import { AppUpdater } from '@/lib/app-updater';
import { Capacitor } from '@capacitor/core';

interface UpdateModalProps {
  onUpdate?: () => void;
}

export function UpdateModal({ onUpdate }: UpdateModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [latestVersion, setLatestVersion] = useState<AppVersion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const hasCheckedRef = useRef(false);

  async function checkUpdates() {
    // Check if we checked recently (within 5 minutes)
    const lastCheck = localStorage.getItem('basha_vara_last_version_check');
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    if (lastCheck && now - parseInt(lastCheck) < fiveMinutes) {
      return; // Skip if checked recently
    }

    setIsLoading(true);
    try {
      const update = await checkForUpdate();
      if (update && !isVersionSkipped(update.version)) {
        setLatestVersion(update);
        setIsOpen(true);
      }
      saveLastCheck();
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // Only check once per session to prevent duplicate calls
    if (!hasCheckedRef.current) {
      checkUpdates();
      hasCheckedRef.current = true;
    }
  }, []);

  const handleUpdate = async () => {
    const version = latestVersion;
    if (!version) return;

    setIsLoading(true);
    try {
      if (Capacitor.isNativePlatform() && version.apkUrl) {
        await AppUpdater.downloadAndInstall({
          url: version.apkUrl,
          fileName: `basha-vara-${version.version}.apk`,
        });
      } else {
        window.location.reload();
        onUpdate?.();
      }
    } catch (error) {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    if (latestVersion) {
      skipVersion(latestVersion.version);
    }
    setIsOpen(false);
  };

  const handleLater = () => {
    setIsOpen(false);
  };

  if (!latestVersion) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader>
          <div className="bg-primary px-6 py-7 text-primary-foreground">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-foreground/15">
                {latestVersion.isCritical ? <AlertTriangle className="h-6 w-6" /> : <Rocket className="h-6 w-6" />}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide opacity-80">New update available</p>
                <DialogTitle className="mt-1 text-2xl text-primary-foreground">Basha Vara {latestVersion.version}</DialogTitle>
              </div>
            </div>
            <DialogDescription className="text-primary-foreground/85">
              Get the latest improvements and a smoother Basha Vara experience.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-4 px-6 py-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Current Version</span>
            <Badge variant="outline">{CURRENT_VERSION.version}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">New Version</span>
            <Badge variant="default">{latestVersion.version}</Badge>
          </div>

          {latestVersion.features.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">What&apos;s New:</p>
              <ul className="space-y-1">
                {latestVersion.features.map((feature, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {latestVersion.isCritical && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <p className="text-sm text-destructive font-medium">
                This update includes important security fixes and is highly recommended.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col-reverse gap-3 border-t bg-muted/30 px-6 py-5 sm:flex-row sm:justify-end">
          {!latestVersion.isCritical && (
            <Button variant="ghost" onClick={handleSkip} className="w-full sm:w-auto">
              Skip This Version
            </Button>
          )}
          <Button variant="outline" onClick={handleLater} className="w-full sm:w-auto">
            Remind Me Later
          </Button>
          <Button onClick={handleUpdate} disabled={isLoading || (Capacitor.isNativePlatform() && !latestVersion.apkUrl)} className="w-full sm:w-auto">
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload Now
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
