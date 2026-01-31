export const DEFAULT_TOTAL_ANGLE = 240;
export const START_OFFSET = (DEFAULT_TOTAL_ANGLE - 180) / 2;

/** Width of needle at the center pivot point (px) */
export const NEEDLE_BASE_WIDTH = 4;
/** Width of needle at the tip for fine pointer effect (px) */
export const NEEDLE_TIP_WIDTH = 1;
/** Offset subtracted from strokeWidth before applying multiplier for inner arc */
export const INNER_STROKE_OFFSET = 2;
/** Multiplier for inner arc stroke width relative to outer */
export const INNER_STROKE_MULTIPLIER = 3;

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
