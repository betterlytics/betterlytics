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
          const noData =
            devicesWithData && !devicesWithData.includes(device) ? t('deviceNoData', { device: name }) : null;
          return (
            // Hoverable content keeps a wide no-data tooltip open while the pointer moves on to the next tab
            <Tooltip key={device} disableHoverableContent>
              <TooltipTrigger asChild>
                {/* The tooltip sets its own data-state on the trigger, so the selected tab is styled by aria-selected */}
                <TabsTrigger
                  value={device}
                  aria-label={noData ?? name}
                  className='text-muted-foreground hover:text-foreground aria-selected:bg-card aria-selected:text-foreground aria-selected:ring-border dark:aria-selected:bg-accent dark:aria-selected:text-foreground h-7 min-w-7 flex-none cursor-pointer rounded-md border-0 px-0 text-xs aria-selected:shadow-sm aria-selected:ring-1 @5xl:px-2.5'
                >
                  <span className='relative flex'>
                    <DeviceIcon type={device} className='size-3.5' />
                    {noData && (
                      <TriangleAlert className='absolute -top-1 -right-1 size-2.5 fill-amber-500 text-amber-50 dark:text-amber-950' />
                    )}
                  </span>
                  <span className='hidden @5xl:inline'>{name}</span>
                </TabsTrigger>
              </TooltipTrigger>
              {noData && (
                <TooltipContent side='bottom' className='max-w-xs'>
                  {noData}
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
