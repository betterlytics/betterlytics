'use client';

import { useEffect, useRef, useState } from 'react';
import { HEATMAP_MAX_PAGE_HEIGHT, type HeatmapClickPoint } from '@/entities/analytics/clickHeatmap.entities';
import { useResizeObserver } from '@/hooks/use-resize-observer';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { matchesPagePath } from '@/utils/heatmapPagePath';
import { drawHeat } from './heatCanvas';

// The framed tracker answers right after load; without an answer the page isn't usable here
const PREVIEW_TIMEOUT_MS = 6000;

type LiveHeatmapViewProps = {
  pageUrl: string;
  pagePath: string;
  width: number;
  viewportHeight: number;
  points: HeatmapClickPoint[];
  onUnusable: () => void;
};

/**
 * The live page in a sandboxed frame at the device's width, with the heat drawn over it by page
 * position. The frame keeps a visitor's window height, so sections sized to the window look as
 * they did to visitors, and scrolls along with the panel. It is cross-origin, so clicks can't be
 * placed on elements here.
 */
export function LiveHeatmapView({ pageUrl, pagePath, width, viewportHeight, points, onUnusable }: LiveHeatmapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollQueued = useRef(false);
  const { width: containerWidth } = useResizeObserver(containerRef);
  const [pageHeight, setPageHeight] = useState<number | null>(null);
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
      setPageHeight(Math.min(Math.max(Math.round(data.height), 1), HEATMAP_MAX_PAGE_HEIGHT));
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

  const height = Math.max(pageHeight ?? 0, viewportHeight);

  useEffect(() => {
    if (canvasRef.current) drawHeat(canvasRef.current, points, width, height);
  }, [points, width, height]);

  const scale = containerWidth > 0 ? Math.min(1, containerWidth / width) : 1;

  // The frame takes no pointer events, so it is scrolled to wherever the panel is
  const handleScroll = () => {
    if (scrollQueued.current) return;
    scrollQueued.current = true;
    requestAnimationFrame(() => {
      scrollQueued.current = false;
      const container = containerRef.current;
      const frame = frameRef.current?.contentWindow;
      if (!container || !frame) return;
      frame.postMessage({ type: 'betterlytics:preview-scroll', y: container.scrollTop / scale }, new URL(pageUrl).origin);
    });
  };

  // Hidden until its tracker answers, so a page that never does (or ends up elsewhere) never shows
  return (
    <div className='h-full p-4 sm:p-6'>
      <div ref={containerRef} onScroll={handleScroll} className='relative h-full overflow-auto'>
        {pageHeight === null && (
          <div className='absolute inset-0 flex items-center justify-center'>
            <Spinner size='sm' />
          </div>
        )}
        <div
          className={cn(
            'ring-border relative mx-auto bg-white shadow-xl ring-1',
            pageHeight === null && 'invisible',
          )}
          style={{ width: width * scale, height: height * scale }}
        >
          <div className='sticky top-0 overflow-hidden' style={{ height: viewportHeight * scale }}>
            <div
              className='origin-top-left'
              style={{ width, height: viewportHeight, transform: `scale(${scale})` }}
            >
              <iframe
                ref={frameRef}
                src={`${pageUrl}#bl-preview`}
                title={pagePath}
                sandbox='allow-scripts allow-same-origin'
                referrerPolicy='no-referrer'
                className='pointer-events-none block border-0 bg-white'
                style={{ width, height: viewportHeight }}
              />
            </div>
          </div>
          <div
            className='pointer-events-none absolute top-0 left-0 origin-top-left'
            style={{ width, height, transform: `scale(${scale})` }}
          >
            <canvas ref={canvasRef} className='absolute inset-0 h-full w-full' />
          </div>
        </div>
      </div>
    </div>
  );
}
