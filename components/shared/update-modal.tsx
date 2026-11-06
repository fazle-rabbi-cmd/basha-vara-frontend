'use client';

import { useState, useEffect } from 'react';
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
import { Download, X, RefreshCw, AlertTriangle } from 'lucide-react';
import type { AppVersion } from '@/lib/version';
import {
  checkForUpdate,
  shouldCheckForUpdate,
  saveLastCheck,
  skipVersion,
  isVersionSkipped,
} from '@/lib/version';

interface UpdateModalProps {
  onUpdate?: () => void;
}

export function UpdateModal({ onUpdate }: UpdateModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [latestVersion, setLatestVersion] = useState<AppVersion | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check for updates on mount
    if (shouldCheckForUpdate()) {
      checkUpdates();
    }
  }, []);

  const checkUpdates = async () => {
    setIsLoading(true);
    try {
      const update = await checkForUpdate();
      if (update && !isVersionSkipped(update.version)) {
        setLatestVersion(update);
        setIsOpen(true);
      }
      saveLastCheck();
    } catch (error) {
      console.error('Failed to check for updates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = () => {
    // Reload the app to get the latest version
    window.location.reload();
    onUpdate?.();
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {latestVersion.isCritical ? (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            ) : (
              <Download className="h-5 w-5 text-primary" />
            )}
            <DialogTitle>
              {latestVersion.isCritical ? 'Critical Update Available' : 'New Update Available'}
            </DialogTitle>
          </div>
          <DialogDescription>
            A new version of Basha Vara is available with improvements and new features.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Current Version</span>
            <Badge variant="outline">1.0.0</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">New Version</span>
            <Badge variant="default">{latestVersion.version}</Badge>
          </div>

          {latestVersion.features.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">What's New:</p>
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

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {!latestVersion.isCritical && (
            <Button variant="ghost" onClick={handleSkip} className="w-full sm:w-auto">
              Skip This Version
            </Button>
          )}
          <Button variant="outline" onClick={handleLater} className="w-full sm:w-auto">
            Later
          </Button>
          <Button onClick={handleUpdate} className="w-full sm:w-auto">
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Update Now
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
