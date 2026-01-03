'use client';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Database } from 'lucide-react';
import { DATA_RETENTION_PRESETS } from '@/utils/settingsUtils';
import SaveableSettingsCard from '@/components/SaveableSettingsCard';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { useSettings } from '@/contexts/SettingsProvider';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { updateDashboardSettingsAction } from '@/app/actions/dashboard/dashboardSettings.action';
import { toast } from 'sonner';
import useIsChanged from '@/hooks/use-is-changed';

export default function DataSettings() {
  const dashboardId = useDashboardId();
  const { settings, refreshSettings } = useSettings();
  const t = useTranslations('components.dashboardSettingsDialog.data');
  const tSave = useTranslations('components.dashboardSettingsDialog');
  const tMisc = useTranslations('misc');

  const [dataRetentionDays, setDataRetentionDays] = useState<number | undefined>(settings?.dataRetentionDays);
  const [isPending, startTransition] = useTransition();

  const isChanged = useIsChanged({ dataRetentionDays }, { dataRetentionDays: settings?.dataRetentionDays });

  const handleSave = async () => {
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        try {
          await updateDashboardSettingsAction(dashboardId, { dataRetentionDays });
          await refreshSettings();
          toast.success(tSave('toastSuccess'));
          resolve();
        } catch {
          toast.error(tSave('toastError'));
          reject();
        }
      });
    });
  };

  if (!settings) {
    return (
      <div className='flex items-center justify-center py-16'>
        <div className='flex flex-col items-center'>
          <div className='border-accent border-t-primary mb-2 h-10 w-10 animate-spin rounded-full border-4'></div>
          <p className='text-foreground'>{tMisc('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <SaveableSettingsCard
      icon={Database}
      title={t('title')}
      description={t('description')}
      isChanged={isChanged}
      onSave={handleSave}
      isPending={isPending}
    >
      <div className='space-y-2'>
        <Label className='text-base'>{t('retentionLabel')}</Label>
        <p className='text-muted-foreground mb-2 text-sm'>{t('retentionHelp')}</p>
        <Select
          value={dataRetentionDays?.toString() || '365'}
          onValueChange={(value) => setDataRetentionDays(parseInt(value))}
        >
          <SelectTrigger className='border-border w-full cursor-pointer'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATA_RETENTION_PRESETS.map((preset) => (
              <SelectItem key={preset.value} value={preset.value.toString()} className='cursor-pointer'>
                {t(`presets.${preset.i18nKey}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </SaveableSettingsCard>
  );
}
