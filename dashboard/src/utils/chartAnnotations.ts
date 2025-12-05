import { type ChartAnnotation } from '@/components/charts/AnnotationMarker';

export interface AnnotationWithTier extends ChartAnnotation {
  dataValue: number;
  tier: number;
}

interface ChartDataPoint {
  date: string | number;
  value: Array<number | null>;
}

/**
 * Finds the chart bucket that contains the given timestamp.
 * Buckets are timezone-aware, so we find which interval contains the timestamp
 * rather than flooring to a fixed duration.
 */
function findContainingBucket(timestamp: number, sortedBuckets: number[]): number | null {
  if (sortedBuckets.length === 0 || timestamp < sortedBuckets[0]) return null;

  const defaultBucketDuration = 24 * 60 * 60 * 1000;
  const bucketDuration = sortedBuckets.length >= 2 ? sortedBuckets[1] - sortedBuckets[0] : defaultBucketDuration;

  for (let i = 0; i < sortedBuckets.length; i++) {
    const bucketEnd = sortedBuckets[i + 1] ?? sortedBuckets[i] + bucketDuration;
    if (timestamp >= sortedBuckets[i] && timestamp < bucketEnd) {
      return sortedBuckets[i];
    }
  }

  return null;
}

/**
 * Calculate tiers to prevent overlapping annotation pills.
 * Greedy algorithm: assign each annotation to the lowest tier where it doesn't overlap.
 */
function calculateTiers(annotations: (ChartAnnotation & { dataValue: number })[]): AnnotationWithTier[] {
  if (annotations.length === 0) return [];

  const dates = annotations.map((a) => a.date);
  const minDate = Math.min(...dates);
  const dateRange = Math.max(...dates) - minDate || 1;

  // Track right edge of each tier (as % of chart width)
  const tierRightEdges: number[] = [];

  const sorted = [...annotations].sort((a, b) => a.date - b.date);

  return sorted.map((annotation) => {
    const position = ((annotation.date - minDate) / dateRange) * 100;
    const halfWidth = ((annotation.label.length * 6.5 + 16) / 800) * 50; // pill width estimate
    const leftEdge = position - halfWidth;
    const rightEdge = position + halfWidth;

    // Find first tier with no overlap, or create new tier
    let tier = tierRightEdges.findIndex((edge) => leftEdge >= edge);
    if (tier === -1) tier = tierRightEdges.length;

    tierRightEdges[tier] = rightEdge;

    return { ...annotation, tier };
  });
}

/**
 * Maps annotations to chart buckets and calculates display tiers.
 */
export function mapAnnotationsToBuckets(
  annotations: ChartAnnotation[],
  chartData: ChartDataPoint[],
): AnnotationWithTier[] {
  if (annotations.length === 0 || chartData.length === 0) return [];

  const bucketValues = new Map<number, number | null>();
  const sortedBuckets: number[] = [];

  for (const d of chartData) {
    const ts = typeof d.date === 'number' ? d.date : new Date(d.date).getTime();
    bucketValues.set(ts, d.value?.[0] ?? null);
    sortedBuckets.push(ts);
  }
  sortedBuckets.sort((a, b) => a - b);

  const mapped = annotations
    .map((annotation) => {
      const bucket = findContainingBucket(annotation.date, sortedBuckets);
      if (bucket === null) return null;

      const dataValue = bucketValues.get(bucket);
      if (dataValue === null || dataValue === undefined) return null;

      return { ...annotation, date: bucket, dataValue };
    })
    .filter((a): a is ChartAnnotation & { dataValue: number } => a !== null);

  return calculateTiers(mapped);
}
