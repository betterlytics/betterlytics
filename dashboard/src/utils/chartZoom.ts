const MIN_ZOOM_MS = 15 * 60 * 1000;

/**
 * The range a chart selection zooms to: from the start of its first bucket to the end of its last, inside the
 * current range and at least 15 minutes long. Bucket ends come from the granularity rather than the chart's
 * points, since the points can skip buckets (the incomplete tail is drawn separately, and not every series
 * is gap filled).
 */
export function getZoomWindow(
  selectedStarts: [number, number],
  range: { start: number; endExclusive: number },
  getBucketEnd: (bucketStart: number) => number,
): { start: number; end: number } {
  const first = Math.min(...selectedStarts);
  const last = Math.max(...selectedStarts);

  let start = Math.max(first, range.start);
  let end = Math.min(getBucketEnd(last), range.endExclusive);
  if (end - start < MIN_ZOOM_MS) {
    end = start + MIN_ZOOM_MS;
    if (end > range.endExclusive) {
      end = range.endExclusive;
      start = end - MIN_ZOOM_MS;
    }
  }
  return { start, end };
}
