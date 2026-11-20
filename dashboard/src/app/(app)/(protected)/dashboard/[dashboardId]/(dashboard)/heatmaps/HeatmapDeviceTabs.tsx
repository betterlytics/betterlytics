'use client';

import { useTranslations } from 'next-intl';
import { TriangleAlert } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DeviceIcon } from '@/components/icons';
import {
  HEATMAP_DEVICES,
  HeatmapDeviceSchema,
  type HeatmapDevice,
} from '@/entities/analytics/clickHeatmap.entities';

type HeatmapDeviceTabsProps = {
  value: HeatmapDevice;
  /** The devices the page has data from, or null without a page or when that isn't known */
  devicesWithData: HeatmapDevice[] | null;
  onValueChange: (device: HeatmapDevice) => void;
};

export function HeatmapDeviceTabs({ value, devicesWithData, onValueChange }: HeatmapDeviceTabsProps) {
  const t = useTranslations('components.heatmaps');

  return (
    <Tabs value={value} onValueChange={(next) => onValueChange(HeatmapDeviceSchema.parse(next))}>
      <TabsList className='h-7 gap-0.5 bg-transparent p-0'>
        {HEATMAP_DEVICES.map((device) => {
          const name = t(`devices.${device}`);
          const label =
            devicesWithData && !devicesWithData.includes(device) ? t('deviceNoData', { device: name }) : null;
          return (
            <Tooltip key={device} disableHoverableContent>
              <TooltipTrigger asChild>
                {/* The tooltip sets its own data-state on the trigger, so the selected tab is styled by aria-selected */}
                <TabsTrigger
                  value={device}
                  aria-label={label ?? name}
                  className='text-muted-foreground hover:text-foreground aria-selected:bg-card aria-selected:text-foreground aria-selected:ring-border dark:aria-selected:bg-accent dark:aria-selected:text-foreground relative size-7 flex-none cursor-pointer rounded-md border-0 p-0 aria-selected:shadow-sm aria-selected:ring-1'
                >
                  <DeviceIcon type={device} className='size-3.5' />
                  {label && (
                    <TriangleAlert className='absolute top-0.5 right-0.5 size-2.5 fill-amber-500 text-amber-50 dark:text-amber-950' />
                  )}
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent side='bottom' className='max-w-xs'>
                {label ?? name}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
