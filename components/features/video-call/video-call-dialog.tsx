'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Video, ExternalLink } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/shared/toast';

interface VideoCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visitId: string;
  propertyTitle?: string;
}

export function VideoCallDialog({
  open,
  onOpenChange,
  visitId,
  propertyTitle,
}: VideoCallDialogProps) {
  const { showToast } = useToast();
  const [videoCallLink, setVideoCallLink] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateVideoCallLink = async () => {
    setIsGenerating(true);
    try {
      // Generate a unique Jitsi Meet room
      const roomName = `basha-vara-${visitId}-${Date.now()}`;
      const link = `https://meet.jit.si/${roomName}`;
      setVideoCallLink(link);
      
      // In a real implementation, you would save this link to the visit record
      // await apiClient.visits.updateVideoCallLink(visitId, link);
      
      showToast('success', 'Video call link generated');
    } catch (error: any) {
      showToast('error', error.message || 'Failed to generate video call link');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setVideoCallLink(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Video Call Tour
          </DialogTitle>
          <DialogDescription>
            {propertyTitle ? `Video call for ${propertyTitle}` : 'Start a video call to tour the property'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!videoCallLink ? (
            <div className="text-center py-8">
              <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Generate a secure video call link to conduct a virtual tour
              </p>
              <Button
                onClick={generateVideoCallLink}
                disabled={isGenerating}
              >
                {isGenerating ? 'Generating...' : 'Generate Video Call Link'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Your video call link:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm bg-background p-2 rounded border break-all">
                    {videoCallLink}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(videoCallLink)}
                  >
                    Copy
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => window.open(videoCallLink, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Video Call
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setVideoCallLink(null)}
                >
                  Generate New Link
                </Button>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>• This link uses Jitsi Meet (free, secure)</p>
                <p>• Share the link with the other party</p>
                <p>• No account needed to join</p>
                <p>• Video call will start when both parties join</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
