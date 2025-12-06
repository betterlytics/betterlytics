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
 * Finds the chart bucket that contains the given timestamp
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

function estimatePillWidth(label: string, extraCount: number): number {
  const minBaseWidth = 44;
  const baseWidth = Math.max(label.length * 6.5 + 16, minBaseWidth);
  const badgeWidth = extraCount > 0 ? 28 : 0;
  return baseWidth + badgeWidth;
}

function getGroupLabel(annotations: ChartAnnotation[]): string {
  return annotations[0]?.label;
}

/**
 * Calculate tiers to prevent overlapping annotation groups.
 * Greedy algorithm: assign each group to the lowest tier where it doesn't overlap.
 * Uses chartWidth and the full chart domain so pills from neighboring buckets don't collide.
 */
function calculateGroupTiers(
  groups: Omit<AnnotationGroup, 'tier'>[],
  chartWidth: number = 800,
  domainMin?: number,
  domainMax?: number,
): AnnotationGroup[] {
  if (groups.length === 0) return [];

  const dates = groups.map((g) => g.bucketDate);
  const minDate = domainMin ?? Math.min(...dates);
  const maxDate = domainMax ?? Math.max(...dates);
  const dateRange = Math.max(maxDate - minDate, 1);

  // Track right edge of each tier in px
  const tierRightEdgesPx: number[] = [];
  const safeChartWidth = Math.max(chartWidth, 320);

  const sorted = [...groups].sort((a, b) => a.bucketDate - b.bucketDate);

  return sorted.map((group) => {
    const positionPx = ((group.bucketDate - minDate) / dateRange) * safeChartWidth;
    const label = getGroupLabel(group.annotations);
    const extraCount = group.annotations.length - 1;

    const pillWidthPx = estimatePillWidth(label, extraCount);
    const halfWidthPx = pillWidthPx / 2;

    const spacingBufferPx = 8;
    const leftEdgePx = positionPx - halfWidthPx - spacingBufferPx;
    const rightEdgePx = positionPx + halfWidthPx + spacingBufferPx;

    // Find first tier with no overlap, or create new tier
    let tier = tierRightEdgesPx.findIndex((edge) => leftEdgePx >= edge);
    if (tier === -1) tier = tierRightEdgesPx.length;

    tierRightEdgesPx[tier] = rightEdgePx;

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
  chartWidth: number = 800,
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

  const domainMin = sortedBuckets[0];
  const domainMax = sortedBuckets[sortedBuckets.length - 1];

  return calculateGroupTiers(groups, chartWidth, domainMin, domainMax);
}
