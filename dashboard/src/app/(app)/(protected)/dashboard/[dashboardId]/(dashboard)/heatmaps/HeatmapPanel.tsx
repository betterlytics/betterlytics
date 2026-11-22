'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import type { eventWithTime } from '@rrweb/types';
import { Globe, History, TriangleAlert } from 'lucide-react';
import { trpc } from '@/trpc/client';
import { useBAQueryParams } from '@/trpc/hooks';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { useDashboardAuth } from '@/contexts/DashboardAuthProvider';
import {
  HEATMAP_DEVICE_VIEWPORT_HEIGHTS,
  type HeatmapDevice,
  type HeatmapReplaySnapshot,
} from '@/entities/analytics/clickHeatmap.entities';
import type { HeatmapCapture } from '@/entities/analytics/heatmapCaptures.entities';
import { CaptureButton, CaptureHistoryMenu, useCaptureDetails } from './CaptureActions';
import { CaptureDialog, useCaptureOrigin } from './CaptureDialog';
import { FrameContent, FrameLabel, FrameMenuButton, FrameSpinner, FrameView } from './HeatmapFrame';
import { NoCaptureMessage, SetUpHeatmapsMessage } from './HeatmapsEmptyState';
import { LiveHeatmapView } from './LiveHeatmapView';
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
 * visitor's replay layout, the live page when it allows framing, else a prompt to capture. A site
 * without any heatmap clicks gets the setup prompt instead of anything but a capture. Mounted once
 * per page and device, so a new period keeps showing the current data until new data replaces it.
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
  const { isDemo, hasPermission } = useDashboardAuth();
  const { input, options } = useBAQueryParams();
  const originQuery = useCaptureOrigin(url, hasPermission('canCaptureHeatmaps'));
  const capturesQuery = trpc.heatmapCaptures.list.useQuery(
    { dashboardId, path: url },
    // A capture finished in its own window shows up once the editor is back here
    { enabled: !isDemo, refetchOnWindowFocus: true },
  );
  const backgroundQuery = trpc.clickHeatmap.background.useQuery(
    { ...input, url, device },
    { ...options, enabled: siteHasClicks !== false },
  );
  // Only ever grows, so a background that failed never comes back and the order always ends
  const [unusable, setUnusable] = useState<ReadonlySet<string>>(new Set());
  const [capturing, setCapturing] = useState(false);
  const markUnusable = (key: string) =>
    setUnusable((current) => (current.has(key) ? current : new Set(current).add(key)));

  // The first replay layout stays for as long as the panel is open, so a newer visitor's replay
  // turning up in a refresh doesn't swap the layout; only one that fails is replaced
  const [replay, setReplay] = useState<HeatmapReplaySnapshot>();
  const latestReplay = backgroundQuery.data?.kind === 'replay' ? backgroundQuery.data.snapshot : undefined;
  if (latestReplay && latestReplay !== replay && (!replay || unusable.has(snapshotKey(replay)))) {
    setReplay(latestReplay);
  }

  const pageCaptures = capturesQuery.data ?? [];
  const captures = pageCaptures.filter((item) => item.device === device);
  const capture = captures.find((item) => item.id === selectedCaptureId) ?? captures[0];
  // Public views have no captures (the query stays disabled) and no live page
  const capturesLoading = capturesQuery.isPending && !isDemo;
  const useCapture = capture !== undefined && !unusable.has(`capture/${capture.id}`);
  const useReplay = !useCapture && replay !== undefined && !unusable.has(snapshotKey(replay));
  const wantsLivePage =
    siteHasClicks !== false &&
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
  const captureButton = <CaptureButton onClick={openCapture} />;
  // A capture that failed to load stays reachable, to pick another one or delete it
  const history = !useCapture && capture && (
    <CaptureHistoryMenu
      captures={captures}
      shownCaptureId={capture.id}
      onSelect={onSelectCapture}
      trigger={
        <FrameMenuButton
          icon={<History className='size-3.5' />}
          label={t('capture.history', { count: captures.length })}
        />
      }
    />
  );

  let view: ReactNode;
  let viewKey: string;
  const livePage = livePageQuery.data;
  if (capturesLoading) {
    viewKey = 'loading';
    view = (
      <FrameContent actions={captureButton}>
        <FrameSpinner />
      </FrameContent>
    );
  } else if (useCapture) {
    viewKey = `capture/${capture.id}`;
    view = (
      <CaptureHeatmap
        url={url}
        device={device}
        capture={capture}
        captures={captures}
        onSelectCapture={onSelectCapture}
        onCapture={openCapture}
        onUnusable={() => markUnusable(`capture/${capture.id}`)}
      />
    );
  } else if (siteHasClicks === false) {
    viewKey = 'setup';
    view = (
      <FrameContent info={history} actions={captureButton}>
        <SetUpHeatmapsMessage />
      </FrameContent>
    );
  } else if (
    siteHasClicks === undefined ||
    backgroundQuery.isPending ||
    (wantsLivePage && livePageQuery.isPending)
  ) {
    viewKey = 'loading';
    view = (
      <FrameContent info={history} actions={captureButton}>
        <FrameSpinner />
      </FrameContent>
    );
  } else if (useReplay) {
    const key = snapshotKey(replay);
    viewKey = key;
    view = (
      <ReplayHeatmap
        url={url}
        device={device}
        snapshot={replay}
        history={history}
        actions={captureButton}
        onUnusable={() => markUnusable(key)}
      />
    );
  } else if (livePage && !unusable.has(`live/${livePage}`)) {
    viewKey = `live/${livePage}`;
    view = (
      <LiveHeatmap
        url={url}
        device={device}
        pageUrl={livePage}
        history={history}
        actions={captureButton}
        onUnusable={() => markUnusable(`live/${livePage}`)}
      />
    );
  } else {
    viewKey = 'none';
    view = (
      <FrameContent
        info={
          <>
            {history}
            <FrameLabel icon={<TriangleAlert />} label={t('source.none')} tone='warning' />
          </>
        }
        actions={captureButton}
      >
        <NoCaptureMessage onCapture={openCapture} />
      </FrameContent>
    );
  }

  return (
    <>
      <FrameView viewKey={viewKey} holdable={viewKey === 'none'} loadBehind={!useCapture}>
        {view}
      </FrameView>
      {capturing && (
        <CaptureDialog
          pagePath={url}
          device={device}
          pageCaptures={pageCaptures}
          originQuery={originQuery}
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
  history: ReactNode;
  actions: ReactNode;
  onUnusable: () => void;
};

function LiveHeatmap({ url, device, pageUrl, history, actions, onUnusable }: LiveHeatmapProps) {
  const t = useTranslations('components.heatmaps');
  const { input, options } = useBAQueryParams();
  const clicksQuery = trpc.clickHeatmap.clicks.useQuery({ ...input, url, device }, options);
  const clicks = clicksQuery.data;

  return (
    <FrameContent
      info={
        <>
          {history}
          <FrameLabel icon={<Globe />} label={t('source.live')} hint={t('source.liveHint')} />
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
        <FrameSpinner failed={clicksQuery.isError} />
      )}
    </FrameContent>
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
    <FrameContent info={info} actions={actions}>
      {events && anchorsQuery.data ? (
        <SnapshotHeatmapView
          events={events}
          snapshotMs={snapshotMs}
          device={device}
          viewportWidth={width}
          anchors={anchorsQuery.data}
          onUnusable={onUnusable}
        />
      ) : (
        <FrameSpinner failed={anchorsQuery.isError} />
      )}
    </FrameContent>
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
  const details = useCaptureDetails();
  const href = `/api/heatmap/captures/${encodeURIComponent(capture.id)}?${new URLSearchParams({ dashboardId })}`;
  const events = useSnapshotEvents(['heatmap-capture', dashboardId, capture.id], href, onUnusable);
  const { date } = details(capture);

  return (
    <SnapshotBody
      url={url}
      device={device}
      width={capture.viewportWidth}
      snapshotMs={NaN}
      events={events}
      info={
        <CaptureHistoryMenu
          captures={captures}
          shownCaptureId={capture.id}
          onSelect={onSelectCapture}
          trigger={<FrameMenuButton label={t('source.capture', { date })} />}
        />
      }
      actions={<CaptureButton onClick={onCapture} />}
      onUnusable={onUnusable}
    />
  );
}

type ReplayHeatmapProps = {
  url: string;
  device: HeatmapDevice;
  snapshot: HeatmapReplaySnapshot;
  history: ReactNode;
  actions: ReactNode;
  onUnusable: () => void;
};

function ReplayHeatmap({ snapshot, url, device, history, actions, onUnusable }: ReplayHeatmapProps) {
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
        <>
          {history}
          <FrameLabel label={t('source.replay', { date: recordedOn })} />
        </>
      }
      actions={actions}
      onUnusable={onUnusable}
    />
  );
}
