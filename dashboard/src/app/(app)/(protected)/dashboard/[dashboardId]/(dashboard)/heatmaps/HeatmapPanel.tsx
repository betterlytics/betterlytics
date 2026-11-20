'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import type { eventWithTime } from '@rrweb/types';
import { Camera, ChevronDown, Globe, History, TriangleAlert, Video } from 'lucide-react';
import { trpc } from '@/trpc/client';
import { useBAQueryParams } from '@/trpc/hooks';
import { Button } from '@/components/ui/button';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { useDashboardAuth } from '@/contexts/DashboardAuthProvider';
import {
  HEATMAP_DEVICE_VIEWPORT_HEIGHTS,
  type HeatmapDevice,
  type HeatmapReplaySnapshot,
} from '@/entities/analytics/clickHeatmap.entities';
import type { HeatmapCapture } from '@/entities/analytics/heatmapCaptures.entities';
import { CaptureButton, CaptureHistoryMenu, useCaptureDetails } from './CaptureActions';
import { CaptureDialog } from './CaptureDialog';
import { FrameBadge, FrameLabel, FrameSpinner, HeatmapFrame } from './HeatmapFrame';
import { NoCaptureMessage, SetUpHeatmapsMessage } from './HeatmapsEmptyState';
import { LiveHeatmapView } from './LiveHeatmapView';
import { pageChangedSinceCapture, snapshotWindowHeight } from './pageChanged';
import { SnapshotHeatmapView } from './SnapshotHeatmapView';

type HeatmapPanelProps = {
  url: string;
  device: HeatmapDevice;
  /** Whether the site has any heatmap clicks at all, undefined while loading */
  siteHasClicks: boolean | undefined;
  selectedCaptureId: string | undefined;
  onSelectCapture: (captureId: string | undefined) => void;
};

/**
 * Picks the background for a page and device, in order: the chosen or newest capture, a
 * visitor's replay layout, the live page when it allows framing, else a prompt to capture.
 * Mounted once per page and device, so a new period keeps showing the current data until the
 * new data replaces it.
 */
export function HeatmapPanel({
  url,
  device,
  siteHasClicks,
  selectedCaptureId,
  onSelectCapture,
}: HeatmapPanelProps) {
  const t = useTranslations('components.heatmaps');
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
    { ...options, enabled: siteHasClicks === true },
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
  const wantsLivePage =
    siteHasClicks === true &&
    !isDemo &&
    !capturesLoading &&
    !backgroundQuery.isPending &&
    !useCapture &&
    !useReplay;
  const livePageQuery = trpc.clickHeatmap.livePage.useQuery(
    { ...input, url },
    { ...options, enabled: wantsLivePage },
  );

  const openCapture = () => setCapturing(true);
  // A capture that failed to load stays reachable, to pick another one or delete it
  const history = !useCapture && capture && (
    <CaptureHistoryMenu
      captures={captures}
      shownCaptureId={capture.id}
      onSelect={onSelectCapture}
      trigger={
        <Button variant='ghost' size='sm' className='h-7 cursor-pointer gap-1.5 px-2 text-xs'>
          <History className='size-3.5' />
          {t('capture.history', { count: captures.length })}
        </Button>
      }
    />
  );
  const actions = (
    <>
      {history}
      <CaptureButton onClick={openCapture} />
    </>
  );

  let view: ReactNode;
  const livePage = livePageQuery.data;
  if (siteHasClicks === false) {
    view = (
      <HeatmapFrame actions={actions}>
        <SetUpHeatmapsMessage />
      </HeatmapFrame>
    );
  } else if (
    siteHasClicks === undefined ||
    capturesLoading ||
    backgroundQuery.isPending ||
    (wantsLivePage && livePageQuery.isPending)
  ) {
    view = (
      <HeatmapFrame actions={actions}>
        <FrameSpinner />
      </HeatmapFrame>
    );
  } else if (useCapture) {
    view = (
      <CaptureHeatmap
        key={capture.id}
        url={url}
        device={device}
        capture={capture}
        captures={captures}
        onSelectCapture={onSelectCapture}
        onCapture={openCapture}
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
    view = (
      <HeatmapFrame
        info={<FrameLabel icon={<TriangleAlert />} label={t('source.none')} tone='warning' />}
        actions={actions}
      >
        <NoCaptureMessage onCapture={openCapture} />
      </HeatmapFrame>
    );
  }

  return (
    <>
      {view}
      {capturing && (
        <CaptureDialog
          pagePath={url}
          device={device}
          pageCaptures={pageCaptures}
          onClose={() => setCapturing(false)}
          onCaptured={onSelectCapture}
        />
      )}
    </>
  );
}

function snapshotKey(snapshot: HeatmapReplaySnapshot) {
  return `replay/${snapshot.sessionId}/${snapshot.filename}/${snapshot.snapshotMs}`;
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
  const clicks = trpc.clickHeatmap.clicks.useQuery({ ...input, url, device }, options).data;

  return (
    <HeatmapFrame
      info={<FrameLabel icon={<Globe />} label={t('source.live')} hint={t('source.liveHint')} />}
      actions={actions}
    >
      {clicks ? (
        <LiveHeatmapView
          pageUrl={pageUrl}
          pagePath={url}
          width={clicks.width}
          viewportHeight={HEATMAP_DEVICE_VIEWPORT_HEIGHTS[device]}
          points={clicks.points}
          onUnusable={onUnusable}
        />
      ) : (
        <FrameSpinner />
      )}
    </HeatmapFrame>
  );
}

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

type SnapshotBodyProps = {
  url: string;
  device: HeatmapDevice;
  width: number;
  snapshotMs: number;
  events: eventWithTime[] | undefined;
  info: ReactNode;
  actions: ReactNode;
  onUnusable: () => void;
};

function SnapshotBody({ url, device, width, snapshotMs, events, info, actions, onUnusable }: SnapshotBodyProps) {
  const { input, options } = useBAQueryParams();
  const anchorsQuery = trpc.clickHeatmap.anchors.useQuery({ ...input, url, device, width }, options);

  return (
    <HeatmapFrame info={info} actions={actions}>
      {events && anchorsQuery.data ? (
        <SnapshotHeatmapView
          events={events}
          snapshotMs={snapshotMs}
          viewportWidth={width}
          anchors={anchorsQuery.data}
          onUnusable={onUnusable}
        />
      ) : (
        <FrameSpinner />
      )}
    </HeatmapFrame>
  );
}

type CaptureHeatmapProps = {
  url: string;
  device: HeatmapDevice;
  capture: HeatmapCapture;
  captures: HeatmapCapture[];
  onSelectCapture: (captureId: string) => void;
  onCapture: () => void;
  onUnusable: () => void;
};

function CaptureHeatmap({
  url,
  device,
  capture,
  captures,
  onSelectCapture,
  onCapture,
  onUnusable,
}: CaptureHeatmapProps) {
  const t = useTranslations('components.heatmaps');
  const dashboardId = useDashboardId();
  const { input, options } = useBAQueryParams();
  const details = useCaptureDetails();
  const href = `/api/heatmap/captures/${encodeURIComponent(capture.id)}?${new URLSearchParams({ dashboardId })}`;
  const events = useSnapshotEvents(['heatmap-capture', dashboardId, capture.id], href, onUnusable);
  const pageHeightQuery = trpc.clickHeatmap.pageHeightSince.useQuery(
    { ...input, url, device, width: capture.viewportWidth, capturedAt: capture.createdAt },
    options,
  );
  const pageChanged = pageChangedSinceCapture(capture, snapshotWindowHeight(events), pageHeightQuery.data);
  const { date, name } = details(capture);

  return (
    <SnapshotBody
      url={url}
      device={device}
      width={capture.viewportWidth}
      snapshotMs={NaN}
      events={events}
      info={
        <>
          <CaptureHistoryMenu
            captures={captures}
            shownCaptureId={capture.id}
            onSelect={onSelectCapture}
            trigger={
              <Button
                variant='ghost'
                size='sm'
                className='text-muted-foreground hover:text-foreground h-7 min-w-0 shrink cursor-pointer gap-1.5 px-1.5 text-xs font-normal'
              >
                <Camera className='size-3.5' />
                <span className='truncate'>{t('source.capture', { date, name })}</span>
                <ChevronDown className='size-3.5 opacity-60' />
              </Button>
            }
          />
          {pageChanged && (
            <FrameBadge
              icon={<TriangleAlert />}
              label={t('capture.pageChanged')}
              hint={t('capture.pageChangedHint')}
            />
          )}
        </>
      }
      actions={
        <CaptureButton onClick={onCapture} label={pageChanged ? t('capture.recaptureButton') : undefined} />
      }
      onUnusable={onUnusable}
    />
  );
}

type ReplayHeatmapProps = {
  url: string;
  device: HeatmapDevice;
  snapshot: HeatmapReplaySnapshot;
  actions: ReactNode;
  onUnusable: () => void;
};

function ReplayHeatmap({ snapshot, url, device, actions, onUnusable }: ReplayHeatmapProps) {
  const t = useTranslations('components.heatmaps');
  const locale = useLocale();
  const dashboardId = useDashboardId();
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
      info={
        <FrameLabel
          icon={<Video />}
          label={t('source.replay', { date: recordedOn })}
          hint={t('source.replayHint')}
        />
      }
      actions={actions}
      onUnusable={onUnusable}
    />
  );
}
