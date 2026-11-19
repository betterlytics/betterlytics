'use client';

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { MousePointerClick } from 'lucide-react';
import { trpc } from '@/trpc/client';
import { useBAQueryParams } from '@/trpc/hooks';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DeviceIcon } from '@/components/icons';
import {
  HeatmapDeviceSchema,
  type HeatmapDevice,
  type HeatmapDeviceShareRow,
} from '@/entities/analytics/clickHeatmap.entities';
import { FrameMessage, FrameSpinner, HeatmapFrame } from './HeatmapFrame';
import { HeatmapDeviceTabs } from './HeatmapDeviceTabs';
import { HeatmapPagePicker } from './HeatmapPagePicker';
import { HeatmapPanel } from './HeatmapPanel';
import { HeatmapsEmptyState } from './HeatmapsEmptyState';

function useHeatmapSelection() {
  const searchParams = useSearchParams();
  const path = searchParams?.get('path') || undefined;
  const parsedDevice = HeatmapDeviceSchema.safeParse(searchParams?.get('device'));
  const device = parsedDevice.success ? parsedDevice.data : undefined;
  const capture = searchParams?.get('capture') || undefined;

  const setSelection = useCallback((next: { path?: string; device?: HeatmapDevice; capture?: string }) => {
    const params = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const query = params.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
  }, []);

  return { path, device, capture, setSelection };
}

function pickBusiestDevice(shares: HeatmapDeviceShareRow[]): HeatmapDevice {
  return shares.reduce((best, share) => (share.clicks > best.clicks ? share : best), shares[0]).device;
}

export function HeatmapsClient() {
  const t = useTranslations('components.heatmaps');
  const dashboardId = useDashboardId();
  const { input, options } = useBAQueryParams();
  const selection = useHeatmapSelection();

  const hasDataQuery = trpc.clickHeatmap.hasData.useQuery({ dashboardId });
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

  if (pagesQuery.isPending || (!selectedPath && hasDataQuery.isPending)) {
    return (
      <div className='space-y-3'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <Skeleton className='h-9 w-full sm:w-96' />
          <Skeleton className='h-9 w-full sm:w-72' />
        </div>
        <HeatmapFrame>
          <FrameSpinner />
        </HeatmapFrame>
      </div>
    );
  }

  if (!selectedPath) {
    if (hasDataQuery.data === false) return <HeatmapsEmptyState />;
    return (
      <HeatmapFrame>
        <FrameMessage
          icon={<MousePointerClick className='h-5 w-5' />}
          title={t('empty.noClicks')}
          description={t('empty.widenRange')}
        />
      </HeatmapFrame>
    );
  }

  const deviceClicks = shares?.find((share) => share.device === selectedDevice)?.clicks ?? 0;
  const devicesWithClicks = shares?.filter((share) => share.clicks > 0 && share.device !== selectedDevice) ?? [];

  let content;
  if (!shares || !selectedDevice) {
    content = (
      <HeatmapFrame>
        <FrameSpinner />
      </HeatmapFrame>
    );
  } else if (totalClicks === 0) {
    content = (
      <HeatmapFrame>
        <FrameMessage
          icon={<MousePointerClick className='h-5 w-5' />}
          title={t('empty.noClicks')}
          description={t('empty.widenRange')}
        />
      </HeatmapFrame>
    );
  } else if (deviceClicks === 0) {
    content = (
      <HeatmapFrame>
        <FrameMessage
          icon={<DeviceIcon type={selectedDevice} className='h-5 w-5' />}
          title={t('empty.noDeviceClicks', { device: t(`devices.${selectedDevice}`) })}
        >
          <div className='flex flex-wrap justify-center gap-2'>
            {devicesWithClicks.map((share) => (
              <Button
                key={share.device}
                variant='outline'
                size='sm'
                className='cursor-pointer'
                onClick={() => selection.setSelection({ device: share.device, capture: undefined })}
              >
                <DeviceIcon type={share.device} className='size-3.5' />
                {t('empty.showDevice', { device: t(`devices.${share.device}`) })}
              </Button>
            ))}
          </div>
        </FrameMessage>
      </HeatmapFrame>
    );
  } else {
    content = (
      <HeatmapPanel
        url={selectedPath}
        device={selectedDevice}
        selectedCaptureId={selection.capture}
        onSelectCapture={(capture) => selection.setSelection({ capture })}
      />
    );
  }

  return (
    <div className='space-y-3'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <HeatmapPagePicker
          pages={pageOptions}
          value={selectedPath}
          onValueChange={(path) => selection.setSelection({ path, device: undefined, capture: undefined })}
        />
        <HeatmapDeviceTabs
          value={selectedDevice}
          shares={shares}
          onValueChange={(device) => selection.setSelection({ device, capture: undefined })}
        />
      </div>
      {content}
    </div>
  );
}
