'use client';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Database } from 'lucide-react';
import { DashboardSettingsUpdate } from '@/entities/dashboardSettings';
import { DATA_RETENTION_PRESETS } from '@/utils/settingsUtils';
import SettingsCard from '@/components/SettingsCard';
import { useTranslations } from 'next-intl';

type DataSettingsProps = {
  formData: DashboardSettingsUpdate;
  onUpdate: (updates: Partial<DashboardSettingsUpdate>) => void;
};

export default function DataSettings({ formData, onUpdate }: DataSettingsProps) {
  const t = useTranslations('components.dashboardSettingsDialog.data');
  return (
    <SettingsCard icon={Database} title={t('title')} description={t('description')}>
      <div className='space-y-2'>
        <Label className='text-base'>{t('retentionLabel')}</Label>
        <p className='text-muted-foreground mb-2 text-sm'>{t('retentionHelp')}</p>
        <Select
          value={formData.dataRetentionDays?.toString() || '365'}
          onValueChange={(value) => onUpdate({ dataRetentionDays: parseInt(value) })}
        >
          <SelectTrigger className='w-full'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATA_RETENTION_PRESETS.map((preset) => (
              <SelectItem key={preset.value} value={preset.value.toString()}>
                {(() => {
                  try {
                    return t(`presets.${preset.i18nKey}`);
                  } catch {
                    return preset.fallback;
                  }
                })()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </SettingsCard>
  );
}
