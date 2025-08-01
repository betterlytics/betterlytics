'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState, useEffect, useTransition } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useSettings } from '@/contexts/SettingsProvider';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { updateDashboardSettingsAction } from '@/app/actions/dashboardSettings';
import { DashboardSettingsUpdate } from '@/entities/dashboardSettings';
import DataDashboardSettings from '@/components/dashboardSettings/DashboardDataSettings';
import DangerZoneDashboardSettings from '@/components/dashboardSettings/DashboardDangerZoneSettings';
import useIsChanged from '@/hooks/use-is-changed';

interface SettingsTabConfig {
  id: string;
  label: string;
  component: React.ComponentType<{
    formData: DashboardSettingsUpdate;
    onUpdate: (updates: Partial<DashboardSettingsUpdate>) => void;
  }>;
}

const SETTINGS_TABS: SettingsTabConfig[] = [
  /*{
    id: 'display',
    label: 'Display',
    component: DisplayDashboardSettings,
  },*/
  {
    id: 'data',
    label: 'Data',
    component: DataDashboardSettings,
  },
  /*{
    id: 'reports',
    label: 'Reports',
    component: ReportDashboardSettings,
  },*/
  /*{
    id: 'alerts',
    label: 'Alerts',
    component: AlertDashboardSettings,
  },
  */
  {
    id: 'danger',
    label: 'Danger Zone',
    component: DangerZoneDashboardSettings,
  },
];

interface DashboardSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DashboardSettingsDialog({ open, onOpenChange }: DashboardSettingsDialogProps) {
  const dashboardId = useDashboardId();
  const { settings, refreshSettings } = useSettings();
  const [formData, setFormData] = useState<DashboardSettingsUpdate>({});
  const [activeTab, setActiveTab] = useState(SETTINGS_TABS[0].id);
  const [isPendingSave, startTransitionSave] = useTransition();
  const isFormChanged = useIsChanged(formData, settings);

  useEffect(() => {
    if (settings) {
      setFormData({ ...settings });
    }
  }, [settings]);

  const handleUpdate = (updates: Partial<DashboardSettingsUpdate>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleSave = () => {
    startTransitionSave(async () => {
      try {
        await updateDashboardSettingsAction(dashboardId, formData);
        await refreshSettings();
        toast.success('Settings saved successfully');
        onOpenChange(false);
      } catch {
        toast.error('Failed to save settings');
      }
    });
  };

  if (!settings) {
    return (
      <div className='flex items-center justify-center py-16'>
        <div className='flex flex-col items-center'>
          <div className='border-accent border-t-primary mb-2 h-10 w-10 animate-spin rounded-full border-4'></div>
          <p className='text-foreground'>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[80vh] overflow-y-auto sm:max-w-[700px]'>
        <DialogHeader>
          <DialogTitle>Dashboard Settings</DialogTitle>
          <DialogDescription>Configure your dashboard preferences and data collection settings.</DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className='space-y-6'>
          <TabsList className={`grid w-full grid-cols-${SETTINGS_TABS.length}`}>
            {SETTINGS_TABS.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {SETTINGS_TABS.map((tab) => {
            const Component = tab.component;
            return (
              <TabsContent key={tab.id} value={tab.id}>
                <Component formData={formData} onUpdate={handleUpdate} />
              </TabsContent>
            );
          })}

          <div className='flex justify-end border-t pt-6'>
            <Button onClick={handleSave} disabled={isPendingSave || !isFormChanged}>
              {isPendingSave ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <Save className='mr-2 h-4 w-4' />
              )}
              Save Changes
            </Button>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
