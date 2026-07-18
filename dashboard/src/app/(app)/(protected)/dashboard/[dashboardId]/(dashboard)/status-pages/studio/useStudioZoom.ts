'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const DEVICE_WIDTH = { desktop: 768, mobile: 390 } as const;
const ZOOM_MIN = 0.4;
const ZOOM_MAX = 1.2;
const ZOOM_STEP = 0.1;
const FIT_PADDING = 96;

export type StudioDevice = keyof typeof DEVICE_WIDTH;

export function useStudioZoom() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [availableWidth, setAvailableWidth] = useState<number | null>(null);
  const [device, setDevice] = useState<StudioDevice>('desktop');
  /** null = fit-to-canvas (recomputes on resize); a number = user-pinned zoom. */
  const [pinnedZoom, setPinnedZoom] = useState<number | null>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      setAvailableWidth(entries[0]?.contentRect.width ?? null);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const fitZoom = useMemo(() => {
    if (availableWidth == null) return null;
    const fit = (availableWidth - FIT_PADDING) / DEVICE_WIDTH[device];
    return Math.min(1, Math.max(ZOOM_MIN, fit));
  }, [availableWidth, device]);

  // Pinch-to-zoom: trackpad pinches arrive as ctrlKey wheel events. Native non-passive
  // listener because React's wheel handlers can't preventDefault the browser page-zoom.
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      // Line-mode deltas (discrete mouse wheels on some browsers) are ~3 per notch vs ~100px.
      const delta = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? event.deltaY * 20 : event.deltaY;
      setPinnedZoom((current) => {
        const base = current ?? fitZoom ?? 1;
        return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, base * Math.exp(-delta * 0.002)));
      });
    };
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, [fitZoom]);

  const zoom = pinnedZoom ?? fitZoom;

  const stepZoom = useCallback(
    (direction: 1 | -1) => {
      setPinnedZoom((current) => {
        const base = current ?? fitZoom ?? 1;
        const gridSteps =
          direction === 1 ? Math.floor(base / ZOOM_STEP + 1e-6) + 1 : Math.ceil(base / ZOOM_STEP - 1e-6) - 1;
        const next = Math.round(gridSteps * ZOOM_STEP * 100) / 100;
        return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, next));
      });
    },
    [fitZoom],
  );

  const switchDevice = useCallback((next: StudioDevice) => {
    setDevice(next);
    setPinnedZoom(null);
  }, []);

  const resetZoom = useCallback(() => setPinnedZoom(null), []);

  const frameStyle = useMemo(
    () => (zoom != null ? { width: Math.round(DEVICE_WIDTH[device] * zoom) } : undefined),
    [device, zoom],
  );

  return { containerRef, device, zoom, frameStyle, stepZoom, switchDevice, resetZoom };
}
