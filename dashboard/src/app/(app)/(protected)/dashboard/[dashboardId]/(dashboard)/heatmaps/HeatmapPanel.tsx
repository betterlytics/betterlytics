'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import type { eventWithTime } from '@rrweb/types';
import { trpc } from '@/trpc/client';
import { useBAQueryParams } from '@/trpc/hooks';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { useDashboardNavigation } from '@/contexts/DashboardNavigationContext';
import type { HeatmapDevice, HeatmapReplaySnapshot } from '@/entities/analytics/clickHeatmap.entities';
import { HeatmapView } from './HeatmapView';
import { SnapshotHeatmapView } from './SnapshotHeatmapView';

const PANEL_SKELETON = 'h-[calc(100vh-18rem)] min-h-96 w-full';

type HeatmapPanelProps = {
  url: string;
  device: HeatmapDevice;
};

/** Picks the background for a page and device: a visitor's replay layout, else the plain canvas */
export function HeatmapPanel({ url, device }: HeatmapPanelProps) {
  const { input, options } = useBAQueryParams();
  const backgroundQuery = trpc.clickHeatmap.background.useQuery(
    { ...input, url, device },
    { ...options, placeholderData: undefined },
  );
  const [unusableSnapshot, setUnusableSnapshot] = useState<string | null>(null);

  if (backgroundQuery.isPending) {
    return <Skeleton className={PANEL_SKELETON} />;
  }

  const background = backgroundQuery.data;
  if (background?.kind === 'replay') {
    const key = snapshotKey(background.snapshot);
    if (unusableSnapshot !== key) {
      return (
        <ReplayHeatmap
          key={key}
          url={url}
          device={device}
          snapshot={background.snapshot}
          onUnusable={() => setUnusableSnapshot(key)}
        />
      );
    }
  }

  return <PlainHeatmap url={url} device={device} />;
}

function snapshotKey(snapshot: HeatmapReplaySnapshot) {
  return `${snapshot.sessionId}/${snapshot.filename}/${snapshot.snapshotMs}`;
}

function PlainHeatmap({ url, device }: HeatmapPanelProps) {
  const t = useTranslations('components.heatmaps');
  const { input, options } = useBAQueryParams();
  const clicksQuery = trpc.clickHeatmap.clicks.useQuery(
    { ...input, url, device },
    { ...options, placeholderData: undefined },
  );

  if (!clicksQuery.data) {
    return <Skeleton className={PANEL_SKELETON} />;
  }

  const { width, height, points, fixedClicks } = clicksQuery.data;
  const fixedClicksNote = fixedClicks > 0 ? t('fixedClicksHidden', { count: fixedClicks }) : null;

  if (points.length === 0 && fixedClicksNote) {
    return (
      <div className='bg-card flex min-h-72 items-center justify-center rounded-lg border p-6 text-center'>
        <p className='text-muted-foreground'>{fixedClicksNote}</p>
      </div>
    );
  }

  return (
    <div className='space-y-2'>
      <p className='text-muted-foreground text-xs'>{t('noBackground')}</p>
      {fixedClicksNote && <p className='text-muted-foreground text-xs'>{fixedClicksNote}</p>}
      <HeatmapView width={width} height={height} points={points} />
    </div>
  );
}

type ReplayHeatmapProps = HeatmapPanelProps & {
  snapshot: HeatmapReplaySnapshot;
  onUnusable: () => void;
};

function ReplayHeatmap({ url, device, snapshot, onUnusable }: ReplayHeatmapProps) {
  const t = useTranslations('components.heatmaps');
  const locale = useLocale();
  const dashboardId = useDashboardId();
  const { resolveHref } = useDashboardNavigation();
  const { input, options } = useBAQueryParams();
  const [unplacedFixed, setUnplacedFixed] = useState(0);

  const eventsQuery = useQuery({
    queryKey: ['heatmap-replay-snapshot', dashboardId, snapshot.sessionId, snapshot.filename, snapshot.snapshotMs],
    queryFn: async () => {
      const params = new URLSearchParams({
        dashboardId,
        sessionId: snapshot.sessionId,
        filename: snapshot.filename,
        snapshotMs: String(snapshot.snapshotMs),
      });
      const response = await fetch(`/api/replay/snapshot?${params}`);
      if (!response.ok) throw new Error(`Replay snapshot request failed with ${response.status}`);
      return (await response.json()) as eventWithTime[];
    },
    staleTime: Infinity,
    retry: false,
  });
  const anchorsQuery = trpc.clickHeatmap.anchors.useQuery(
    { ...input, url, device, width: snapshot.viewportWidth },
    { ...options, placeholderData: undefined },
  );

  // An expired or unreadable segment falls back to the plain canvas
  useEffect(() => {
    if (eventsQuery.isError) onUnusable();
  }, [eventsQuery.isError, onUnusable]);

  const handlePlaced = useCallback(({ unplacedFixed }: { unplacedFixed: number }) => setUnplacedFixed(unplacedFixed), []);

  if (!eventsQuery.data || !anchorsQuery.data) {
    return <Skeleton className={PANEL_SKELETON} />;
  }

  const recordedOn = new Date(snapshot.recordedAtMs).toLocaleDateString(locale, { dateStyle: 'medium' });

  return (
    <div className='space-y-2'>
      <p className='text-muted-foreground text-xs'>
        {t('replayBackground', { date: recordedOn })}{' '}
        <Link href={resolveHref(`/replay?sessionId=${snapshot.sessionId}`)} className='text-primary underline'>
          {t('watchReplay')}
        </Link>
      </p>
      {unplacedFixed > 0 && (
        <p className='text-muted-foreground text-xs'>{t('fixedClicksUnplaced', { count: unplacedFixed })}</p>
      )}
      <SnapshotHeatmapView
        events={eventsQuery.data}
        snapshotMs={snapshot.snapshotMs}
        viewportWidth={snapshot.viewportWidth}
        anchors={anchorsQuery.data}
        onPlaced={handlePlaced}
        onUnusable={onUnusable}
      />
    </div>
  );
}
