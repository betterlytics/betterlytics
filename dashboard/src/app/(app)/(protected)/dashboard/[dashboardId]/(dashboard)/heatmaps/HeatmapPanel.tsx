'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import type { eventWithTime } from '@rrweb/types';
import { trpc } from '@/trpc/client';
import { useBAQueryParams } from '@/trpc/hooks';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { useDashboardAuth } from '@/contexts/DashboardAuthProvider';
import { useDashboardNavigation } from '@/contexts/DashboardNavigationContext';
import type { HeatmapDevice, HeatmapReplaySnapshot } from '@/entities/analytics/clickHeatmap.entities';
import type { HeatmapCapture } from '@/entities/analytics/heatmapCaptures.entities';
import { CaptureActions, useCaptureLabel } from './CaptureActions';
import { CaptureDialog } from './CaptureDialog';
import { HeatmapView } from './HeatmapView';
import { LiveHeatmapView } from './LiveHeatmapView';
import { SnapshotHeatmapView } from './SnapshotHeatmapView';

const PANEL_SKELETON = 'h-[calc(100vh-18rem)] min-h-96 w-full';

type HeatmapPanelProps = {
  url: string;
  device: HeatmapDevice;
  selectedCaptureId: string | undefined;
  onSelectCapture: (captureId: string | undefined) => void;
};

/**
 * Picks the background for a page and device, in order: the chosen or newest capture, a
 * visitor's replay layout, the live page when it allows framing, then the plain canvas with a
 * prompt to capture.
 */
export function HeatmapPanel({ url, device, selectedCaptureId, onSelectCapture }: HeatmapPanelProps) {
  const dashboardId = useDashboardId();
  const { isDemo } = useDashboardAuth();
  const { input, options } = useBAQueryParams();
  const capturesQuery = trpc.heatmapCaptures.list.useQuery(
    { dashboardId, path: url },
    // A capture finished in its own window shows up once the editor is back here
    { enabled: !isDemo, refetchOnWindowFocus: true },
  );
  const backgroundQuery = trpc.clickHeatmap.background.useQuery(
    { ...input, url, device },
    { ...options, placeholderData: undefined },
  );
  // Only ever grows, so a background that failed never comes back and the order always ends
  const [unusable, setUnusable] = useState<ReadonlySet<string>>(new Set());
  const [capturing, setCapturing] = useState(false);
  const markUnusable = (key: string) =>
    setUnusable((current) => (current.has(key) ? current : new Set(current).add(key)));

  const pageCaptures = capturesQuery.data ?? [];
  const captures = pageCaptures.filter((item) => item.device === device);
  const capture = captures.find((item) => item.id === selectedCaptureId) ?? captures[0];
  const background = backgroundQuery.data;
  // Public views have no captures (the query stays disabled) and no live page
  const capturesLoading = capturesQuery.isPending && !isDemo;
  const useCapture = capture !== undefined && !unusable.has(`capture/${capture.id}`);
  const useReplay =
    !useCapture && background?.kind === 'replay' && !unusable.has(snapshotKey(background.snapshot));
  const wantsLivePage = !isDemo && !capturesLoading && !backgroundQuery.isPending && !useCapture && !useReplay;
  const livePageQuery = trpc.clickHeatmap.livePage.useQuery(
    { ...input, url },
    { ...options, placeholderData: undefined, enabled: wantsLivePage },
  );

  if (capturesLoading || backgroundQuery.isPending || (wantsLivePage && livePageQuery.isPending)) {
    return <Skeleton className={PANEL_SKELETON} />;
  }
  const actions = (
    <CaptureActions
      captures={captures}
      shownCaptureId={capture?.id}
      onSelect={onSelectCapture}
      onCapture={() => setCapturing(true)}
    />
  );
  const dialog = capturing && (
    <CaptureDialog
      pagePath={url}
      device={device}
      pageCaptures={pageCaptures}
      onClose={() => setCapturing(false)}
      onCaptured={onSelectCapture}
    />
  );

  let view: ReactNode;
  const livePage = livePageQuery.data;
  if (useCapture) {
    view = (
      <CaptureHeatmap
        key={capture.id}
        url={url}
        device={device}
        capture={capture}
        actions={actions}
        onUnusable={() => markUnusable(`capture/${capture.id}`)}
      />
    );
  } else if (useReplay && background?.kind === 'replay') {
    const key = snapshotKey(background.snapshot);
    view = (
      <ReplayHeatmap
        key={key}
        url={url}
        device={device}
        snapshot={background.snapshot}
        actions={actions}
        onUnusable={() => markUnusable(key)}
      />
    );
  } else if (livePage && !unusable.has(`live/${livePage}`)) {
    view = (
      <LiveHeatmap
        key={livePage}
        url={url}
        device={device}
        pageUrl={livePage}
        actions={actions}
        onUnusable={() => markUnusable(`live/${livePage}`)}
      />
    );
  } else {
    view = <PlainHeatmap url={url} device={device} actions={actions} onCapture={() => setCapturing(true)} />;
  }

  return (
    <>
      {view}
      {dialog}
    </>
  );
}

function snapshotKey(snapshot: HeatmapReplaySnapshot) {
  return `replay/${snapshot.sessionId}/${snapshot.filename}/${snapshot.snapshotMs}`;
}

function PanelHeader({ children, actions }: { children: ReactNode; actions: ReactNode }) {
  return (
    <div className='flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between'>
      <div className='text-muted-foreground space-y-1 text-xs'>{children}</div>
      {actions}
    </div>
  );
}

type PlainHeatmapProps = { url: string; device: HeatmapDevice; actions: ReactNode; onCapture: () => void };

function PlainHeatmap({ url, device, actions, onCapture }: PlainHeatmapProps) {
  const t = useTranslations('components.heatmaps');
  const { input, options } = useBAQueryParams();
  const { hasPermission } = useDashboardAuth();
  const canCapture = hasPermission('canCaptureHeatmaps');
  const clicksQuery = trpc.clickHeatmap.clicks.useQuery(
    { ...input, url, device },
    { ...options, placeholderData: undefined },
  );

  if (!clicksQuery.data) {
    return <Skeleton className={PANEL_SKELETON} />;
  }

  const { width, height, points, fixedClicks } = clicksQuery.data;
  const fixedClicksNote = fixedClicks > 0 ? t('fixedClicksHidden', { count: fixedClicks }) : null;
  const prompt = (
    <div className='bg-muted/40 flex flex-col gap-2 rounded-md border p-3 text-sm sm:flex-row sm:items-center sm:justify-between'>
      <p>{canCapture ? t('capture.promptEditor') : t('capture.promptViewer')}</p>
      {canCapture && (
        <Button size='sm' variant='outline' className='cursor-pointer' onClick={onCapture}>
          {t('capture.captureButton')}
        </Button>
      )}
    </div>
  );

  if (points.length === 0 && fixedClicksNote) {
    return (
      <div className='space-y-2'>
        <PanelHeader actions={actions}>{null}</PanelHeader>
        {prompt}
        <div className='bg-card flex min-h-72 items-center justify-center rounded-lg border p-6 text-center'>
          <p className='text-muted-foreground'>{fixedClicksNote}</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-2'>
      <PanelHeader actions={actions}>
        <p>{t('noBackground')}</p>
        {fixedClicksNote && <p>{fixedClicksNote}</p>}
      </PanelHeader>
      {prompt}
      <HeatmapView width={width} height={height} points={points} />
    </div>
  );
}

type LiveHeatmapProps = {
  url: string;
  device: HeatmapDevice;
  pageUrl: string;
  actions: ReactNode;
  onUnusable: () => void;
};

function LiveHeatmap({ url, device, pageUrl, actions, onUnusable }: LiveHeatmapProps) {
  const t = useTranslations('components.heatmaps');
  const { input, options } = useBAQueryParams();
  const clicksQuery = trpc.clickHeatmap.clicks.useQuery(
    { ...input, url, device },
    { ...options, placeholderData: undefined },
  );

  if (!clicksQuery.data) {
    return <Skeleton className={PANEL_SKELETON} />;
  }

  const { width, points, fixedClicks } = clicksQuery.data;
  return (
    <div className='space-y-2'>
      <PanelHeader actions={actions}>
        <p>{t('livePage')}</p>
        {fixedClicks > 0 && <p>{t('fixedClicksHidden', { count: fixedClicks })}</p>}
      </PanelHeader>
      <LiveHeatmapView pageUrl={pageUrl} pagePath={url} width={width} points={points} onUnusable={onUnusable} />
    </div>
  );
}

type SnapshotSourceProps = {
  url: string;
  device: HeatmapDevice;
  actions: ReactNode;
  onUnusable: () => void;
};

function useSnapshotEvents(queryKey: unknown[], href: string, onUnusable: () => void) {
  const eventsQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await fetch(href);
      if (!response.ok) throw new Error(`Snapshot request failed with ${response.status}`);
      return (await response.json()) as eventWithTime[];
    },
    staleTime: Infinity,
    retry: false,
  });

  // An expired, deleted or unreadable snapshot falls back to the next background
  useEffect(() => {
    if (eventsQuery.isError) onUnusable();
  }, [eventsQuery.isError, onUnusable]);

  return eventsQuery.data;
}

function SnapshotBody({
  url,
  device,
  width,
  snapshotMs,
  events,
  header,
  actions,
  onUnusable,
}: {
  url: string;
  device: HeatmapDevice;
  width: number;
  snapshotMs: number;
  events: eventWithTime[] | undefined;
  header: ReactNode;
  actions: ReactNode;
  onUnusable: () => void;
}) {
  const t = useTranslations('components.heatmaps');
  const { input, options } = useBAQueryParams();
  const [unplacedFixed, setUnplacedFixed] = useState(0);
  const anchorsQuery = trpc.clickHeatmap.anchors.useQuery(
    { ...input, url, device, width },
    { ...options, placeholderData: undefined },
  );
  const handlePlaced = useCallback(({ unplacedFixed }: { unplacedFixed: number }) => setUnplacedFixed(unplacedFixed), []);

  if (!events || !anchorsQuery.data) {
    return <Skeleton className={PANEL_SKELETON} />;
  }

  return (
    <div className='space-y-2'>
      <PanelHeader actions={actions}>
        {header}
        {unplacedFixed > 0 && <p>{t('fixedClicksUnplaced', { count: unplacedFixed })}</p>}
      </PanelHeader>
      <SnapshotHeatmapView
        events={events}
        snapshotMs={snapshotMs}
        viewportWidth={width}
        anchors={anchorsQuery.data}
        onPlaced={handlePlaced}
        onUnusable={onUnusable}
      />
    </div>
  );
}

function CaptureHeatmap({ capture, url, device, actions, onUnusable }: SnapshotSourceProps & { capture: HeatmapCapture }) {
  const dashboardId = useDashboardId();
  const label = useCaptureLabel();
  const href = `/api/heatmap/captures/${encodeURIComponent(capture.id)}?${new URLSearchParams({ dashboardId })}`;
  const events = useSnapshotEvents(['heatmap-capture', dashboardId, capture.id], href, onUnusable);

  return (
    <SnapshotBody
      url={url}
      device={device}
      width={capture.viewportWidth}
      snapshotMs={NaN}
      events={events}
      header={<p>{label(capture)}</p>}
      actions={actions}
      onUnusable={onUnusable}
    />
  );
}

function ReplayHeatmap({ snapshot, url, device, actions, onUnusable }: SnapshotSourceProps & { snapshot: HeatmapReplaySnapshot }) {
  const t = useTranslations('components.heatmaps');
  const locale = useLocale();
  const dashboardId = useDashboardId();
  const { resolveHref } = useDashboardNavigation();
  const params = new URLSearchParams({
    dashboardId,
    sessionId: snapshot.sessionId,
    filename: snapshot.filename,
    snapshotMs: String(snapshot.snapshotMs),
  });
  const events = useSnapshotEvents(
    ['heatmap-replay-snapshot', dashboardId, snapshot.sessionId, snapshot.filename, snapshot.snapshotMs],
    `/api/replay/snapshot?${params}`,
    onUnusable,
  );
  const recordedOn = new Date(snapshot.recordedAtMs).toLocaleDateString(locale, { dateStyle: 'medium' });

  return (
    <SnapshotBody
      url={url}
      device={device}
      width={snapshot.viewportWidth}
      snapshotMs={snapshot.snapshotMs}
      events={events}
      header={
        <p>
          {t('replayBackground', { date: recordedOn })}{' '}
          <Link href={resolveHref(`/replay?sessionId=${snapshot.sessionId}`)} className='text-primary underline'>
            {t('watchReplay')}
          </Link>
        </p>
      }
      actions={actions}
      onUnusable={onUnusable}
    />
  );
}
