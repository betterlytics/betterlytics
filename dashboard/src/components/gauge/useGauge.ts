import { useMemo } from 'react';
import { arcPath } from '@/lib/math-utils';
import {
  getProgressColor,
  type BaseGaugeProps,
} from './gauge-utils';

type UseGaugeOptions = Required<BaseGaugeProps>;

export function useGauge({
  segments,
  progress,
  size,
  strokeWidth,
  gapDeg,
  arcGap,
  widthRatio,
  totalAngle,
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
  };
}
