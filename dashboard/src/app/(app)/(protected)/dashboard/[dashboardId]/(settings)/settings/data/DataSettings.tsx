'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DATA_RETENTION_PRESETS } from '@/utils/settingsUtils';
import SettingsSection from '@/components/settings/SettingsSection';
import SettingsPageHeader from '@/components/settings/SettingsPageHeader';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { useSettings } from '@/contexts/SettingsProvider';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { updateDashboardSettingsAction } from '@/app/actions/dashboard/dashboardSettings.action';
import { toast } from 'sonner';
import { DestructiveActionDialog } from '@/components/dialogs';
import { PermissionGate } from '@/components/tooltip/PermissionGate';
import { useCapabilities } from '@/contexts/CapabilitiesProvider';
import { ProBadge } from '@/components/billing/ProBadge';
import { getMaxRetentionDaysForTier } from '@/lib/billing/capabilities';

const SELF_SERVE_MAX_RETENTION_DAYS = getMaxRetentionDaysForTier('professional');

export default function DataSettings() {
  const dashboardId = useDashboardId();
  const { settings, refreshSettings } = useSettings();
  const { caps } = useCapabilities();
  const t = useTranslations('components.dashboardSettingsDialog');
  const [dataRetentionDays, setDataRetentionDays] = useState<number>(settings.dataRetentionDays);
  const [isPending, startTransition] = useTransition();
  const maxRetentionDays = caps.dataRetention.maxDataRetentionDays;
  const visibleRetentionPresets = DATA_RETENTION_PRESETS.filter(
    (preset) => preset.value <= maxRetentionDays || preset.value <= SELF_SERVE_MAX_RETENTION_DAYS,
  );

  const [pendingRetentionValue, setPendingRetentionValue] = useState<number | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const persistRetention = (newValue: number) => {
    const previousValue = dataRetentionDays;
    setDataRetentionDays(newValue);

    startTransition(async () => {
      try {
        await updateDashboardSettingsAction(dashboardId, { dataRetentionDays: newValue });
        await refreshSettings();
        toast.success(t('toastSuccess'));
      } catch {
        setDataRetentionDays(previousValue);
        toast.error(t('toastError'));
      }
    });
  };

  const handleRetentionSelect = (value: string) => {
    const newValue = parseInt(value);
    if (newValue === dataRetentionDays) return;
    if (newValue > maxRetentionDays) return;

    if (newValue >= dataRetentionDays) {
      persistRetention(newValue);
      return;
    }

    setPendingRetentionValue(newValue);
    setIsConfirmOpen(true);
  };

  const handleConfirmChange = () => {
    if (pendingRetentionValue === null) return;
    const newValue = pendingRetentionValue;
    setIsConfirmOpen(false);
    setPendingRetentionValue(null);
    persistRetention(newValue);
  };

  const handleCancelChange = () => {
    setIsConfirmOpen(false);
    setPendingRetentionValue(null);
  };

  const getPendingPresetLabel = () => {
    const preset = DATA_RETENTION_PRESETS.find((p) => p.value === pendingRetentionValue);
    if (!preset) return '';
    return t(`data.presets.${preset.i18nKey}`);
  };

  return (
    <div>
      <SettingsPageHeader title={t('title')} />

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
                  {visibleRetentionPresets.map((preset) => {
                    const abovePlan = preset.value > maxRetentionDays;
                    return (
                      <SelectItem
                        key={preset.value}
                        value={preset.value.toString()}
                        disabled={abovePlan}
                        className='cursor-pointer'
                      >
                        <span className='flex w-full items-center justify-between gap-2'>
                          <span>{t(`data.presets.${preset.i18nKey}`)}</span>
                          {abovePlan && <ProBadge showIcon={false} />}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          </PermissionGate>
        </div>
      </SettingsSection>

      <DestructiveActionDialog
        open={isConfirmOpen}
        onOpenChange={handleCancelChange}
        title={t('data.retentionConfirm.title')}
        description={t('data.retentionConfirm.description', { period: getPendingPresetLabel() })}
        onConfirm={handleConfirmChange}
        countdownSeconds={5}
        showIcon
      />
    </div>
  );
}
