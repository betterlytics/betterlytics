'use client';

import { useEffect, useRef, useState } from 'react';
import { HEATMAP_MAX_PAGE_HEIGHT, type HeatmapClickPoint } from '@/entities/analytics/clickHeatmap.entities';
import { useResizeObserver } from '@/hooks/use-resize-observer';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { matchesPagePath } from '@/utils/heatmapPagePath';
import { drawHeat } from './heatCanvas';

// The framed tracker answers right after load; without an answer the page isn't usable here
const PREVIEW_TIMEOUT_MS = 6000;
const INITIAL_FRAME_HEIGHT = 900;

type LiveHeatmapViewProps = {
  pageUrl: string;
  pagePath: string;
  width: number;
  points: HeatmapClickPoint[];
  onUnusable: () => void;
};

/**
 * The live page in a sandboxed frame at the device's width, sized to the height its tracker
 * reports, with the heat drawn over it by page position. The frame is cross-origin, so clicks
 * can't be placed on elements here.
 */
export function LiveHeatmapView({ pageUrl, pagePath, width, points, onUnusable }: LiveHeatmapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { width: containerWidth } = useResizeObserver(containerRef);
  const [height, setHeight] = useState<number | null>(null);
  const callbacks = useRef({ onUnusable });
  callbacks.current = { onUnusable };

  useEffect(() => {
    let answered = false;
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      const data = event.data as { type?: unknown; height?: unknown; path?: unknown } | null;
      if (data?.type !== 'betterlytics:preview' || typeof data.height !== 'number') return;
      // A redirect, to a login page say, shows another page than the one the clicks are on
      if (typeof data.path !== 'string' || !matchesPagePath(pagePath, data.path)) {
        callbacks.current.onUnusable();
        return;
      }
      answered = true;
      setHeight(Math.min(Math.max(Math.round(data.height), 1), HEATMAP_MAX_PAGE_HEIGHT));
    };
    window.addEventListener('message', onMessage);
    const timer = setTimeout(() => {
      if (!answered) callbacks.current.onUnusable();
    }, PREVIEW_TIMEOUT_MS);
    return () => {
      window.removeEventListener('message', onMessage);
      clearTimeout(timer);
    };
  }, [pageUrl, pagePath]);

  const frameHeight = height ?? INITIAL_FRAME_HEIGHT;

  useEffect(() => {
    if (canvasRef.current) drawHeat(canvasRef.current, points, width, frameHeight);
  }, [points, width, frameHeight]);

  const scale = containerWidth > 0 ? Math.min(1, containerWidth / width) : 1;

  // Hidden until its tracker answers, so a page that never does (or ends up elsewhere) never shows
  return (
    <div ref={containerRef} className='bg-card relative h-[calc(100vh-18rem)] min-h-96 overflow-auto rounded-lg border'>
      {height === null && <Skeleton className='absolute inset-0 rounded-none' />}
      <div
        className={cn('relative mx-auto', height === null && 'invisible')}
        style={{ width: width * scale, height: frameHeight * scale }}
      >
        <div
          className='absolute top-0 left-0 origin-top-left'
          style={{ width, height: frameHeight, transform: `scale(${scale})` }}
        >
          <iframe
            ref={frameRef}
            src={`${pageUrl}#bl-preview`}
            title={pagePath}
            sandbox='allow-scripts allow-same-origin'
            referrerPolicy='no-referrer'
            className='pointer-events-none absolute inset-0 border-0 bg-white'
            style={{ width, height: frameHeight }}
          />
          <div className='pointer-events-none absolute inset-0 bg-slate-900/30' />
          <canvas ref={canvasRef} className='pointer-events-none absolute inset-0 h-full w-full' />
        </div>
      </div>
    </div>
  );
}
