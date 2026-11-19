'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import type { eventWithTime } from '@rrweb/types';
import { Camera, ChevronDown, EyeOff, Globe, History, SquareDashed, TriangleAlert, Video } from 'lucide-react';
import { trpc } from '@/trpc/client';
import { useBAQueryParams } from '@/trpc/hooks';
import { Button } from '@/components/ui/button';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { useDashboardAuth } from '@/contexts/DashboardAuthProvider';
import { useDashboardNavigation } from '@/contexts/DashboardNavigationContext';
import {
  HEATMAP_DEVICE_VIEWPORT_HEIGHTS,
  type HeatmapDevice,
  type HeatmapReplaySnapshot,
} from '@/entities/analytics/clickHeatmap.entities';
import type { HeatmapCapture } from '@/entities/analytics/heatmapCaptures.entities';
import { CaptureButton, CaptureHistoryMenu, useCaptureDetails } from './CaptureActions';
import { CaptureDialog } from './CaptureDialog';
import { FrameBadge, FrameLabel, FrameMessage, FrameSpinner, HeatmapFrame } from './HeatmapFrame';
import { HeatmapView } from './HeatmapView';
import { LiveHeatmapView } from './LiveHeatmapView';
import { pageChangedSinceCapture, snapshotWindowHeight } from './pageChanged';
import { SnapshotHeatmapView } from './SnapshotHeatmapView';

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
  const t = useTranslations('components.heatmaps.capture');
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
    return (
      <HeatmapFrame>
        <FrameSpinner />
      </HeatmapFrame>
    );
  }

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
          {t('history', { count: captures.length })}
        </Button>
      }
    />
  );
  const actions = (emphasis: boolean) => (
    <>
      {history}
      <CaptureButton onClick={openCapture} emphasis={emphasis} />
    </>
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
        actions={actions(false)}
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
        actions={actions(false)}
        onUnusable={() => markUnusable(`live/${livePage}`)}
      />
    );
  } else {
    view = <PlainHeatmap url={url} device={device} actions={actions(true)} />;
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

function HiddenClicksBadge({ hint, count }: { hint: string; count: number }) {
  const t = useTranslations('components.heatmaps');
  if (count === 0) return null;
  return <FrameBadge icon={<EyeOff />} label={t('hiddenClicks', { count })} hint={hint} />;
}

function useHeatmapClicks(url: string, device: HeatmapDevice) {
  const { input, options } = useBAQueryParams();
  return trpc.clickHeatmap.clicks.useQuery({ ...input, url, device }, { ...options, placeholderData: undefined })
    .data;
}

type PlainHeatmapProps = { url: string; device: HeatmapDevice; actions: ReactNode };

function PlainHeatmap({ url, device, actions }: PlainHeatmapProps) {
  const t = useTranslations('components.heatmaps');
  const { hasPermission } = useDashboardAuth();
  const clicks = useHeatmapClicks(url, device);

  return (
    <HeatmapFrame
      info={
        <>
          <FrameLabel
            icon={<SquareDashed />}
            label={t('source.none')}
            hint={hasPermission('canCaptureHeatmaps') ? t('source.noneHintEditor') : t('source.noneHintViewer')}
          />
          {clicks && clicks.points.length > 0 && (
            <HiddenClicksBadge
              count={clicks.fixedClicks}
              hint={t('fixedClicksHidden', { count: clicks.fixedClicks })}
            />
          )}
        </>
      }
      actions={actions}
    >
      {!clicks ? (
        <FrameSpinner />
      ) : clicks.points.length === 0 ? (
        <FrameMessage
          icon={<EyeOff className='h-5 w-5' />}
          title={t('fixedClicksHidden', { count: clicks.fixedClicks })}
        />
      ) : (
        <HeatmapView width={clicks.width} height={clicks.height} points={clicks.points} />
      )}
    </HeatmapFrame>
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
  const clicks = useHeatmapClicks(url, device);

  return (
    <HeatmapFrame
      info={
        <>
          <FrameLabel icon={<Globe />} label={t('source.live')} hint={t('source.liveHint')} />
          {clicks && (
            <HiddenClicksBadge
              count={clicks.fixedClicks}
              hint={t('fixedClicksHidden', { count: clicks.fixedClicks })}
            />
          )}
        </>
      }
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
  const t = useTranslations('components.heatmaps');
  const { input, options } = useBAQueryParams();
  const [unplacedFixed, setUnplacedFixed] = useState(0);
  const anchorsQuery = trpc.clickHeatmap.anchors.useQuery(
    { ...input, url, device, width },
    { ...options, placeholderData: undefined },
  );
  const handlePlaced = useCallback(({ unplacedFixed }: { unplacedFixed: number }) => setUnplacedFixed(unplacedFixed), []);

  return (
    <HeatmapFrame
      info={
        <>
          {info}
          <HiddenClicksBadge count={unplacedFixed} hint={t('fixedClicksUnplaced', { count: unplacedFixed })} />
        </>
      }
      actions={actions}
    >
      {events && anchorsQuery.data ? (
        <SnapshotHeatmapView
          events={events}
          snapshotMs={snapshotMs}
          viewportWidth={width}
          anchors={anchorsQuery.data}
          onPlaced={handlePlaced}
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
    { ...options, placeholderData: undefined },
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
              tone='warning'
            />
          )}
        </>
      }
      actions={
        <CaptureButton
          onClick={onCapture}
          emphasis={pageChanged}
          label={pageChanged ? t('capture.recaptureButton') : undefined}
        />
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
      info={
        <>
          <FrameLabel
            icon={<Video />}
            label={t('source.replay', { date: recordedOn })}
            hint={t('source.replayHint')}
          />
          <Link
            href={resolveHref(`/replay?sessionId=${snapshot.sessionId}`)}
            className='text-primary shrink-0 px-1 hover:underline'
          >
            {t('watchReplay')}
          </Link>
        </>
      }
      actions={actions}
      onUnusable={onUnusable}
    />
  );
}
