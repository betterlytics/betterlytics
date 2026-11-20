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
import { drawHeat, maxCountOf } from './heatCanvas';
import { findInDocument, placeClicks } from './placeClicks';
import { snapshotEvents } from './snapshotEvents';

const FONTS_WAIT_MS = 1500;

// The paused player would freeze CSS animations at their first frame, which hides anything that
// fades in. A zero duration jumps entrances to their end state and stops loops, so clicks are
// placed on the settled layout.
const SETTLE_ANIMATIONS =
  '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; }';

// Images still load after the layout width is fitted; a scrollbar appearing then would narrow it
const RESERVE_SCROLLBAR = 'html { scrollbar-gutter: stable !important; }';

type SnapshotHeatmapViewProps = {
  events: eventWithTime[];
  snapshotMs: number;
  viewportWidth: number;
  anchors: HeatmapClickAnchor[];
  onPlaced: (result: { unplaced: number }) => void;
  onUnusable: () => void;
};

/**
 * Draws a page layout from an rrweb full snapshot (scripts blocked by the player's sandbox) and
 * the heat inside its document, so the heat scrolls with the page and with fixed, sticky and
 * scrolling parts of it. Clicks land on their element; clicks whose element can't be found on this
 * layout are counted instead of drawn.
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
        insertStyleRules: [SETTLE_ANIMATIONS, RESERVE_SCROLLBAR],
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
      // The player restores the visitor's scroll; the heatmap opens at the top of the page
      doc.defaultView?.scrollTo(0, 0);
      const placed = placeClicks(anchors, findInDocument(doc), doc.documentElement.scrollHeight);
      drawHeatLayers(doc, placed.layers);
      callbacks.current.onPlaced({ unplaced: placed.unplaced });
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
    <div className='h-full p-4 sm:p-6'>
      <div
        ref={containerRef}
        className='[&_.replayer-wrapper>iframe]:ring-border h-full w-full [&_.replayer-mouse]:!hidden [&_.replayer-wrapper>iframe]:shadow-xl [&_.replayer-wrapper>iframe]:ring-1 [&_.rr-player]:!bg-transparent [&_.rr-player]:!shadow-none [&_.rr-player\_\_frame]:!overflow-visible'
      >
        <div ref={frameRef} className='h-full w-full' />
      </div>
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

// Heat on a fixed, sticky or scrolling part is drawn inside that part, so it stays on its
// element and is cut off with it. The page's layer covers the whole page, so links in the layout
// can't be followed while it still scrolls.
function drawHeatLayers(doc: Document, layers: Map<HTMLElement | null, HeatmapClickPoint[]>) {
  const maxCount = maxCountOf([...layers.values()].flat());
  for (const [host, points] of layers) {
    if (host) host.appendChild(heatLayer(doc, points, host.scrollWidth, host.scrollHeight, maxCount, 'pointer-events:none'));
  }
  const root = doc.documentElement;
  root.appendChild(heatLayer(doc, layers.get(null) ?? [], root.scrollWidth, root.scrollHeight, maxCount, 'cursor:default'));
}

// Covers its host's scroll area, reaching past the top and left edges when an element sits
// there. A canvas shows nothing in the layout's script-free sandbox, so the heat is drawn here
// and shown there as a background. The layout's own styles reach a layer inside it, so every
// property is reset and set as important.
function heatLayer(
  doc: Document,
  points: HeatmapClickPoint[],
  scrollWidth: number,
  scrollHeight: number,
  maxCount: number,
  style: string,
) {
  const left = points.reduce((min, point) => Math.min(min, point.x), 0);
  const top = points.reduce((min, point) => Math.min(min, point.y), 0);
  const width = scrollWidth - left;
  const height = Math.min(Math.max(scrollHeight - top, 1), HEATMAP_MAX_PAGE_HEIGHT);
  const canvas = document.createElement('canvas');
  const shifted = points.map((point) => ({ ...point, x: point.x - left, y: point.y - top }));
  drawHeat(canvas, shifted, width, height, 0, maxCount);

  const layer = doc.createElement('div');
  layer.style.cssText = [
    'all:revert',
    'position:absolute',
    `left:${left}px`,
    `top:${top}px`,
    `width:${width}px`,
    `height:${height}px`,
    'z-index:2147483647',
    `background:url("${canvas.toDataURL('image/png')}") 0 0 / 100% 100% no-repeat`,
    style,
  ]
    .map((declaration) => `${declaration} !important`)
    .join(';');
  return layer;
}
