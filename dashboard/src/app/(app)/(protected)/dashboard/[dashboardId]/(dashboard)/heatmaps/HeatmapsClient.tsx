'use client';

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { trpc } from '@/trpc/client';
import { useBAQueryParams } from '@/trpc/hooks';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UnderlineTabs, UnderlineTabsList, UnderlineTabsTrigger } from '@/components/ui/UnderlineTabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import DataEmptyComponent from '@/components/DataEmptyComponent';
import { formatPercentage } from '@/utils/formatters';
import {
  HEATMAP_DEVICES,
  HeatmapDeviceSchema,
  type HeatmapDevice,
  type HeatmapDeviceShareRow,
} from '@/entities/analytics/clickHeatmap.entities';
import { HeatmapPanel } from './HeatmapPanel';

function useHeatmapSelection() {
  const searchParams = useSearchParams();
  const path = searchParams?.get('path') || undefined;
  const parsedDevice = HeatmapDeviceSchema.safeParse(searchParams?.get('device'));
  const device = parsedDevice.success ? parsedDevice.data : undefined;

  const setSelection = useCallback((next: { path?: string; device?: HeatmapDevice }) => {
    const params = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const query = params.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
  }, []);

  return { path, device, setSelection };
}

function pickBusiestDevice(shares: HeatmapDeviceShareRow[]): HeatmapDevice {
  return shares.reduce((best, share) => (share.clicks > best.clicks ? share : best), shares[0]).device;
}

export function HeatmapsClient() {
  const t = useTranslations('components.heatmaps');
  const locale = useLocale();
  const { input, options } = useBAQueryParams();
  const selection = useHeatmapSelection();

  const pagesQuery = trpc.clickHeatmap.pages.useQuery(input, options);
  const pages = useMemo(() => pagesQuery.data ?? [], [pagesQuery.data]);
  const selectedPath = selection.path ?? pages[0]?.url;

  const devicesQuery = trpc.clickHeatmap.devices.useQuery(
    { ...input, url: selectedPath ?? '' },
    { ...options, placeholderData: undefined, enabled: selectedPath !== undefined },
  );
  const shares = devicesQuery.data;
  const totalClicks = shares?.reduce((sum, share) => sum + share.clicks, 0) ?? 0;
  const selectedDevice = selection.device ?? (shares ? pickBusiestDevice(shares) : undefined);

  const pageOptions = useMemo(() => {
    if (!selectedPath || pages.some((page) => page.url === selectedPath)) return pages;
    return [{ url: selectedPath, clicks: totalClicks }, ...pages];
  }, [pages, selectedPath, totalClicks]);

  if (pagesQuery.isPending) {
    return <Skeleton className='h-[calc(100vh-14rem)] min-h-96 w-full' />;
  }

  if (!selectedPath) {
    return (
      <div className='bg-card rounded-lg border'>
        <DataEmptyComponent />
      </div>
    );
  }

  const deviceClicks = shares?.find((share) => share.device === selectedDevice)?.clicks ?? 0;
  const devicesWithClicks = shares?.filter((share) => share.clicks > 0 && share.device !== selectedDevice) ?? [];

  return (
    <div className='space-y-3'>
      <div className='flex flex-col gap-3 md:flex-row md:items-end md:justify-between'>
        <Select value={selectedPath} onValueChange={(path) => selection.setSelection({ path, device: undefined })}>
          <SelectTrigger className='w-full md:w-96' aria-label={t('pagePicker')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageOptions.map((page) => (
              <SelectItem key={page.url} value={page.url}>
                <span className='truncate'>{page.url}</span>
                <span className='text-muted-foreground ml-2 text-xs'>{t('clicks', { count: page.clicks })}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <UnderlineTabs
          value={selectedDevice ?? ''}
          onValueChange={(value) => selection.setSelection({ device: HeatmapDeviceSchema.parse(value) })}
        >
          <UnderlineTabsList>
            {HEATMAP_DEVICES.map((device) => {
              const clicks = shares?.find((share) => share.device === device)?.clicks ?? 0;
              const share = totalClicks > 0 ? (clicks / totalClicks) * 100 : 0;
              return (
                <UnderlineTabsTrigger key={device} value={device}>
                  {t(`devices.${device}`)}
                  <span className='text-muted-foreground ml-1.5 text-xs'>
                    {shares ? formatPercentage(share, locale, { maximumFractionDigits: 0 }) : ''}
                  </span>
                </UnderlineTabsTrigger>
              );
            })}
          </UnderlineTabsList>
        </UnderlineTabs>
      </div>

      {!shares || !selectedDevice ? (
        <Skeleton className='h-[calc(100vh-18rem)] min-h-96 w-full' />
      ) : totalClicks === 0 ? (
        <div className='bg-card rounded-lg border'>
          <DataEmptyComponent />
        </div>
      ) : deviceClicks === 0 ? (
        <div className='bg-card flex min-h-72 flex-col items-center justify-center gap-3 rounded-lg border p-6 text-center'>
          <p className='text-muted-foreground'>{t('noDeviceClicks', { device: t(`devices.${selectedDevice}`) })}</p>
          <div className='flex flex-wrap justify-center gap-2'>
            {devicesWithClicks.map((share) => (
              <Button
                key={share.device}
                variant='outline'
                size='sm'
                className='cursor-pointer'
                onClick={() => selection.setSelection({ device: share.device })}
              >
                {t('showDevice', { device: t(`devices.${share.device}`), count: share.clicks })}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <HeatmapPanel url={selectedPath} device={selectedDevice} />
      )}
    </div>
  );
}
