import { type AnnotationColorToken, type ChartAnnotation } from '@/entities/annotation.entities';

export type ThemeMode = 'light' | 'dark';

export const ANNOTATION_BADGE_WIDTH = 28;
export const ANNOTATION_PILL_TEXT = {
  font: '500 11px Inter, system-ui, -apple-system, sans-serif',
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  fontSize: 11,
  fontWeight: 500,
} as const;
const ANNOTATION_MIN_BASE_WIDTH = 44;
const ANNOTATION_TEXT_PADDING = 16;
const MIN_CHART_WIDTH = 320;
const GROUP_SPACING_BUFFER_PX = 8;

export type MeasureTextWidth = (text: string) => number;

export const ANNOTATION_COLOR_MAP: Record<AnnotationColorToken, { light: string; dark: string }> = {
  slate: { light: '#64748b', dark: '#94a3b8' },
  primary: { light: '#4766E5', dark: '#93b4ff' },
  amber: { light: '#f59e0b', dark: '#fbbf24' },
  emerald: { light: '#10b981', dark: '#34d399' },
  red: { light: '#ef4444', dark: '#f87171' },
  violet: { light: '#8b5cf6', dark: '#a78bfa' },
  cyan: { light: '#06b6d4', dark: '#22d3ee' },
  orange: { light: '#f97316', dark: '#fb923c' },
  green: { light: '#22c55e', dark: '#4ade80' },
  teal: { light: '#14b8a6', dark: '#2dd4bf' },
};

export const DEFAULT_ANNOTATION_COLOR_TOKEN: AnnotationColorToken = 'slate';
export const DEFAULT_ANNOTATION_COLOR = ANNOTATION_COLOR_MAP[DEFAULT_ANNOTATION_COLOR_TOKEN].light;

export function resolveAnnotationColor(
  token: AnnotationColorToken | undefined,
  mode: ThemeMode = 'light',
): string {
  const map = token ? ANNOTATION_COLOR_MAP[token] : ANNOTATION_COLOR_MAP[DEFAULT_ANNOTATION_COLOR_TOKEN];
  return map[mode];
}

export interface AnnotationGroup {
  bucketDate: number;
  dataValue: number;
  annotations: ChartAnnotation[];
  tier: number; // Tier for vertical staggering to avoid horizontal overlap
}

interface ChartDataPoint {
  date: string | number;
  value: Array<number | null>;
}

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

export function getAnnotationPillWidth(
  label: string,
  extraCount: number,
  measureTextWidth?: MeasureTextWidth,
): number {
  const measuredTextWidth = measureTextWidth ? measureTextWidth(label) : label.length * 6.5;
  const baseWidth = Math.max(measuredTextWidth + ANNOTATION_TEXT_PADDING, ANNOTATION_MIN_BASE_WIDTH);
  const badgeWidth = extraCount > 0 ? ANNOTATION_BADGE_WIDTH : 0;
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
  measureTextWidth?: MeasureTextWidth,
): AnnotationGroup[] {
  if (groups.length === 0) return [];

  const dates = groups.map((g) => g.bucketDate);
  const minDate = domainMin ?? Math.min(...dates);
  const maxDate = domainMax ?? Math.max(...dates);
  const dateRange = Math.max(maxDate - minDate, 1);

  const tierRightEdgesPx: number[] = [];
  const safeChartWidth = Math.max(chartWidth, MIN_CHART_WIDTH);
  const sorted = [...groups].sort((a, b) => a.bucketDate - b.bucketDate);

  return sorted.map((group) => {
    const positionPx = ((group.bucketDate - minDate) / dateRange) * safeChartWidth;
    const label = getGroupLabel(group.annotations);
    const extraCount = group.annotations.length - 1;

    const pillWidthPx = getAnnotationPillWidth(label, extraCount, measureTextWidth);
    const halfWidthPx = pillWidthPx / 2;

    const leftEdgePx = positionPx - halfWidthPx - GROUP_SPACING_BUFFER_PX;
    const rightEdgePx = positionPx + halfWidthPx + GROUP_SPACING_BUFFER_PX;

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
  measureTextWidth?: MeasureTextWidth,
): AnnotationGroup[] {
  if (annotations.length === 0 || chartData.length === 0) return [];

  const bucketValues = new Map<number, number | null>();
  const sortedBuckets: number[] = [];

  for (const d of chartData) {
    const timestamp = typeof d.date === 'number' ? d.date : new Date(d.date).getTime();
    bucketValues.set(timestamp, d.value?.[0] ?? null);
    sortedBuckets.push(timestamp);
  }
  sortedBuckets.sort((a, b) => a - b);

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
  // this is important to ensure that annotations overlap correctly
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

  return calculateGroupTiers(groups, chartWidth, domainMin, domainMax, measureTextWidth);
}
