const MIN_ZOOM_MS = 15 * 60 * 1000;

/**
 * The range a chart selection zooms to: from the start of its first bucket to the end of its last, inside the
 * current range and at least 15 minutes long. Bucket starts come from every series on the chart, since the
 * current (incomplete) buckets are drawn as a separate series.
 */
export function getZoomWindow(
  bucketStarts: number[],
  selectedStarts: [number, number],
  range: { start: number; endExclusive: number },
): { start: number; end: number } {
  const buckets = [...new Set(bucketStarts)].sort((a, b) => a - b);
  const first = Math.min(...selectedStarts);
  const last = Math.max(...selectedStarts);
  const nextBucket = buckets.find((bucket) => bucket > last);

  let start = Math.max(first, range.start);
  let end = Math.min(nextBucket ?? range.endExclusive, range.endExclusive);
  if (end - start < MIN_ZOOM_MS) {
    end = start + MIN_ZOOM_MS;
    if (end > range.endExclusive) {
      end = range.endExclusive;
      start = end - MIN_ZOOM_MS;
    }
  }
  return { start, end };
}
