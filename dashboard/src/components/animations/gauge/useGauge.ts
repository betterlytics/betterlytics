import { useMemo } from 'react';
import { arcPath } from '@/lib/math-utils';
import { TOTAL_ANGLE as DEFAULT_TOTAL_ANGLE, getProgressColor, type Segment } from './gauge-utils';

type UseGaugeOptions = {
  segments: Segment[];
  progress: number;
  size: number;
  strokeWidth: number;
  gapDeg: number;
  arcGap: number;
  widthRatio: number;
  totalAngle?: number;
};

export function useGauge({
  segments,
  progress,
  size,
  strokeWidth,
  gapDeg,
  arcGap,
  widthRatio,
  totalAngle = DEFAULT_TOTAL_ANGLE,
}: UseGaugeOptions) {
  const startOffset = (totalAngle - 180) / 2;
  const center = size / 2;
  const radius = center - strokeWidth;
  const innerStrokeWidth = (strokeWidth - 2) * 3;
  const innerRadius = radius - strokeWidth / 2 - innerStrokeWidth / 2 - arcGap;

  const progressColor = useMemo(() => getProgressColor(segments, progress), [segments, progress]);

  const segmentPaths = useMemo(() => {
    let cursor = 0;
    return segments.map((seg, i) => {
      const angle = (seg.percent / 100) * totalAngle;
      const start = cursor + (i === 0 ? 0 : gapDeg / 2);
      const end = cursor + angle - (i === segments.length - 1 ? 0 : gapDeg / 2);
      cursor += angle;
      return {
        path: arcPath(center, center, radius, start, end, startOffset),
        color: seg.color,
      };
    });
  }, [segments, center, radius, gapDeg, totalAngle, startOffset]);

  const innerArcPath = useMemo(
    () => arcPath(center, center, innerRadius, 0, totalAngle, startOffset),
    [center, innerRadius, totalAngle, startOffset],
  );

  const extraHeight = Math.sin((startOffset * Math.PI) / 180) * radius;
  const viewBoxHeight = size / 2 + strokeWidth + extraHeight;
  const svgWidth = size * widthRatio;

  const pathLength = (totalAngle / 360) * 2 * Math.PI * innerRadius;
  const dashOffset = pathLength * (1 - Math.min(progress, 100) / 100);

  const needleBaseWidth = 4;
  const needleTipWidth = 1;
  const needleTipRadius = radius - strokeWidth / 2 - arcGap;

  // Calculate angular offset to prevent needle tip from overlapping the arc edges
  // Convert tip half-width to degrees at the tip radius
  const tipAngularOffset = Math.atan((needleTipWidth / 2) / needleTipRadius) * (180 / Math.PI);
  const needleAngle =
    90 - startOffset + tipAngularOffset + (Math.min(progress, 100) / 100) * (totalAngle - 2 * tipAngularOffset);

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

  return {
    center,
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
  };
}
