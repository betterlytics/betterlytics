'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DATA_RETENTION_PRESETS } from '@/utils/settingsUtils';
import SettingsSection from '../SettingsSection';
import SettingsPageHeader from '../SettingsPageHeader';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { useSettings } from '@/contexts/SettingsProvider';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { updateDashboardSettingsAction } from '@/app/actions/dashboard/dashboardSettings.action';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/dialogs';
import { PermissionGate } from '@/components/tooltip/PermissionGate';

export default function DataSettings() {
  const dashboardId = useDashboardId();
  const { settings, refreshSettings } = useSettings();
  const t = useTranslations('components.dashboardSettingsDialog.data');
  const tSave = useTranslations('components.dashboardSettingsDialog');
  const tMisc = useTranslations('misc');

  const [dataRetentionDays, setDataRetentionDays] = useState<number | undefined>(settings?.dataRetentionDays);
  const [isPending, startTransition] = useTransition();

  const [pendingRetentionValue, setPendingRetentionValue] = useState<number | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleRetentionSelect = (value: string) => {
    const newValue = parseInt(value);
    if (newValue === dataRetentionDays) return;

    setPendingRetentionValue(newValue);
    setIsConfirmOpen(true);
  };

  const handleConfirmChange = () => {
    if (pendingRetentionValue === null) return;

    const previousValue = dataRetentionDays;
    setDataRetentionDays(pendingRetentionValue);
    setIsConfirmOpen(false);

    startTransition(async () => {
      try {
        await updateDashboardSettingsAction(dashboardId, { dataRetentionDays: pendingRetentionValue });
        await refreshSettings();
        toast.success(tSave('toastSuccess'));
      } catch {
        setDataRetentionDays(previousValue);
        toast.error(tSave('toastError'));
      } finally {
        setPendingRetentionValue(null);
      }
    });
  };

  const handleCancelChange = () => {
    setIsConfirmOpen(false);
    setPendingRetentionValue(null);
  };

  const getPendingPresetLabel = () => {
    const preset = DATA_RETENTION_PRESETS.find((p) => p.value === pendingRetentionValue);
    if (!preset) return '';
    return t(`presets.${preset.i18nKey}`);
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
    <div>
      <SettingsPageHeader title={t('title')} />

      <SettingsSection title={t('retentionTitle')}>
        <div className='flex items-center justify-between'>
          <div>
            <span className='text-sm font-medium'>{t('retentionLabel')}</span>
            <p className='text-muted-foreground text-xs'>{t('retentionHelp')}</p>
          </div>
          <PermissionGate>
            {(disabled) => (
              <Select
                value={dataRetentionDays?.toString() || '365'}
                onValueChange={handleRetentionSelect}
                disabled={isPending || disabled}
              >
                <SelectTrigger className='border-border w-36 cursor-pointer'>
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
            )}
          </PermissionGate>
        </div>
      </SettingsSection>

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={handleCancelChange}
        title={t('retentionConfirm.title')}
        description={t('retentionConfirm.description', { period: getPendingPresetLabel() })}
        onConfirm={handleConfirmChange}
      />
    </div>
  );
}
