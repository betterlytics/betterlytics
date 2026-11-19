'use client';

import { useEffect, useRef } from 'react';
import rrwebPlayer from 'rrweb-player';
import 'rrweb-player/dist/style.css';
import type { eventWithTime } from '@rrweb/types';
import {
  HEATMAP_MAX_PAGE_HEIGHT,
  type HeatmapClickAnchor,
  type HeatmapClickPoint,
} from '@/entities/analytics/clickHeatmap.entities';
import { useResizeObserver } from '@/hooks/use-resize-observer';
import { useDebounce } from '@/hooks/useDebounce';
import { drawHeat } from './heatCanvas';
import { locateInDocument, placeClicks } from './placeClicks';
import { snapshotEvents } from './snapshotEvents';

const FONTS_WAIT_MS = 1500;

// The paused player would freeze CSS animations at their first frame, which hides anything that
// fades in. A zero duration jumps entrances to their end state and stops loops, so clicks are
// placed on the settled layout.
const SETTLE_ANIMATIONS =
  '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; }';

type SnapshotHeatmapViewProps = {
  events: eventWithTime[];
  snapshotMs: number;
  viewportWidth: number;
  anchors: HeatmapClickAnchor[];
  onPlaced: (result: { unplacedFixed: number }) => void;
  onUnusable: () => void;
};

/**
 * Draws a page layout from an rrweb full snapshot (scripts blocked by the player's sandbox) and
 * the heat inside its document, so the heat scrolls with the page. Clicks land on their
 * element when it is found, otherwise at their page position.
 */
export function SnapshotHeatmapView({
  events,
  snapshotMs,
  viewportWidth,
  anchors,
  onPlaced,
  onUnusable,
}: SnapshotHeatmapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const size = useDebounce(useResizeObserver(containerRef), 200);
  const callbacks = useRef({ onPlaced, onUnusable });
  callbacks.current = { onPlaced, onUnusable };

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || size.width === 0 || size.height === 0) return;
    const slice = snapshotEvents(events, snapshotMs);
    if (!slice) {
      callbacks.current.onUnusable();
      return;
    }

    frame.innerHTML = '';
    const player = new rrwebPlayer({
      target: frame,
      props: {
        events: slice,
        autoPlay: false,
        showController: false,
        width: size.width,
        height: size.height,
        maxScale: 1,
        mouseTail: false,
        skipInactive: false,
        pauseAnimation: false,
        insertStyleRules: [SETTLE_ANIMATIONS],
      },
    });
    // Pausing just past the last event applies all of them; events at the pause time itself wait
    player.goto(slice[slice.length - 1].timestamp - slice[0].timestamp + 1, false);
    const replayer = player.getReplayer();
    replayer.enableInteract();

    let cancelled = false;
    void (async () => {
      await settled(replayer.iframe.contentDocument);
      if (cancelled) return;
      await fitLayoutWidth(replayer.iframe, viewportWidth, () => player.triggerResize());
      const doc = replayer.iframe.contentDocument;
      if (cancelled || !doc?.documentElement) return;
      // Fixed and sticky elements are measured where they sit at the top of the page
      doc.defaultView?.scrollTo(0, 0);
      const placed = placeClicks(anchors, locateInDocument(doc));
      drawHeatLayer(doc, placed.points);
      callbacks.current.onPlaced({ unplacedFixed: placed.unplacedFixed });
    })();

    return () => {
      cancelled = true;
      try {
        player.pause();
      } catch {}
      (player as unknown as { $destroy?: () => void }).$destroy?.();
      frame.innerHTML = '';
    };
  }, [events, snapshotMs, viewportWidth, anchors, size]);

  return (
    <div
      ref={containerRef}
      className='bg-card h-[calc(100vh-18rem)] min-h-96 overflow-hidden rounded-lg border [&_.replayer-mouse]:!hidden [&_.rr-player]:!bg-transparent [&_.rr-player]:!shadow-none'
    >
      <div ref={frameRef} className='h-full w-full' />
    </div>
  );
}

// Layout depends on web fonts; give them a moment, then let the page lay out
async function settled(doc: Document | null) {
  if (!doc) return;
  await Promise.race([doc.fonts?.ready, new Promise((resolve) => setTimeout(resolve, FONTS_WAIT_MS))]);
  await nextLayout();
}

function nextLayout() {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

// The frame is sized to the recorded window with its scrollbar, which the visitor's browser may
// have drawn narrower or not at all. Adding the viewer's own scrollbar on top lays the page out
// at the width the clicks were recorded at.
async function fitLayoutWidth(iframe: HTMLIFrameElement, layoutWidth: number, rescale: () => void) {
  const view = iframe.contentWindow;
  const root = iframe.contentDocument?.documentElement;
  if (!view || !root) return;
  const width = layoutWidth + view.innerWidth - root.clientWidth;
  if (width === view.innerWidth) return;
  iframe.setAttribute('width', String(width));
  rescale();
  await nextLayout();
}

// Covers the whole page, so links in the layout can't be followed while it still scrolls. A
// canvas shows nothing in the layout's script-free sandbox, so the heat is drawn here and
// shown there as an image.
function drawHeatLayer(doc: Document, points: HeatmapClickPoint[]) {
  const root = doc.documentElement;
  const width = root.scrollWidth;
  const height = Math.min(Math.max(root.scrollHeight, 1), HEATMAP_MAX_PAGE_HEIGHT);

  const canvas = document.createElement('canvas');
  drawHeat(canvas, points, width, height, 0);

  const layer = doc.createElement('div');
  layer.style.cssText = `position:absolute;left:0;top:0;width:${width}px;height:${height}px;z-index:2147483647;cursor:default;`;
  const image = doc.createElement('img');
  image.alt = '';
  image.src = canvas.toDataURL('image/png');
  image.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;';
  layer.appendChild(image);
  root.appendChild(layer);
}
