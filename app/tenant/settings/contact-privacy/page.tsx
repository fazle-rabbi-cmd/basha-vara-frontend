'use client';

import { PageLayout } from '@/components/layout/page-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/auth-context';
import { TenantRoute } from '@/features/auth/protected-route';
import { useToast } from '@/components/shared/toast';
import { apiClient } from '@/lib/api-client';
import { Shield, Eye, EyeOff, Info } from 'lucide-react';

type ContactVisibility = 'PLATFORM_ONLY' | 'MASKED' | 'FULL';
type ContactMilestone = 'NEVER' | 'VISIT_SCHEDULED' | 'APPLICATION_SUBMITTED' | 'APPLICATION_SHORTLISTED' | 'APPLICATION_ACCEPTED' | 'PAYMENT_INITIATED';

export default function ContactPrivacySettingsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [emailVisibility, setEmailVisibility] = useState<ContactVisibility>('MASKED');
  const [phoneVisibility, setPhoneVisibility] = useState<ContactVisibility>('MASKED');
  const [revealAfter, setRevealAfter] = useState<ContactMilestone>('APPLICATION_SHORTLISTED');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      const fetchSettings = async () => {
        setIsLoading(true);
        try {
          const profile = await apiClient.users.getById(user.id);
          if (profile.emailVisibility) setEmailVisibility(profile.emailVisibility);
          if (profile.phoneVisibility) setPhoneVisibility(profile.phoneVisibility);
          if (profile.revealContactAfterMilestone) setRevealAfter(profile.revealContactAfterMilestone);
        } catch (error) {
          console.error('Failed to load contact privacy settings', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchSettings();
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiClient.users.updateContactPrivacy({
        emailVisibility,
        phoneVisibility,
        revealContactAfterMilestone: revealAfter,
      });
      showToast('success', 'Contact privacy settings updated successfully');
    } catch (error: any) {
      showToast('error', error.message || 'Failed to update contact privacy settings');
    } finally {
      setIsSaving(false);
    }
  };

  const visibilityOptions: { value: ContactVisibility; label: string; description: string }[] = [
    {
      value: 'PLATFORM_ONLY',
      label: 'Platform Only (Hidden)',
      description: 'Contact info only visible through platform features',
    },
    {
      value: 'MASKED',
      label: 'Masked',
      description: 'Partially visible (e.g., j***@example.com, +880***5678)',
    },
    {
      value: 'FULL',
      label: 'Fully Visible',
      description: 'Contact info visible to everyone',
    },
  ];

  const milestoneOptions: { value: ContactMilestone; label: string; description: string }[] = [
    {
      value: 'NEVER',
      label: 'Never',
      description: 'Contact info never automatically revealed',
    },
    {
      value: 'VISIT_SCHEDULED',
      label: 'Visit Scheduled',
      description: 'Reveal after a visit is accepted',
    },
    {
      value: 'APPLICATION_SUBMITTED',
      label: 'Application Submitted',
      description: 'Reveal after application is submitted',
    },
    {
      value: 'APPLICATION_SHORTLISTED',
      label: 'Application Shortlisted',
      description: 'Reveal after application is shortlisted (recommended)',
    },
    {
      value: 'APPLICATION_ACCEPTED',
      label: 'Application Accepted',
      description: 'Reveal only after application is accepted',
    },
    {
      value: 'PAYMENT_INITIATED',
      label: 'Payment Initiated',
      description: 'Reveal only after payment is initiated',
    },
  ];

  return (
    <TenantRoute>
      <PageLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Contact Privacy Settings</h1>
            <p className="text-muted-foreground">
              Control how your contact information is shared with other users
            </p>
          </div>

          <div className="max-w-2xl space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Contact Information Visibility
                </CardTitle>
                <CardDescription>
                  Choose how your email and phone number are displayed to other users
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Email Visibility</Label>
                    <div className="mt-2 space-y-2">
                      {visibilityOptions.map((option) => (
                        <label
                          key={option.value}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            emailVisibility === option.value
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:bg-muted/50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="emailVisibility"
                            value={option.value}
                            checked={emailVisibility === option.value}
                            onChange={(e) => setEmailVisibility(e.target.value as ContactVisibility)}
                            className="mt-1"
                          />
                          <div>
                            <div className="font-medium text-sm">{option.label}</div>
                            <div className="text-xs text-muted-foreground">{option.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Phone Number Visibility</Label>
                    <div className="mt-2 space-y-2">
                      {visibilityOptions.map((option) => (
                        <label
                          key={option.value}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            phoneVisibility === option.value
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:bg-muted/50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="phoneVisibility"
                            value={option.value}
                            checked={phoneVisibility === option.value}
                            onChange={(e) => setPhoneVisibility(e.target.value as ContactVisibility)}
                            className="mt-1"
                          />
                          <div>
                            <div className="font-medium text-sm">{option.label}</div>
                            <div className="text-xs text-muted-foreground">{option.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Automatic Contact Reveal
                </CardTitle>
                <CardDescription>
                  Choose when your full contact information is automatically revealed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {milestoneOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        revealAfter === option.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="revealAfter"
                        value={option.value}
                        checked={revealAfter === option.value}
                        onChange={(e) => setRevealAfter(e.target.value as ContactMilestone)}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium text-sm">{option.label}</div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                  <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    This setting only applies when visibility is set to "Masked". If you choose "Platform Only" or "Fully Visible", contact information is handled accordingly.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => window.history.back()}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving || isLoading}>
                {isSaving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>
        </div>
      </PageLayout>
    </TenantRoute>
  );
}
