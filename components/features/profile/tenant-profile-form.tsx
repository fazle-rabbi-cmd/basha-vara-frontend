'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/features/auth/auth-context';
import { useToast } from '@/components/shared/toast';
import { apiClient } from '@/lib/api-client';
import { User, Save, CheckCircle } from 'lucide-react';

interface TenantProfileFormProps {
  onSave?: () => void;
}

export function TenantProfileForm({ onSave }: TenantProfileFormProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  const [tenantProfile, setTenantProfile] = useState({
    occupation: '',
    maritalStatus: '',
    householdSize: '',
    hasChildren: false,
    childrenCount: '',
    youngestChildAge: '',
    oldestChildAge: '',
    hasPets: false,
    petType: '',
    smokingStatus: '',
    returnTimePreference: '',
    gender: '',
    bio: '',
  });

  useEffect(() => {
    if (user?.tenantProfile) {
      setTenantProfile({
        occupation: user.tenantProfile.occupation || '',
        maritalStatus: user.tenantProfile.maritalStatus || '',
        householdSize: user.tenantProfile.householdSize?.toString() || '',
        hasChildren: user.tenantProfile.hasChildren || false,
        childrenCount: user.tenantProfile.childrenCount?.toString() || '',
        youngestChildAge: user.tenantProfile.youngestChildAge?.toString() || '',
        oldestChildAge: user.tenantProfile.oldestChildAge?.toString() || '',
        hasPets: user.tenantProfile.hasPets || false,
        petType: user.tenantProfile.petType || '',
        smokingStatus: user.tenantProfile.smokingStatus || '',
        returnTimePreference: user.tenantProfile.returnTimePreference || '',
        gender: user.tenantProfile.gender || '',
        bio: user.tenantProfile.bio || '',
      });
    }
  }, [user]);

  const fetchCompletionPercentage = async () => {
    try {
      const percentage = await apiClient.users.getProfileCompletion();
      setCompletionPercentage(percentage);
    } catch (error) {
      console.error('Failed to fetch completion percentage:', error);
    }
  };

  useEffect(() => {
    fetchCompletionPercentage();
  }, [tenantProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await apiClient.users.updateTenantProfile({
        occupation: tenantProfile.occupation || undefined,
        maritalStatus: tenantProfile.maritalStatus || undefined,
        householdSize: tenantProfile.householdSize ? parseInt(tenantProfile.householdSize) : undefined,
        hasChildren: tenantProfile.hasChildren,
        childrenCount: tenantProfile.childrenCount ? parseInt(tenantProfile.childrenCount) : undefined,
        youngestChildAge: tenantProfile.youngestChildAge ? parseInt(tenantProfile.youngestChildAge) : undefined,
        oldestChildAge: tenantProfile.oldestChildAge ? parseInt(tenantProfile.oldestChildAge) : undefined,
        hasPets: tenantProfile.hasPets,
        petType: tenantProfile.petType || undefined,
        smokingStatus: tenantProfile.smokingStatus || undefined,
        returnTimePreference: tenantProfile.returnTimePreference || undefined,
        gender: tenantProfile.gender || undefined,
        bio: tenantProfile.bio || undefined,
      });

      showToast('success', 'Tenant profile updated successfully!');
      onSave?.();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Tenant Profile</span>
          </div>
          <div className="text-sm font-normal text-muted-foreground">
            {completionPercentage}% complete
          </div>
        </CardTitle>
        <CardDescription>
          Complete your profile to help landlords find the right tenant for their properties
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Profile Completion</span>
            <span>{completionPercentage}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="occupation">Occupation</Label>
              <Input
                id="occupation"
                placeholder="e.g., Software Engineer, Teacher"
                value={tenantProfile.occupation}
                onChange={(e) => setTenantProfile(prev => ({ ...prev, occupation: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                id="gender"
                value={tenantProfile.gender}
                onChange={(e) => setTenantProfile(prev => ({ ...prev, gender: e.target.value }))}
              >
                <option value="">Select gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </Select>
            </div>
          </div>

          {/* Personal Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maritalStatus">Marital Status</Label>
              <Select
                id="maritalStatus"
                value={tenantProfile.maritalStatus}
                onChange={(e) => setTenantProfile(prev => ({ ...prev, maritalStatus: e.target.value }))}
              >
                <option value="">Select status</option>
                <option value="SINGLE">Single</option>
                <option value="MARRIED">Married</option>
                <option value="DIVORCED">Divorced</option>
                <option value="WIDOWED">Widowed</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="householdSize">Family Size</Label>
              <Input
                id="householdSize"
                type="number"
                min="1"
                placeholder="Number of family members"
                value={tenantProfile.householdSize}
                onChange={(e) => setTenantProfile(prev => ({ ...prev, householdSize: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smokingStatus">Smoking Status</Label>
              <Select
                id="smokingStatus"
                value={tenantProfile.smokingStatus}
                onChange={(e) => setTenantProfile(prev => ({ ...prev, smokingStatus: e.target.value }))}
              >
                <option value="">Select status</option>
                <option value="NON_SMOKER">Non-smoker</option>
                <option value="SMOKER">Smoker</option>
                <option value="OCCASIONAL">Occasional</option>
              </Select>
            </div>
          </div>

          {/* Family Details */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="hasChildren"
                checked={tenantProfile.hasChildren}
                onCheckedChange={(checked) => setTenantProfile(prev => ({ ...prev, hasChildren: checked }))}
              />
              <Label htmlFor="hasChildren">I have children</Label>
            </div>

            {tenantProfile.hasChildren && (
              <div className="space-y-4 ml-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="childrenCount">Number of Children</Label>
                    <Input
                      id="childrenCount"
                      type="number"
                      min="0"
                      placeholder="How many children?"
                      value={tenantProfile.childrenCount}
                      onChange={(e) => setTenantProfile(prev => ({ ...prev, childrenCount: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="youngestChildAge">Youngest Child Age</Label>
                    <Input
                      id="youngestChildAge"
                      type="number"
                      min="0"
                      placeholder="e.g., 2"
                      value={tenantProfile.youngestChildAge}
                      onChange={(e) => setTenantProfile(prev => ({ ...prev, youngestChildAge: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="oldestChildAge">Oldest Child Age</Label>
                    <Input
                      id="oldestChildAge"
                      type="number"
                      min="0"
                      placeholder="e.g., 10"
                      value={tenantProfile.oldestChildAge}
                      onChange={(e) => setTenantProfile(prev => ({ ...prev, oldestChildAge: e.target.value }))}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Helps landlords match properties with appropriate child age restrictions
                </p>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                id="hasPets"
                checked={tenantProfile.hasPets}
                onCheckedChange={(checked) => setTenantProfile(prev => ({ ...prev, hasPets: checked }))}
              />
              <Label htmlFor="hasPets">I have pets</Label>
            </div>

            {tenantProfile.hasPets && (
              <div className="space-y-2 ml-8">
                <Label htmlFor="petType">Pet Type</Label>
                <Select
                  id="petType"
                  value={tenantProfile.petType}
                  onChange={(e) => setTenantProfile(prev => ({ ...prev, petType: e.target.value }))}
                >
                  <option value="">Select pet type</option>
                  <option value="DOG">Dog</option>
                  <option value="CAT">Cat</option>
                  <option value="BIRD">Bird</option>
                  <option value="OTHER">Other</option>
                </Select>
              </div>
            )}
          </div>

          {/* Return Time Preference */}
          <div className="space-y-2">
            <Label htmlFor="returnTimePreference">Preferred Return Time</Label>
            <Input
              id="returnTimePreference"
              type="time"
              value={tenantProfile.returnTimePreference}
              onChange={(e) => setTenantProfile(prev => ({ ...prev, returnTimePreference: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              The latest time you prefer to return home
            </p>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <textarea
              id="bio"
              className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Tell landlords about yourself..."
              value={tenantProfile.bio}
              onChange={(e) => setTenantProfile(prev => ({ ...prev, bio: e.target.value }))}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving} className="w-full md:w-auto">
              {isSaving ? 'Saving...' : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Tenant Profile
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
