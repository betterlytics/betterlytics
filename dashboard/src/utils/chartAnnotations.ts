import { type ChartAnnotation } from '@/components/charts/AnnotationMarker';

export interface AnnotationGroup {
  /** Bucket timestamp (used as x position) */
  bucketDate: number;
  /** Y value at this bucket (for positioning the dot) */
  dataValue: number;
  /** All annotations in this bucket, sorted by original date */
  annotations: ChartAnnotation[];
  /** Tier for vertical staggering to avoid horizontal overlap */
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
 * Estimate pill width for a group label.
 */
function estimatePillWidth(label: string, extraCount: number): number {
  const baseWidth = label.length * 6.5 + 16;
  // Add width for "+N" badge if there are multiple
  const badgeWidth = extraCount > 0 ? 24 : 0;
  return baseWidth + badgeWidth;
}

/**
 * Get the display label for a group (first annotation's label).
 */
function getGroupLabel(annotations: ChartAnnotation[]): string {
  return annotations[0]?.label ?? '';
}

/**
 * Calculate tiers to prevent overlapping annotation groups.
 * Greedy algorithm: assign each group to the lowest tier where it doesn't overlap.
 */
function calculateGroupTiers(groups: Omit<AnnotationGroup, 'tier'>[]): AnnotationGroup[] {
  if (groups.length === 0) return [];

  const dates = groups.map((g) => g.bucketDate);
  const minDate = Math.min(...dates);
  const dateRange = Math.max(...dates) - minDate || 1;

  // Track right edge of each tier (as % of chart width)
  const tierRightEdges: number[] = [];

  const sorted = [...groups].sort((a, b) => a.bucketDate - b.bucketDate);

  return sorted.map((group) => {
    const position = ((group.bucketDate - minDate) / dateRange) * 100;
    const label = getGroupLabel(group.annotations);
    const extraCount = group.annotations.length - 1;
    const halfWidth = (estimatePillWidth(label, extraCount) / 800) * 50;
    const leftEdge = position - halfWidth;
    const rightEdge = position + halfWidth;

    // Find first tier with no overlap, or create new tier
    let tier = tierRightEdges.findIndex((edge) => leftEdge >= edge);
    if (tier === -1) tier = tierRightEdges.length;

    tierRightEdges[tier] = rightEdge;

    return { ...group, tier };
  });
}

/**
 * Groups annotations by their containing chart bucket and calculates display tiers.
 * Returns annotation groups positioned at their bucket with tier info for staggering.
 */
export function groupAnnotationsByBucket(
  annotations: ChartAnnotation[],
  chartData: ChartDataPoint[],
): AnnotationGroup[] {
  if (annotations.length === 0 || chartData.length === 0) return [];

  const bucketValues = new Map<number, number | null>();
  const sortedBuckets: number[] = [];

  for (const d of chartData) {
    const ts = typeof d.date === 'number' ? d.date : new Date(d.date).getTime();
    bucketValues.set(ts, d.value?.[0] ?? null);
    sortedBuckets.push(ts);
  }
  sortedBuckets.sort((a, b) => a - b);

  // Group annotations by bucket
  const groupMap = new Map<number, ChartAnnotation[]>();

  for (const annotation of annotations) {
    const bucket = findContainingBucket(annotation.date, sortedBuckets);
    if (bucket === null) continue;

    const dataValue = bucketValues.get(bucket);
    if (dataValue === null || dataValue === undefined) continue;

    const existing = groupMap.get(bucket) ?? [];
    existing.push(annotation);
    groupMap.set(bucket, existing);
  }

  // Convert to groups, sorting annotations within each group by date
  const groups: Omit<AnnotationGroup, 'tier'>[] = [];

  for (const [bucketDate, groupAnnotations] of groupMap) {
    const dataValue = bucketValues.get(bucketDate);
    if (dataValue === null || dataValue === undefined) continue;

    groups.push({
      bucketDate,
      dataValue,
      annotations: groupAnnotations.sort((a, b) => a.date - b.date),
    });
  }

  return calculateGroupTiers(groups);
}
