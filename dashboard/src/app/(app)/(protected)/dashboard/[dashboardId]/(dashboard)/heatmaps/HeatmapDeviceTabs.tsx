'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DeviceIcon } from '@/components/icons';
import { formatPercentage } from '@/utils/formatters';
import {
  HEATMAP_DEVICES,
  HeatmapDeviceSchema,
  type HeatmapDevice,
  type HeatmapDeviceShareRow,
} from '@/entities/analytics/clickHeatmap.entities';

type HeatmapDeviceTabsProps = {
  value: HeatmapDevice | undefined;
  shares: HeatmapDeviceShareRow[] | undefined;
  onValueChange: (device: HeatmapDevice) => void;
};

export function HeatmapDeviceTabs({ value, shares, onValueChange }: HeatmapDeviceTabsProps) {
  const t = useTranslations('components.heatmaps.devices');
  const locale = useLocale();
  const totalClicks = shares?.reduce((sum, share) => sum + share.clicks, 0) ?? 0;

  return (
    <Tabs value={value ?? ''} onValueChange={(next) => onValueChange(HeatmapDeviceSchema.parse(next))}>
      <TabsList className='bg-secondary dark:inset-shadow-background h-9 w-full gap-1 px-1 inset-shadow-sm sm:w-auto'>
        {HEATMAP_DEVICES.map((device) => {
          const clicks = shares?.find((share) => share.device === device)?.clicks ?? 0;
          return (
            <TabsTrigger
              key={device}
              value={device}
              className='hover:bg-accent text-muted-foreground data-[state=active]:border-border data-[state=active]:bg-background data-[state=active]:text-foreground cursor-pointer gap-1.5 rounded-sm border border-transparent px-3 py-1 text-xs font-medium data-[state=active]:shadow-sm'
            >
              <DeviceIcon type={device} className='size-3.5' />
              {t(device)}
              {shares && (
                <span className='text-muted-foreground font-normal tabular-nums'>
                  {formatPercentage(totalClicks > 0 ? (clicks / totalClicks) * 100 : 0, locale, {
                    maximumFractionDigits: 0,
                  })}
                </span>
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
