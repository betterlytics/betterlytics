'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { useImmediateTimeRange } from '@/components/TimeRange/hooks/useImmediateTimeRange';
import { getZoomWindow } from '@/utils/chartZoom';

// Shorter drags are clicks, so tooltips and annotation clicks keep working
const DRAG_THRESHOLD_PX = 5;

type ChartLabel = string | number;
type ChartMouseState = { activeLabel?: ChartLabel; chartX?: number } | null;
type Selection = { startLabel: ChartLabel; endLabel: ChartLabel; startX: number; endX: number };

const toMs = (label: ChartLabel) => (typeof label === 'number' ? label : new Date(label).getTime());

const isDrag = (selection: Selection) => Math.abs(selection.endX - selection.startX) >= DRAG_THRESHOLD_PX;

/**
 * Drag across a time series chart to zoom the dashboard range to the selected buckets. Spread `handlers`
 * on the Recharts chart and draw `previewArea` as a ReferenceArea. `points` holds every series' points, so
 * the bucket edges include the incomplete buckets drawn separately.
 */
export function useChartDragZoom(points: ReadonlyArray<{ date: ChartLabel }>, enabled: boolean) {
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
      const { start, end } = getZoomWindow(
        points.map((point) => toMs(point.date)),
        [toMs(startLabel), toMs(endLabel)],
        { start: resolvedMainRange.start.getTime(), endExclusive: resolvedMainRange.end.getTime() + 1000 },
      );
      zoomToRange(new Date(start), new Date(end));
    },
    [points, resolvedMainRange, zoomToRange],
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
