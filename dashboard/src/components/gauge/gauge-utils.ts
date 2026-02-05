export const DEFAULT_TOTAL_ANGLE = 240;
export const START_OFFSET = (DEFAULT_TOTAL_ANGLE - 180) / 2;

/** Default width of needle at the center pivot point (px) */
export const DEFAULT_NEEDLE_BASE_WIDTH = 4;
/** Default width of needle at the tip for fine pointer effect (px) */
export const DEFAULT_NEEDLE_TIP_WIDTH = 1;

export type GaugeNeedleConfig = {
  baseWidth?: number;
  tipWidth?: number;
};
/** Offset subtracted from strokeWidth before applying multiplier for inner arc */
export const INNER_STROKE_OFFSET = 2;
/** Multiplier for inner arc stroke width relative to outer */
export const INNER_STROKE_MULTIPLIER = 3;

export type GaugeSegment = {
  percent: number;
  color: string;
};

export type GaugeProps = {
  segments: GaugeSegment[];
  progress: number;
  size?: number;
  strokeWidth?: number;
  gapDeg?: number;
  arcGap?: number;
  widthRatio?: number;
  totalAngle?: number;
  needle?: boolean | GaugeNeedleConfig;
} & React.HTMLAttributes<HTMLDivElement>;

export function getProgressColor(segments: GaugeSegment[], progress: number): string {
  let accumulated = 0;
  for (const seg of segments) {
    accumulated += seg.percent;
    if (progress <= accumulated) {
      return seg.color;
    }
  }
  return segments.at(-1)?.color ?? 'currentColor';
}
