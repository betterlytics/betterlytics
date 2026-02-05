'use client';

import React from 'react';
import { useGauge } from './useGauge';
import GaugeNeedle from './GaugeNeedle';
import { DEFAULT_TOTAL_ANGLE, type GaugeSegment, type GaugeProps as BaseGaugeProps } from './gauge-utils';
import { cn } from '@/lib/utils';

type GaugeProps = BaseGaugeProps & { children?: React.ReactNode };

export type { GaugeSegment as Segment, GaugeProps };

function Gauge({
  segments,
  progress,
  size = 300,
  strokeWidth = 16,
  gapDeg = 2,
  arcGap = 4,
  widthRatio = 1,
  needle,
  totalAngle = DEFAULT_TOTAL_ANGLE,
  children,
  className,
  style,
  ...props
}: GaugeProps) {
  const {
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
  } = useGauge({ segments, progress, size, strokeWidth, gapDeg, arcGap, widthRatio, totalAngle, needle });

  return (
    <div
      {...props}
      className={cn('gauge-root relative flex items-center justify-center', className)}
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
            className='gauge-segment'
          />
        ))}

        <path d={innerArcPath} fill='none' stroke='currentColor' strokeWidth={innerStrokeWidth} opacity={0.15} />

        <path
          d={innerArcPath}
          fill='none'
          stroke={progressColor}
          strokeWidth={innerStrokeWidth}
          className='gauge-progress'
          style={
            {
              '--path-length': pathLength,
              '--dash-offset': dashOffset,
            } as React.CSSProperties
          }
        />

        {needle && <GaugeNeedle center={center} needlePoints={needlePoints} needleAngle={needleAngle} />}
      </svg>

      {children}
    </div>
  );
}

export default React.memo(Gauge);
