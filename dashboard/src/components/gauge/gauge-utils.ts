export const DEFAULT_TOTAL_ANGLE = 240;
export const START_OFFSET = (DEFAULT_TOTAL_ANGLE - 180) / 2;

/** Offset subtracted from strokeWidth before applying multiplier for inner arc */
export const INNER_STROKE_OFFSET = 2;
/** Multiplier for inner arc stroke width relative to outer */
export const INNER_STROKE_MULTIPLIER = 3;

export type GaugeSegment = {
  percent: number;
  color: string;
};

export type BaseGaugeProps = {
  segments: GaugeSegment[];
  progress: number;
  size?: number;
  strokeWidth?: number;
  gapDeg?: number;
  arcGap?: number;
  widthRatio?: number;
  totalAngle?: number;
};

export type GaugeProps = BaseGaugeProps & React.HTMLAttributes<HTMLDivElement>;

/** The box a gauge is drawn in: the arc's top half, its stroke, and the part of the arc below the centre. */
export function getGaugeBox({
  size,
  strokeWidth,
  totalAngle = DEFAULT_TOTAL_ANGLE,
  widthRatio = 1,
}: {
  size: number;
  strokeWidth: number;
  totalAngle?: number;
  widthRatio?: number;
}) {
  const radius = size / 2 - strokeWidth;
  const startOffset = (totalAngle - 180) / 2;
  const extraHeight = Math.sin((startOffset * Math.PI) / 180) * radius;
  return { width: size * widthRatio, height: size / 2 + strokeWidth + extraHeight };
}

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
