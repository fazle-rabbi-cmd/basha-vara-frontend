'use client';

import { PageLayout } from '@/components/layout/page-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  Settings,
  Bell,
  Shield,
  Globe,
  Trash2,
  Download,
  Camera,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  Moon,
  Sun,
  AlertTriangle,
  FileText,
  DollarSign,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '@/features/auth/auth-context';
import { useToast } from '@/components/shared/toast';
import { applyThemePreference, setThemePreference } from '@/components/shared/theme-provider';
import { useState, useEffect, useRef, Suspense } from 'react';
import { ProtectedRoute } from '@/features/auth/protected-route';
import { apiClient } from '@/lib/api-client';
import React from 'react';
import { UserDocumentUpload, UserDocumentType } from '@/components/shared/user-document-upload';
import { TenantProfileForm } from '@/components/features/profile/tenant-profile-form';
import { useSearchParams, useRouter } from 'next/navigation';

function SettingsPageContent() {
  const { user, isAuthenticated, logout } = useAuth();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'profile');
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [hasPassword, setHasPassword] = useState<boolean | undefined>(user?.hasPassword);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Profile settings
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    bio: '',
    photoUrl: '',
  });

  // Location settings
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [locationData, setLocationData] = useState({
    city: '',
    district: '',
    preferredAreas: '',
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    inApp: true,
    visitRequests: true,
    applicationUpdates: true,
    marketing: false,
  });

  // Privacy settings
  const [privacy, setPrivacy] = useState({
    showPhone: true,
    showEmail: false,
    profileVisibility: 'public',
  });

  // Theme settings
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');

  // Password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      setHasPassword(user.hasPassword);
      setProfileData({
        fullName: user.name,
        email: user.email,
        phone: user.phone || '',
        bio: '',
        photoUrl: '',
      });
    }

    // Load settings from localStorage
    const savedTheme = localStorage.getItem('theme');
    const themePreference = savedTheme === 'dark' || savedTheme === 'system' ? savedTheme : 'light';
    setTheme(themePreference);
    applyThemePreference(themePreference);

    const savedLocation = localStorage.getItem('locationEnabled');
    if (savedLocation !== null) {
      setLocationEnabled(JSON.parse(savedLocation));
    }
  }, [user]);

  // Handle tab from URL query param
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await apiClient.users.updateMe({
        fullName: profileData.fullName,
        phone: profileData.phone,
        avatarUrl: profileData.photoUrl,
      });
      showToast('success', 'Profile updated successfully');
    } catch (error) {
      showToast('error', 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('error', 'File size must be less than 2MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      showToast('error', 'Only image files are allowed');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const intent = await apiClient.uploads.createIntent(
        'profile_photo',
        undefined,
        file.type,
        file.size.toString(),
      );

      const uploadResponse = await fetch(intent.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to storage');
      }

      const result = await apiClient.uploads.completeProfileUpload(intent.storageKey);
      setProfileData({ ...profileData, photoUrl: result.publicUrl });
      showToast('success', 'Photo uploaded successfully');
    } catch (error) {
      showToast('error', 'Failed to upload photo');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleLocationSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      localStorage.setItem('locationEnabled', JSON.stringify(locationEnabled));
      await new Promise(resolve => setTimeout(resolve, 500));
      showToast('success', 'Location settings updated');
    } catch (error) {
      showToast('error', 'Failed to update location settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNotificationSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('notifications', JSON.stringify(notifications));
      await new Promise(resolve => setTimeout(resolve, 500));
      showToast('success', 'Notification preferences updated');
    } catch (error) {
      showToast('error', 'Failed to update notifications');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrivacySave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('privacy', JSON.stringify(privacy));
      await new Promise(resolve => setTimeout(resolve, 500));
      showToast('success', 'Privacy settings updated');
    } catch (error) {
      showToast('error', 'Failed to update privacy settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    setThemePreference(newTheme);
    showToast('success', `Theme set to ${newTheme}`);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('error', 'Passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      showToast('error', 'Password must be at least 8 characters');
      return;
    }
    setIsSaving(true);
    try {
      const result = await apiClient.auth.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword,
      );
      showToast('success', result.message);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setHasPassword(true);
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      showToast('error', 'Account deletion requires backend API');
    }
  };

  const handleExportData = () => {
    const data = {
      user,
      profile: profileData,
      notifications,
      privacy,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `basha-vara-data-${user?.id}.json`;
    a.click();
    showToast('success', 'Data exported successfully');
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    ...(user?.roles?.includes('tenant') ? [{ id: 'tenant-profile', label: 'Tenant Details', icon: User }] : []),
    ...(user?.roles?.includes('tenant') ? [{ id: 'documents', label: 'Documents', icon: FileText }] : []),
    { id: 'location', label: 'Location', icon: MapPin },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'appearance', label: 'Appearance', icon: Globe },
    { id: 'account', label: 'Account', icon: Settings },
  ];

  if (!isAuthenticated) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p>Please log in to access settings</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <ProtectedRoute>
      <PageLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-4">
                  <nav className="space-y-1">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          router.push(`/settings?tab=${tab.id}`);
                        }}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                          activeTab === tab.id
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        <tab.icon className="h-4 w-4" />
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </nav>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {activeTab === 'profile' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Settings</CardTitle>
                    <CardDescription>Update your personal information</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleProfileSave} className="space-y-6">
                      {/* Photo Upload */}
                      <div className="flex items-center space-x-4">
                        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                          {profileData.photoUrl ? (
                            <img src={profileData.photoUrl} alt="Profile" className="h-full w-full object-cover" />
                          ) : (
                            <User className="h-10 w-10 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploadingPhoto}
                          >
                            <Camera className="h-4 w-4 mr-2" />
                            {isUploadingPhoto ? 'Uploading...' : 'Change Photo'}
                          </Button>
                          <p className="text-xs text-muted-foreground mt-1">
                            JPG, PNG or GIF. Max 2MB
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            id="fullName"
                            value={profileData.fullName}
                            onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            value={profileData.email}
                            className="pl-10 bg-muted"
                            disabled
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            id="phone"
                            type="tel"
                            value={profileData.phone}
                            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                            className="pl-10"
                            placeholder="+880 1XXX-XXXXXX"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Input
                          id="bio"
                          value={profileData.bio}
                          onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                          placeholder="Tell us about yourself"
                        />
                      </div>

                      <Button type="submit" className="w-full" disabled={isSaving}>
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'tenant-profile' && user?.roles?.includes('tenant') && (
                <TenantProfileForm onSave={() => showToast('success', 'Tenant profile updated!')} />
              )}

              {activeTab === 'documents' && user?.roles?.includes('tenant') && (
                <>
                  <div className="bg-muted p-4 rounded-lg mb-6">
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>Why upload documents to your profile?</strong>
                    </p>
                    <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                      <li>Upload once, use for all applications</li>
                      <li>Landlords can review your documents before you apply</li>
                      <li>Increases your chances of getting shortlisted</li>
                      <li>Industry-standard practice on platforms like Zillow and Apartments.com</li>
                    </ul>
                  </div>

                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <ShieldCheck className="h-5 w-5 text-primary" />
                          Government ID
                        </CardTitle>
                        <CardDescription>
                          Passport, National ID, or Driver's License
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <UserDocumentUpload documentType={UserDocumentType.ID} autoSave={false} />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-primary" />
                          Proof of Income
                        </CardTitle>
                        <CardDescription>
                          Pay stubs, bank statements, or employment letter
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <UserDocumentUpload documentType={UserDocumentType.INCOME} autoSave={false} />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5 text-primary" />
                          Employment Letter
                        </CardTitle>
                        <CardDescription>
                          Employment verification letter from your employer
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <UserDocumentUpload documentType={UserDocumentType.EMPLOYMENT} autoSave={false} />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-primary" />
                          References
                        </CardTitle>
                        <CardDescription>
                          Previous landlord references or character references
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <UserDocumentUpload documentType={UserDocumentType.REFERENCE} autoSave={false} />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-primary" />
                          Rental History
                        </CardTitle>
                        <CardDescription>
                          Previous rental agreements or history
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <UserDocumentUpload documentType={UserDocumentType.RENTAL_HISTORY} autoSave={false} />
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}

              {activeTab === 'location' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Location Settings</CardTitle>
                    <CardDescription>Manage your location preferences</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleLocationSave} className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">Enable Location Services</h3>
                          <p className="text-sm text-muted-foreground">
                            Allow app to access your location for better property recommendations
                          </p>
                        </div>
                        <Switch
                          checked={locationEnabled}
                          onCheckedChange={setLocationEnabled}
                        />
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={locationData.city}
                          onChange={(e) => setLocationData({ ...locationData, city: e.target.value })}
                          placeholder="e.g., Dhaka"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="district">District</Label>
                        <Input
                          id="district"
                          value={locationData.district}
                          onChange={(e) => setLocationData({ ...locationData, district: e.target.value })}
                          placeholder="e.g., Dhaka District"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="preferredAreas">Preferred Areas</Label>
                        <Input
                          id="preferredAreas"
                          value={locationData.preferredAreas}
                          onChange={(e) => setLocationData({ ...locationData, preferredAreas: e.target.value })}
                          placeholder="e.g., Dhanmondi, Gulshan, Banani"
                        />
                      </div>

                      <Button type="submit" className="w-full" disabled={isSaving}>
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? 'Saving...' : 'Save Location Settings'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'notifications' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>Choose how you want to be notified</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Email Notifications</h3>
                        <p className="text-sm text-muted-foreground">Receive updates via email</p>
                      </div>
                      <Switch
                        checked={notifications.email}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Push Notifications</h3>
                        <p className="text-sm text-muted-foreground">Receive push notifications on your device</p>
                      </div>
                      <Switch
                        checked={notifications.push}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">In-App Notifications</h3>
                        <p className="text-sm text-muted-foreground">Show notifications within the app</p>
                      </div>
                      <Switch
                        checked={notifications.inApp}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, inApp: checked })}
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Visit Request Alerts</h3>
                        <p className="text-sm text-muted-foreground">Get notified about visit requests</p>
                      </div>
                      <Switch
                        checked={notifications.visitRequests}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, visitRequests: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Application Updates</h3>
                        <p className="text-sm text-muted-foreground">Get notified about application status</p>
                      </div>
                      <Switch
                        checked={notifications.applicationUpdates}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, applicationUpdates: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Marketing Emails</h3>
                        <p className="text-sm text-muted-foreground">Receive promotional content</p>
                      </div>
                      <Switch
                        checked={notifications.marketing}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, marketing: checked })}
                      />
                    </div>

                    <Button onClick={handleNotificationSave} className="w-full" disabled={isSaving}>
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? 'Saving...' : 'Save Preferences'}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'privacy' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Privacy Settings</CardTitle>
                    <CardDescription>Control your data visibility</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Show Phone Number</h3>
                        <p className="text-sm text-muted-foreground">Allow others to see your phone number</p>
                      </div>
                      <Switch
                        checked={privacy.showPhone}
                        onCheckedChange={(checked) => setPrivacy({ ...privacy, showPhone: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Show Email</h3>
                        <p className="text-sm text-muted-foreground">Allow others to see your email</p>
                      </div>
                      <Switch
                        checked={privacy.showEmail}
                        onCheckedChange={(checked) => setPrivacy({ ...privacy, showEmail: checked })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Profile Visibility</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {['public', 'private', 'friends'].map((option) => (
                          <Button
                            key={option}
                            type="button"
                            variant={privacy.profileVisibility === option ? 'default' : 'outline'}
                            onClick={() => setPrivacy({ ...privacy, profileVisibility: option })}
                            className="capitalize"
                          >
                            {option}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <Button onClick={handlePrivacySave} className="w-full" disabled={isSaving}>
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? 'Saving...' : 'Save Privacy Settings'}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'security' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                    <CardDescription>Manage your account security</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      {hasPassword !== false && (
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword">Current Password</Label>
                          <div className="relative">
                            <Input
                              id="currentPassword"
                              type={showPassword ? 'text' : 'password'}
                              value={passwordData.currentPassword}
                              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                              className="pr-10"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                      )}
                      {hasPassword === false && (
                        <p className="text-sm text-muted-foreground">
                          You signed in with Google. Create a password now for email sign-in.
                        </p>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showNewPassword ? 'text' : 'password'}
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            className="pr-10"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          required
                        />
                      </div>

                      <Button type="submit" className="w-full" disabled={isSaving}>
                        <Lock className="h-4 w-4 mr-2" />
                        {isSaving ? 'Changing...' : 'Change Password'}
                      </Button>
                    </form>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Two-Factor Authentication</h3>
                        <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                      </div>
                      <Badge variant="outline">Coming Soon</Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'appearance' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>Customize your app experience</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label>Theme</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          type="button"
                          variant={theme === 'light' ? 'default' : 'outline'}
                          onClick={() => handleThemeChange('light')}
                        >
                          <Sun className="h-4 w-4 mr-2" />
                          Light
                        </Button>
                        <Button
                          type="button"
                          variant={theme === 'dark' ? 'default' : 'outline'}
                          onClick={() => handleThemeChange('dark')}
                        >
                          <Moon className="h-4 w-4 mr-2" />
                          Dark
                        </Button>
                        <Button
                          type="button"
                          variant={theme === 'system' ? 'default' : 'outline'}
                          onClick={() => handleThemeChange('system')}
                        >
                          <Globe className="h-4 w-4 mr-2" />
                          System
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Language</h3>
                        <p className="text-sm text-muted-foreground">Select your preferred language</p>
                      </div>
                      <Badge variant="outline">Coming Soon</Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'account' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Account Management</CardTitle>
                    <CardDescription>Manage your account data</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-medium">Export Your Data</h3>
                          <p className="text-sm text-muted-foreground">Download all your data in JSON format</p>
                        </div>
                        <Button variant="outline" onClick={handleExportData}>
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
                        <div>
                          <h3 className="font-medium text-destructive">Delete Account</h3>
                          <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                        </div>
                        <Button variant="destructive" onClick={handleDeleteAccount}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <h3 className="font-medium">Account Information</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Account Type:</span>
                          <Badge>{user?.role}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <Badge variant="outline">{user?.status || 'ACTIVE'}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Member Since:</span>
                          <span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <Button variant="outline" onClick={logout} className="w-full">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </PageLayout>
    </ProtectedRoute>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <SettingsPageContent />
    </Suspense>
  );
}
