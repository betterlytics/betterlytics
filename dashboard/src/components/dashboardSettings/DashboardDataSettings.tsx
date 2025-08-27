'use client';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Database } from 'lucide-react';
import { DashboardSettingsUpdate } from '@/entities/dashboardSettings';
import { DATA_RETENTION_PRESETS } from '@/utils/settingsUtils';
import SettingsCard from '@/components/SettingsCard';

type DataSettingsProps = {
  formData: DashboardSettingsUpdate;
  onUpdate: (updates: Partial<DashboardSettingsUpdate>) => void;
};

export default function DataSettings({ formData, onUpdate }: DataSettingsProps) {
  return (
    <SettingsCard
      icon={Database}
      title='Data Management'
      description='Configure data retention and collection preferences'
    >
      <div className='space-y-2'>
        <Label className='text-base'>Data Retention Period</Label>
        <p className='text-muted-foreground mb-2 text-sm'>
          How long to keep analytics data before automatic deletion
        </p>
        <Select
          value={formData.dataRetentionDays?.toString() || '365'}
          onValueChange={(value) => onUpdate({ dataRetentionDays: parseInt(value) })}
        >
          <SelectTrigger className='w-full'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATA_RETENTION_PRESETS.map((preset) => (
              <SelectItem
                key={preset.value}
                value={preset.value.toString()}
                className='hover:bg-[var(--hover)] focus:bg-[var(--hover)]'
              >
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </SettingsCard>
  );
}
