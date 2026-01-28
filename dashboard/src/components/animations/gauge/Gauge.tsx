import React from 'react';
import { NumberRoll } from '@/components/animations';
import { useGauge } from './useGauge';
import type { Segment } from './gauge-utils';
import { cn } from '@/lib/utils';

type GaugeProps = {
  segments: Segment[];
  progress: number; // 0–100
  size?: number;
  strokeWidth?: number;
  gapDeg?: number;
  arcGap?: number;
  widthRatio?: number;
  title?: string;
  withNeedle?: boolean;
};

export type { Segment, GaugeProps };

function Gauge({
  segments,
  progress,
  size = 300,
  strokeWidth = 16,
  gapDeg = 2,
  arcGap = 4,
  widthRatio = 1,
  title,
  withNeedle = false,
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
    pivotRadius,
  } = useGauge({ segments, progress, size, strokeWidth, gapDeg, arcGap, widthRatio });

  return (
    <div
      className={cn('gauge-root relative flex items-center justify-center', withNeedle && 'mb-[10%]')}
      style={{ width: svgWidth, height: viewBoxHeight }}
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

        {withNeedle && (
          <>
            <polygon
              points={needlePoints}
              fill='var(--primary)'
              className='gauge-needle'
              transform={`translate(${center}, ${center}) rotate(${needleAngle})`}
            />
            <circle cx={center} cy={center} r={pivotRadius} fill='var(--primary)' className='gauge-pivot' />
          </>
        )}
      </svg>

      <div
        className={cn(
          'pointer-events-none absolute right-0 left-0 flex flex-col items-center',
          withNeedle ? '-bottom-[10%]' : 'bottom-[20%]',
        )}
      >
        {title && (
          <span className='text-muted-foreground/50 mb-1 text-[10px] font-black tracking-[0.25em] uppercase'>
            {title}
          </span>
        )}
        <div className='text-foreground text-4xl font-bold tracking-tight drop-shadow-sm'>
          <NumberRoll
            value={progress / 100}
            formatOptions={{ style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }}
          />
        </div>
      </div>
    </div>
  );
}

export default React.memo(Gauge);
