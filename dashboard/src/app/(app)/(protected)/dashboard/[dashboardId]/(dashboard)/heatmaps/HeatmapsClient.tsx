'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { FileText } from 'lucide-react';
import { trpc } from '@/trpc/client';
import { useBAQueryParams } from '@/trpc/hooks';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { Skeleton } from '@/components/ui/skeleton';
import {
  HEATMAP_PAGE_LIMIT,
  HeatmapDeviceSchema,
  type HeatmapDevice,
} from '@/entities/analytics/clickHeatmap.entities';
import { FrameMessage, FrameSpinner, HeatmapFrame } from './HeatmapFrame';
import { HeatmapDeviceTabs } from './HeatmapDeviceTabs';
import { HeatmapPagePicker } from './HeatmapPagePicker';
import { HeatmapPanel } from './HeatmapPanel';
import { SetUpHeatmapsMessage } from './HeatmapsEmptyState';
import { defaultHeatmapDevice, selectHeatmapPage } from './heatmapSelection';

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

export function HeatmapsClient() {
  const t = useTranslations('components.heatmaps');
  const dashboardId = useDashboardId();
  const { input, options } = useBAQueryParams();
  const selection = useHeatmapSelection();

  const hasDataQuery = trpc.clickHeatmap.hasData.useQuery({ dashboardId });
  // Unknown when the check fails, which only costs the setup prompt
  const siteHasClicks = hasDataQuery.isError ? true : hasDataQuery.data;
  const pagesQuery = trpc.clickHeatmap.pages.useQuery(input, options);
  const pages = useMemo(() => pagesQuery.data ?? [], [pagesQuery.data]);
  const truncated = pages.length >= HEATMAP_PAGE_LIMIT;
  const {
    path: selectedPath,
    devices: devicesWithData,
    options: pageOptions,
  } = useMemo(() => selectHeatmapPage(pages, selection.path, truncated), [pages, selection.path, truncated]);
  const device = selection.device ?? defaultHeatmapDevice(devicesWithData);

  // Defaults go into the address once known, so a new period never moves to another page or device
  const { setSelection } = selection;
  const pinned = selection.path !== undefined && selection.device !== undefined;
  useEffect(() => {
    if (!pinned && selectedPath && !pagesQuery.isPlaceholderData) setSelection({ path: selectedPath, device });
  }, [pinned, selectedPath, device, pagesQuery.isPlaceholderData, setSelection]);

  let content;
  if (pagesQuery.isPending || (!selectedPath && siteHasClicks === undefined)) {
    content = <FrameSpinner />;
  } else if (!selectedPath) {
    content =
      siteHasClicks === false ? (
        <SetUpHeatmapsMessage />
      ) : (
        <FrameMessage
          icon={<FileText className='h-5 w-5' />}
          title={t('empty.noPages')}
          description={t('empty.widenRange')}
        />
      );
  } else {
    content = (
      <HeatmapPanel
        key={`${selectedPath}|${device}`}
        url={selectedPath}
        device={device}
        siteHasClicks={siteHasClicks}
        selectedCaptureId={selection.capture}
        onSelectCapture={(capture) => setSelection({ capture })}
      />
    );
  }

  return (
    <HeatmapFrame
      page={
        pagesQuery.isPending ? (
          <Skeleton className='mx-1.5 h-4 w-40' />
        ) : (
          <HeatmapPagePicker
            pages={pageOptions}
            truncated={truncated}
            value={selectedPath}
            onValueChange={(path) => setSelection({ path, device: undefined, capture: undefined })}
          />
        )
      }
      devices={
        <HeatmapDeviceTabs
          value={device}
          devicesWithData={devicesWithData}
          onValueChange={(next) => setSelection({ device: next, capture: undefined })}
        />
      }
    >
      {content}
    </HeatmapFrame>
  );
}
