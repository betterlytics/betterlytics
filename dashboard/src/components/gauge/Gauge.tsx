'use client';

import React from 'react';
import { useGauge } from './useGauge';
import { DEFAULT_TOTAL_ANGLE, type GaugeSegment, type GaugeProps as BaseGaugeProps } from './gauge-utils';
import { cn } from '@/lib/utils';

type GaugeProps = BaseGaugeProps & { children?: React.ReactNode };

/** Utilities, not a CSS file: a stylesheet shared with the landing gets merged into the landing's CSS chunk. */
const TRANSITION = 'duration-700 ease-in-out motion-reduce:transition-none';

export type { GaugeSegment as Segment, GaugeProps };

function Gauge({
  segments,
  progress,
  size = 300,
  strokeWidth = 16,
  gapDeg = 2,
  arcGap = 4,
  widthRatio = 1,
  totalAngle = DEFAULT_TOTAL_ANGLE,
  children,
  className,
  style,
  ...props
}: GaugeProps) {
  const {
    innerStrokeWidth,
    progressColor,
    segmentPaths,
    innerArcPath,
    viewBoxHeight,
    svgWidth,
    pathLength,
    dashOffset,
  } = useGauge({ segments, progress, size, strokeWidth, gapDeg, arcGap, widthRatio, totalAngle });

  return (
    <div
      {...props}
      className={cn('relative flex items-center justify-center', className)}
      style={{ ...style, width: svgWidth, height: viewBoxHeight }}
    >
      <svg
        className='absolute top-0 left-0'
        width={svgWidth}
        height={viewBoxHeight}
        viewBox={`0 0 ${size} ${viewBoxHeight}`}
        preserveAspectRatio='none'
      >
        {segmentPaths.map((seg, i) => (
          <path
            key={i}
            d={seg.path}
            fill='none'
            stroke={seg.color}
            strokeWidth={strokeWidth}
            className={cn('transition-[stroke]', TRANSITION)}
          />
        ))}

        <path d={innerArcPath} fill='none' stroke='currentColor' strokeWidth={innerStrokeWidth} opacity={0.15} />

        <path
          d={innerArcPath}
          fill='none'
          stroke={progressColor}
          strokeWidth={innerStrokeWidth}
          className={cn(
            'transition-[stroke-dashoffset,stroke] will-change-[stroke-dashoffset,stroke]',
            TRANSITION,
          )}
          style={{ strokeDasharray: pathLength, strokeDashoffset: dashOffset }}
        />
      </svg>

      {children}
    </div>
  );
}

export default React.memo(Gauge);
