import { useMemo } from 'react';
import { arcPath } from '@/lib/math-utils';
import { TOTAL_ANGLE, START_OFFSET, getProgressColor, type Segment } from './gauge-utils';

type UseGaugeOptions = {
  segments: Segment[];
  progress: number;
  size: number;
  strokeWidth: number;
  gapDeg: number;
  arcGap: number;
  widthRatio: number;
};

export function useGauge({ segments, progress, size, strokeWidth, gapDeg, arcGap, widthRatio }: UseGaugeOptions) {
  const center = size / 2;
  const radius = center - strokeWidth;
  const innerStrokeWidth = (strokeWidth - 2) * 3;
  const innerRadius = radius - strokeWidth / 2 - innerStrokeWidth / 2 - arcGap;

  const progressColor = useMemo(() => getProgressColor(segments, progress), [segments, progress]);

  const segmentPaths = useMemo(() => {
    let cursor = 0;
    return segments.map((seg, i) => {
      const angle = (seg.percent / 100) * TOTAL_ANGLE;
      const start = cursor + (i === 0 ? 0 : gapDeg / 2);
      const end = cursor + angle - (i === segments.length - 1 ? 0 : gapDeg / 2);
      cursor += angle;
      return {
        path: arcPath(center, center, radius, start, end, START_OFFSET),
        color: seg.color,
      };
    });
  }, [segments, center, radius, gapDeg]);

  const innerArcPath = useMemo(
    () => arcPath(center, center, innerRadius, 0, TOTAL_ANGLE, START_OFFSET),
    [center, innerRadius],
  );

  const extraHeight = Math.sin((START_OFFSET * Math.PI) / 180) * radius;
  const viewBoxHeight = size / 2 + strokeWidth + extraHeight;
  const svgWidth = size * widthRatio;

  const pathLength = (TOTAL_ANGLE / 360) * 2 * Math.PI * innerRadius;
  const dashOffset = pathLength * (1 - Math.min(progress, 100) / 100);

  // Needle calculations - simple tapered pointer
  const needleTipRadius = radius - strokeWidth / 2 - arcGap; // Tip reaches inner edge of outer segments
  const needleBaseWidth = 8; // Width at base (center)
  const needleTipWidth = 3; // Width at tip (pointed end)

  // Calculate needle rotation angle (in degrees)
  // Needle starts pointing down (+Y), rotate to match arc position
  // Arc goes counterclockwise from lower-left to lower-right through top
  const needleAngle = 90 - START_OFFSET + (Math.min(progress, 100) / 100) * TOTAL_ANGLE;

  // Needle polygon points - simple tapered pointer from center to arc
  // Starts at center (0,0), extends to tip at needleTipRadius
  const needlePoints = useMemo(() => {
    return [
      `${-needleBaseWidth / 2},0`, // Base left (at center)
      `${-needleTipWidth / 2},${needleTipRadius}`, // Tip left
      `${needleTipWidth / 2},${needleTipRadius}`, // Tip right
      `${needleBaseWidth / 2},0`, // Base right (at center)
    ].join(' ');
  }, [needleTipRadius]);

  // Keep pivotRadius for API compatibility but not rendered
  const pivotRadius = 0;

  return {
    center,
    strokeWidth,
    innerStrokeWidth,
    progressColor,
    segmentPaths,
    innerArcPath,
    viewBoxHeight,
    svgWidth,
    pathLength,
    dashOffset,
    needlePoints,
    needleAngle,
    pivotRadius,
  };
}
