'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
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
  const t = useTranslations('components.dashboardSettingsDialog');
  const [dataRetentionDays, setDataRetentionDays] = useState<number>(settings.dataRetentionDays);
  const [geoMinThreshold, setGeoMinThreshold] = useState<number>(settings.geoMinThreshold);
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
        toast.success(t('toastSuccess'));
      } catch {
        setDataRetentionDays(previousValue);
        toast.error(t('toastError'));
      } finally {
        setPendingRetentionValue(null);
      }
    });
  };

  const handleCancelChange = () => {
    setIsConfirmOpen(false);
    setPendingRetentionValue(null);
  };

  const saveThreshold = (newValue: number) => {
    if (newValue === settings.geoMinThreshold) return;

    const previousValue = geoMinThreshold;
    setGeoMinThreshold(newValue);

    startTransition(async () => {
      try {
        await updateDashboardSettingsAction(dashboardId, { geoMinThreshold: newValue });
        await refreshSettings();
        toast.success(t('toastSuccess'));
      } catch {
        setGeoMinThreshold(previousValue);
        toast.error(t('toastError'));
      }
    });
  };

  const handleThresholdBlur = () => {
    const clamped = Math.max(0, Math.min(100, geoMinThreshold));
    setGeoMinThreshold(clamped);
    saveThreshold(clamped);
  };

  const getPendingPresetLabel = () => {
    const preset = DATA_RETENTION_PRESETS.find((p) => p.value === pendingRetentionValue);
    if (!preset) return '';
    return t(`data.presets.${preset.i18nKey}`);
  };

  return (
    <div>
      <SettingsPageHeader title={t('title')} />

      <div className='space-y-12'>
      <SettingsSection title={t('data.retentionTitle')}>
        <div className='flex items-center justify-between'>
          <div>
            <span className='text-sm font-medium'>{t('data.retentionLabel')}</span>
            <p className='text-muted-foreground text-xs'>{t('data.retentionHelp')}</p>
          </div>
          <PermissionGate permission='canManageSettings'>
            {(disabled) => (
              <Select
                value={dataRetentionDays.toString()}
                onValueChange={handleRetentionSelect}
                disabled={isPending || disabled}
              >
                <SelectTrigger className='border-border w-36 cursor-pointer'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATA_RETENTION_PRESETS.map((preset) => (
                    <SelectItem key={preset.value} value={preset.value.toString()} className='cursor-pointer'>
                      {t(`data.presets.${preset.i18nKey}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </PermissionGate>
        </div>
      </SettingsSection>

      <SettingsSection title={t('data.geoThresholdTitle')}>
        <div className='flex items-center justify-between'>
          <div>
            <span className='text-sm font-medium'>{t('data.geoThresholdLabel')}</span>
            <p className='text-muted-foreground text-xs'>{t('data.geoThresholdHelp')}</p>
          </div>
          <PermissionGate permission='canManageSettings'>
            {(disabled) => (
              <Input
                type='number'
                min={0}
                max={100}
                value={geoMinThreshold}
                onChange={(e) => setGeoMinThreshold(parseInt(e.target.value) || 0)}
                onBlur={handleThresholdBlur}
                onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                disabled={isPending || disabled}
                className='border-border w-20 text-center'
              />
            )}
          </PermissionGate>
        </div>
      </SettingsSection>
      </div>

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={handleCancelChange}
        title={t('data.retentionConfirm.title')}
        description={t('data.retentionConfirm.description', { period: getPendingPresetLabel() })}
        onConfirm={handleConfirmChange}
      />
    </div>
  );
}
