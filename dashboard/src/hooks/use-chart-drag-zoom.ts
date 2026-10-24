'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { useImmediateTimeRange } from '@/components/TimeRange/hooks/useImmediateTimeRange';

// Shorter drags are clicks, so tooltips and annotation clicks keep working
const DRAG_THRESHOLD_PX = 5;
const MIN_ZOOM_MS = 15 * 60 * 1000;

type ChartLabel = string | number;
type ChartMouseState = { activeLabel?: ChartLabel; chartX?: number } | null;
type Selection = { startLabel: ChartLabel; endLabel: ChartLabel; startX: number; endX: number };

const toMs = (label: ChartLabel) => (typeof label === 'number' ? label : new Date(label).getTime());

const isDrag = (selection: Selection) => Math.abs(selection.endX - selection.startX) >= DRAG_THRESHOLD_PX;

/**
 * Drag across a time series chart to zoom the dashboard range to the selected buckets. Spread `handlers`
 * on the Recharts chart and draw `previewArea` as a ReferenceArea.
 */
export function useChartDragZoom(data: ReadonlyArray<{ date: ChartLabel }>, enabled: boolean) {
  const { resolvedMainRange } = useTimeRangeContext();
  const { zoomToRange } = useImmediateTimeRange();
  const [selection, setSelection] = useState<Selection | null>(null);
  const selectionRef = useRef<Selection | null>(null);

  const updateSelection = useCallback((next: Selection | null) => {
    selectionRef.current = next;
    setSelection(next);
  }, []);

  const commit = useCallback(
    ({ startLabel, endLabel }: Selection) => {
      const bucketStarts = data.map((point) => toMs(point.date));
      const first = Math.min(toMs(startLabel), toMs(endLabel));
      const last = Math.max(toMs(startLabel), toMs(endLabel));
      const rangeStart = resolvedMainRange.start.getTime();
      const rangeEnd = resolvedMainRange.end.getTime() + 1000;

      // The selection ends where the bucket after the last selected one starts
      const lastIndex = bucketStarts.indexOf(last);
      const lastBucketEnd =
        lastIndex >= 0 && lastIndex < bucketStarts.length - 1 ? bucketStarts[lastIndex + 1] : rangeEnd;

      let start = Math.max(first, rangeStart);
      let end = Math.min(lastBucketEnd, rangeEnd);
      if (end - start < MIN_ZOOM_MS) {
        end = start + MIN_ZOOM_MS;
        if (end > rangeEnd) {
          end = rangeEnd;
          start = end - MIN_ZOOM_MS;
        }
      }

      zoomToRange(new Date(start), new Date(end));
    },
    [data, resolvedMainRange, zoomToRange],
  );

  const onMouseDown = useCallback(
    (state: ChartMouseState, event?: { button?: number; preventDefault?: () => void }) => {
      // Touch starts arrive here too, without a mouse button
      if (!enabled || event?.button !== 0 || state?.activeLabel === undefined || state.chartX === undefined)
        return;
      // Keeps the drag from selecting text on the page
      event.preventDefault?.();
      updateSelection({
        startLabel: state.activeLabel,
        endLabel: state.activeLabel,
        startX: state.chartX,
        endX: state.chartX,
      });
    },
    [enabled, updateSelection],
  );

  const onMouseMove = useCallback(
    (state: ChartMouseState) => {
      const current = selectionRef.current;
      if (!current || state?.activeLabel === undefined || state.chartX === undefined) return;
      if (current.endLabel === state.activeLabel && current.endX === state.chartX) return;
      updateSelection({ ...current, endLabel: state.activeLabel, endX: state.chartX });
    },
    [updateSelection],
  );

  // Released on the window, so a drag that leaves the chart still ends
  const isSelecting = selection !== null;
  useEffect(() => {
    if (!isSelecting) return;
    const handleMouseUp = () => {
      const current = selectionRef.current;
      updateSelection(null);
      if (current && isDrag(current)) commit(current);
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [isSelecting, commit, updateSelection]);

  useEffect(() => {
    if (!enabled) updateSelection(null);
  }, [enabled, updateSelection]);

  const previewArea =
    selection && isDrag(selection) ? { x1: selection.startLabel, x2: selection.endLabel } : undefined;

  return {
    handlers: enabled ? { onMouseDown, onMouseMove } : {},
    previewArea,
  };
}
