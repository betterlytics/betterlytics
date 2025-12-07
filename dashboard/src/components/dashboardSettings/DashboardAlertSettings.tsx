'use client';

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Bell } from 'lucide-react';
import { DashboardSettingsUpdate } from '@/entities/dashboard/dashboardSettings.entities';
import { ALERT_THRESHOLD_PRESETS } from '@/utils/settingsUtils';
import SettingsCard from '@/components/SettingsCard';

type AlertSettingsProps = {
  formData: DashboardSettingsUpdate;
  onUpdate: (updates: Partial<DashboardSettingsUpdate>) => void;
};

export default function AlertSettings({ formData, onUpdate }: AlertSettingsProps) {
  return (
    <SettingsCard
      icon={Bell}
      title='Traffic Alerts'
      description='Get notified when your traffic reaches certain thresholds'
    >
      <div className='flex items-center justify-between'>
        <div className='space-y-0.5'>
          <Label className='text-base'>Enable Alerts</Label>
          <p className='text-muted-foreground text-sm'>Receive notifications when traffic exceeds threshold</p>
        </div>
        <Switch
          checked={formData.alertsEnabled ?? false}
          onCheckedChange={(checked) => onUpdate({ alertsEnabled: checked })}
        />
      </div>

      {formData.alertsEnabled && (
        <>
          <Separator />
          <div className='space-y-2'>
            <Label className='text-base'>Alert Threshold</Label>
            <p className='text-muted-foreground mb-2 text-sm'>Send alert when daily visitors exceed this number</p>
            <Select
              value={formData.alertsThreshold?.toString() || '1000'}
              onValueChange={(value) => onUpdate({ alertsThreshold: parseInt(value) })}
            >
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALERT_THRESHOLD_PRESETS.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value.toString()}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}
    </SettingsCard>
  );
}
