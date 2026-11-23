'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { z } from 'zod';
import { HEATMAP_MAX_PAGE_HEIGHT, type HeatmapClickAnchor } from '@/entities/analytics/clickHeatmap.entities';
import { useResizeObserver } from '@/hooks/use-resize-observer';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { matchesPagePath } from '@/utils/heatmapPagePath';
import { drawHeat } from './heatCanvas';
import { useFrameLoading } from './HeatmapFrame';
import { findInFrame, placeClicks, type FrameElement } from './placeClicks';

// The framed tracker answers right after load; without an answer the page isn't usable here
const PREVIEW_TIMEOUT_MS = 6000;

// A frame that hasn't said where the elements are by then gets every click at its page position
const FIND_TIMEOUT_MS = 2000;

// The most clicked selectors are looked up; capture.js takes no more than this either
const MAX_FIND_SELECTORS = 2000;

const FrameBoxSchema = z
  .tuple([z.number().finite(), z.number().finite(), z.number().finite(), z.number().finite()])
  .transform(([left, top, width, height]) => ({ left, top, width, height }));

const FoundElementsSchema = z.array(
  z.object({
    selector: z.string(),
    elements: z.array(z.object({ box: FrameBoxSchema, area: FrameBoxSchema })),
  }),
);

type LiveHeatmapViewProps = {
  pageUrl: string;
  pagePath: string;
  width: number;
  viewportHeight: number;
  anchors: HeatmapClickAnchor[];
  onUnusable: () => void;
};

/**
 * The live page in a sandboxed frame at the device's width, with the heat drawn over it. The frame
 * is cross-origin, so its tracker looks up the clicked elements and says where they are, and each
 * click is put on its element, as on a capture. A click whose element isn't on the page, or can't
 * be told apart from look-alikes, stays at its page position, which only lines up when the
 * visitor's window was the frame's size. Clicks on fixed parts are left out. The frame has a
 * typical window height for the device and scrolls along with the panel.
 */
export function LiveHeatmapView({ pageUrl, pagePath, width, viewportHeight, anchors, onUnusable }: LiveHeatmapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollQueued = useRef(false);
  const { width: containerWidth } = useResizeObserver(containerRef);
  const [pageHeight, setPageHeight] = useState<number | null>(null);
  const [found, setFound] = useState<ReadonlyMap<string, FrameElement[]> | null>(null);
  const callbacks = useRef({ onUnusable });
  callbacks.current = { onUnusable };
  const frameAnswered = pageHeight !== null;
  const ready = frameAnswered && found !== null;
  useFrameLoading(!ready);

  const pageAnchors = useMemo(() => anchors.filter((anchor) => !anchor.fixed), [anchors]);
  const selectors = useMemo(
    () =>
      [...new Set(pageAnchors.filter((anchor) => !anchor.onPage).map((anchor) => anchor.selector))].slice(
        0,
        MAX_FIND_SELECTORS,
      ),
    [pageAnchors],
  );

  useEffect(() => {
    let answered = false;
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      const data = event.data as { type?: unknown; height?: unknown; path?: unknown; found?: unknown } | null;
      if (data?.type === 'betterlytics:preview-found') {
        const parsed = FoundElementsSchema.safeParse(data.found);
        if (parsed.success) setFound(new Map(parsed.data.map(({ selector, elements }) => [selector, elements])));
        return;
      }
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

  // Asked once the framed tracker is there, and again for the clicks of another period
  useEffect(() => {
    const frame = frameRef.current?.contentWindow;
    if (!frameAnswered || !frame) return;
    frame.postMessage({ type: 'betterlytics:preview-find', selectors }, new URL(pageUrl).origin);
    const timer = setTimeout(() => setFound((current) => current ?? new Map()), FIND_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [frameAnswered, selectors, pageUrl]);

  const height = Math.max(pageHeight ?? 0, viewportHeight);

  const points = useMemo(
    () => (found ? (placeClicks(pageAnchors, findInFrame(found), height, { keepUnplaced: true }).get(null) ?? []) : []),
    [pageAnchors, found, height],
  );

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
        {!ready && (
          <div className='absolute inset-0 flex items-center justify-center'>
            <Spinner size='sm' />
          </div>
        )}
        <div
          className={cn('ring-border relative mx-auto bg-white shadow-xl ring-1', !ready && 'invisible')}
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
