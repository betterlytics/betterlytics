export const TOTAL_ANGLE = 225;
export const START_OFFSET = (TOTAL_ANGLE - 180) / 2;

export const CWV_COLORS = {
  good: 'var(--cwv-threshold-good)',
  fair: 'var(--cwv-threshold-fair)',
  poor: 'var(--cwv-threshold-poor)',
} as const;

export type Segment = {
  percent: number;
  color: string;
};

export function getProgressColor(segments: Segment[], progress: number): string {
  let accumulated = 0;
  for (const seg of segments) {
    accumulated += seg.percent;
    if (progress <= accumulated) {
      return seg.color;
    }
  }
  return segments.at(-1)?.color ?? CWV_COLORS.fair;
}
