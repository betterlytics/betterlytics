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
import { useTranslations } from 'next-intl';
import { saveDashboardConfigAction } from '@/app/actions/siteConfig';
import type { DashboardConfigUpdate } from '@/entities/dashboardConfig';
import { useDashboardConfig } from '@/hooks/use-dashboard-config';

interface SettingsTabConfig {
  id: string;
  label: string;
  component: React.ComponentType<{
    dashboardSettings: DashboardSettingsUpdate;
    onUpdate: (updates: Partial<DashboardSettingsUpdate>) => void;
    dashboardConfig: DashboardConfigUpdate;
    onConfigChange: (next: DashboardConfigUpdate) => void;
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
  const t = useTranslations('components.dashboardSettingsDialog');

  const { config, initialConfig, isLoading, setConfig, commitInitialConfig } = useDashboardConfig();
  const isConfigChanged = useIsChanged<DashboardConfigUpdate>(config, initialConfig);

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
        const tasks: Promise<
          | Awaited<ReturnType<typeof updateDashboardSettingsAction>>
          | Awaited<ReturnType<typeof saveDashboardConfigAction>>
        >[] = [];

        if (isFormChanged) {
          tasks.push(updateDashboardSettingsAction(dashboardId, formData));
        }

        if (isConfigChanged && config) {
          tasks.push(saveDashboardConfigAction(dashboardId, config as DashboardConfigUpdate));
        }

        if (tasks.length > 0) {
          await Promise.all(tasks);
        }

        await refreshSettings();

        if (isConfigChanged) {
          commitInitialConfig();
        }
        toast.success(t('toastSuccess'));
        onOpenChange(false);
      } catch {
        toast.error(t('toastError'));
      }
    });
  };

  if (!settings || isLoading || !config) {
    return (
      <div className='flex items-center justify-center py-16'>
        <div className='flex flex-col items-center'>
          <div className='border-accent border-t-primary mb-2 h-10 w-10 animate-spin rounded-full border-4'></div>
          <p className='text-foreground'>{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[80vh] overflow-y-auto p-3 sm:max-w-[700px] sm:p-6'>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className='space-y-6'>
          <TabsList
            className={`grid w-full grid-cols-${SETTINGS_TABS.length} bg-secondary dark:inset-shadow-background gap-1 px-1 inset-shadow-sm`}
          >
            {SETTINGS_TABS.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className='hover:bg-accent text-muted-foreground data-[state=active]:border-border data-[state=active]:bg-background data-[state=active]:text-foreground cursor-pointer rounded-sm border border-transparent px-3 py-1 text-xs font-medium data-[state=active]:shadow-sm'
              >
                {tab.id === 'data' ? t('tabs.data') : t('tabs.danger')}
              </TabsTrigger>
            ))}
          </TabsList>

          {SETTINGS_TABS.map((tab) => {
            const Component = tab.component;
            return (
              <TabsContent key={tab.id} value={tab.id}>
                <Component
                  dashboardSettings={formData}
                  onUpdate={handleUpdate}
                  dashboardConfig={config}
                  onConfigChange={(next: DashboardConfigUpdate) => setConfig(next)}
                />
              </TabsContent>
            );
          })}

          <div className='flex justify-end border-t pt-6'>
            <Button
              onClick={handleSave}
              disabled={isPendingSave || (!isFormChanged && !isConfigChanged)}
              className='cursor-pointer'
            >
              {isPendingSave ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <Save className='mr-2 h-4 w-4' />
              )}
              {t('saveChanges')}
            </Button>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
