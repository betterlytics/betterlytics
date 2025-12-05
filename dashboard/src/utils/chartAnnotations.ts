import { type ChartAnnotation } from '@/components/charts/AnnotationMarker';

// Internal type with computed value for positioning
export interface AnnotationWithValue extends ChartAnnotation {
  dataValue: number | null;
}

// Annotation with tier for staggering overlapping markers
export interface AnnotationWithTier extends AnnotationWithValue {
  tier: number;
}

interface ChartDataPoint {
  date: string | number;
  value: Array<number | null>;
}

/**
 * Finds the chart bucket that contains the given timestamp.
 * The buckets are timezone-aware (created in user's timezone), so we can't
 * simply floor the timestamp - we need to find which bucket interval contains it.
 *
 * Returns the bucket timestamp, or null if the annotation is outside all buckets.
 */
export function findContainingBucket(timestamp: number, sortedBuckets: number[]): number | null {
  if (sortedBuckets.length === 0) return null;

  // If before first bucket, no match
  if (timestamp < sortedBuckets[0]) return null;

  // Estimate bucket duration from the gap between first two buckets (or use a day as fallback)
  const bucketDuration = sortedBuckets.length >= 2 ? sortedBuckets[1] - sortedBuckets[0] : 24 * 60 * 60 * 1000; // 1 day fallback

  // Find the bucket where: bucketStart <= timestamp < nextBucketStart
  for (let i = 0; i < sortedBuckets.length; i++) {
    const bucketStart = sortedBuckets[i];
    const nextBucketStart = sortedBuckets[i + 1];

    if (nextBucketStart !== undefined) {
      // Not the last bucket: check if timestamp falls in this interval
      if (timestamp >= bucketStart && timestamp < nextBucketStart) {
        return bucketStart;
      }
    } else {
      // Last bucket: only match if timestamp is within one bucket duration
      // This prevents annotations from the future matching old date ranges
      if (timestamp >= bucketStart && timestamp < bucketStart + bucketDuration) {
        return bucketStart;
      }
    }
  }

  return null;
}

/**
 * Calculate tiers to prevent overlapping annotation pills.
 * Uses a greedy algorithm: for each annotation (sorted by date), find the lowest tier
 * where it doesn't overlap with existing annotations in that tier.
 */
export function calculateAnnotationTiers(
  annotations: AnnotationWithValue[],
  chartData: ChartDataPoint[],
): AnnotationWithTier[] {
  if (annotations.length === 0) return [];

  // Estimate the chart's date range to calculate relative positions
  const dates = chartData.map((d) => (typeof d.date === 'number' ? d.date : new Date(d.date).getTime()));
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  const dateRange = maxDate - minDate || 1;

  // Sort annotations by date
  const sorted = [...annotations].sort((a, b) => a.date - b.date);

  // Track the "right edge" of the last annotation in each tier (as a percentage of chart width)
  const tierRightEdges: number[] = [];

  // Estimate pill width as percentage of chart (assume 800px chart width as reference)
  const estimatePillWidth = (label: string) => {
    const pixelWidth = label.length * 6.5 + 16;
    return (pixelWidth / 800) * 100; // as percentage
  };

  return sorted.map((annotation) => {
    const position = ((annotation.date - minDate) / dateRange) * 100;
    const halfWidth = estimatePillWidth(annotation.label) / 2;
    const leftEdge = position - halfWidth;
    const rightEdge = position + halfWidth;

    // Find the lowest tier where this annotation doesn't overlap
    let tier = 0;
    for (let t = 0; t < tierRightEdges.length; t++) {
      if (leftEdge >= tierRightEdges[t]) {
        tier = t;
        break;
      }
      tier = t + 1;
    }

    // Update the right edge for this tier
    tierRightEdges[tier] = rightEdge;

    return { ...annotation, tier };
  });
}

/**
 * Maps annotations to chart buckets and calculates display tiers.
 * Returns annotations positioned at their containing bucket with tier info for staggering.
 */
export function mapAnnotationsToBuckets(
  annotations: ChartAnnotation[],
  chartData: ChartDataPoint[],
): AnnotationWithTier[] {
  if (!annotations || !chartData || chartData.length === 0) return [];

  // Build a map of bucket timestamps to data points for O(1) lookup
  const dataMap = new Map<number, ChartDataPoint>();
  const sortedBuckets: number[] = [];

  for (const d of chartData) {
    const dataDate = typeof d.date === 'number' ? d.date : new Date(d.date).getTime();
    dataMap.set(dataDate, d);
    sortedBuckets.push(dataDate);
  }

  // Sort buckets for search
  sortedBuckets.sort((a, b) => a - b);

  const withValues: AnnotationWithValue[] = annotations
    .map((annotation) => {
      // Find which chart bucket contains this annotation's timestamp
      const bucketTimestamp = findContainingBucket(annotation.date, sortedBuckets);

      if (bucketTimestamp === null) {
        return null;
      }

      const dataPoint = dataMap.get(bucketTimestamp);

      if (!dataPoint) {
        return null;
      }

      return {
        ...annotation,
        date: bucketTimestamp, // Use the bucket timestamp for chart positioning
        dataValue: dataPoint.value?.[0] ?? null,
      };
    })
    .filter((a): a is AnnotationWithValue => a !== null && a.dataValue !== null);

  return calculateAnnotationTiers(withValues, chartData);
}
