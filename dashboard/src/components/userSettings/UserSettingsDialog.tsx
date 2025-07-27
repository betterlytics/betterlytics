'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Shield, AlertTriangle, Loader2, Save, BarChart3, Receipt, User } from 'lucide-react';
import { useUserSettings } from '@/hooks/useUserSettings';
import { UserSettingsUpdate } from '@/entities/userSettings';
import { toast } from 'sonner';
import UserProfileSettings from '@/components/userSettings/UserProfileSettings';
import UserPreferencesSettings from '@/components/userSettings/UserPreferencesSettings';
import UserSecuritySettings from '@/components/userSettings/UserSecuritySettings';
import UserDangerZoneSettings from '@/components/userSettings/UserDangerZoneSettings';
import UserUsageSettings from '@/components/userSettings/UserUsageSettings';
import UserBillingHistory from '@/components/userSettings/UserBillingHistory';
import { Spinner } from '../ui/spinner';
import { useSessionRefresh } from '@/hooks/use-session-refresh';
import useIsChanged from '@/hooks/use-is-changed';
import { useClientFeatureFlags } from '@/hooks/use-client-feature-flags';

interface UserSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UserSettingsTabConfig {
  id: string;
  label: string;
  icon: React.ElementType;
  component: React.ComponentType<{
    formData: UserSettingsUpdate;
    onUpdate: (updates: Partial<UserSettingsUpdate>) => void;
    onCloseDialog?: () => void;
  }>;
  disabled?: boolean;
}

export default function UserSettingsDialog({ open, onOpenChange }: UserSettingsDialogProps) {
  const { settings, isLoading, isSaving, error, saveSettings } = useUserSettings();
  const { isFeatureFlagEnabled } = useClientFeatureFlags();

  const USER_SETTINGS_TABS: UserSettingsTabConfig[] = useMemo(
    () => [
      {
        id: 'profile',
        label: 'Profile',
        icon: User,
        component: UserProfileSettings,
      },
      {
        id: 'preferences',
        label: 'Preferences',
        icon: Settings,
        component: UserPreferencesSettings,
      },
      {
        id: 'usage',
        label: 'Usage',
        icon: BarChart3,
        component: UserUsageSettings,
        disabled: !isFeatureFlagEnabled('enableBilling'),
      },
      {
        id: 'billing',
        label: 'Billing',
        icon: Receipt,
        component: UserBillingHistory,
        disabled: !isFeatureFlagEnabled('enableBilling'),
      },
      {
        id: 'security',
        label: 'Security',
        icon: Shield,
        component: UserSecuritySettings,
      },
      {
        id: 'danger',
        label: 'Danger Zone',
        icon: AlertTriangle,
        component: UserDangerZoneSettings,
      },
    ],
    [isFeatureFlagEnabled],
  );

  const availableTabs = USER_SETTINGS_TABS.filter((tab) => !tab.disabled);
  const [activeTab, setActiveTab] = useState(availableTabs[0].id);
  const [formData, setFormData] = useState<UserSettingsUpdate>({});
  const { refreshSession } = useSessionRefresh();
  const isFormChanged = useIsChanged(formData, settings);

  useEffect(() => {
    if (settings) {
      setFormData({ ...settings });
    }
  }, [settings]);

  const handleUpdate = (updates: Partial<UserSettingsUpdate>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleSave = async () => {
    const result = await saveSettings(formData);
    if (result.success) {
      await refreshSession();
      toast.success('Settings saved successfully!');
      onOpenChange(false);
    } else {
      toast.error(result.error || 'Failed to save settings. Please try again.');
    }
  };

  const handleCloseDialog = () => {
    onOpenChange(false);
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='sm:max-w-[700px]'>
          <div className='flex flex-col items-center justify-center space-y-3 py-16'>
            <Spinner />
            <p className='text-muted-foreground text-sm'>Loading settings...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='sm:max-w-[700px]'>
          <div className='flex flex-col items-center justify-center space-y-3 py-16'>
            <AlertTriangle className='text-destructive h-8 w-8' />
            <div className='text-center'>
              <p className='text-destructive font-medium'>Failed to load settings</p>
              <p className='text-muted-foreground mt-1 text-sm'>{error}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!settings) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='sm:max-w-[700px]'>
          <div className='flex items-center justify-center py-8'>
            <span>No settings found</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[80vh] overflow-y-auto sm:max-w-[700px]'>
        <DialogHeader>
          <DialogTitle>User Settings</DialogTitle>
          <DialogDescription>Manage your account settings and preferences.</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
          <TabsList className='flex w-full'>
            {availableTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.id} value={tab.id} className='flex items-center gap-2'>
                  <Icon className='h-4 w-4' />
                  <span className='hidden sm:inline'>{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {availableTabs.map((tab) => {
            const Component = tab.component;
            return (
              <TabsContent key={tab.id} value={tab.id} className='mt-6'>
                <Component formData={formData} onUpdate={handleUpdate} onCloseDialog={handleCloseDialog} />
              </TabsContent>
            );
          })}
        </Tabs>

        <div className='flex justify-end space-x-2 border-t pt-4'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !isFormChanged}>
            {isSaving ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Saving...
              </>
            ) : (
              <>
                <Save className='mr-2 h-4 w-4' />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
