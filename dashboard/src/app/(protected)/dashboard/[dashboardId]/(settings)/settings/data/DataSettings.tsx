'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DATA_RETENTION_PRESETS } from '@/utils/settingsUtils';
import { GEO_LEVEL_VALUES, type GeoLevelSetting } from '@/entities/dashboard/dashboardSettings.entities';
import { DEFAULT_SITE_CONFIG_VALUES } from '@/entities/dashboard/siteConfig.entities';
import { saveSiteConfigAction } from '@/app/actions/dashboard/siteConfig.action';
import SettingsSection from '../SettingsSection';
import SettingsPageHeader from '../SettingsPageHeader';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { useSettings } from '@/contexts/SettingsProvider';
import { useSiteConfig } from '@/contexts/SiteConfigProvider';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { updateDashboardSettingsAction } from '@/app/actions/dashboard/dashboardSettings.action';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/dialogs';
import { PermissionGate } from '@/components/tooltip/PermissionGate';

export default function DataSettings() {
  const { siteConfig, refreshSiteConfig } = useSiteConfig();
  const config = siteConfig ?? DEFAULT_SITE_CONFIG_VALUES;
  const dashboardId = useDashboardId();
  const { settings, refreshSettings } = useSettings();
  const t = useTranslations('components.dashboardSettingsDialog');
  const [dataRetentionDays, setDataRetentionDays] = useState<number>(settings.dataRetentionDays);
  const [geoLevel, setGeoLevel] = useState<GeoLevelSetting>(config.geoLevel ?? 'COUNTRY');
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

  const saveGeoLevel = (newLevel: GeoLevelSetting) => {
    if (newLevel === geoLevel) return;
    const previousLevel = geoLevel;
    setGeoLevel(newLevel);

    startTransition(async () => {
      try {
        await saveSiteConfigAction(dashboardId, { geoLevel: newLevel });
        await refreshSiteConfig();
        toast.success(t('toastSuccess'));
      } catch {
        setGeoLevel(previousLevel);
        toast.error(t('toastError'));
      }
    });
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

      <SettingsSection title={t('data.geographyTitle')}>
          {/* Geography Level Selector */}
          <div className='flex items-center justify-between gap-2'>
            <div>
              <span className='text-sm font-medium'>{t('data.geoLevelLabel')}</span>
              <p className='text-muted-foreground text-xs'>{t('data.geoLevelHelp')}</p>
            </div>
            <PermissionGate permission='canManageSettings'>
              {(disabled) => (
                <Select
                  value={geoLevel}
                  onValueChange={(value) => saveGeoLevel(value as GeoLevelSetting)}
                  disabled={isPending || disabled}
                >
                  <SelectTrigger className='border-border max-w-36 cursor-pointer'>
                    <SelectValue className='truncate' />
                  </SelectTrigger>
                  <SelectContent>
                    {GEO_LEVEL_VALUES.map((level) => (
                      <SelectItem key={level} value={level} className='cursor-pointer'>
                        {t(`data.geoLevelOptions.${level}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
