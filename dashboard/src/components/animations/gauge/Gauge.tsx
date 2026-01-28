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
      className={cn('gauge-root relative flex items-center justify-center')}
      style={{ width: svgWidth, height: viewBoxHeight }}
    >
      <svg
        className='absolute top-0 left-0'
        width={svgWidth}
        height={viewBoxHeight}
        viewBox={`0 0 ${size} ${viewBoxHeight}`}
        preserveAspectRatio='none'
      >
        {/* Gradient and filter definitions for needle */}
        <defs>
          {/* Needle gradient: faded base → ring blue → electric cyan tip */}
          <linearGradient id='needle-gradient' x1='0%' y1='0%' x2='0%' y2='100%'>
            <stop offset='0%' stopColor='var(--primary)' stopOpacity='0.0' />
            <stop offset='40%' stopColor='var(--primary)' stopOpacity='0.5' />
            <stop offset='70%' stopColor='var(--primary)' stopOpacity='1' />
            <stop offset='90%' stopColor='#3ddcff' stopOpacity='1' /> {/* Electric cyan */}
            <stop offset='100%' stopColor='#3ddcff' stopOpacity='1' /> {/* Bright tip */}
          </linearGradient>
          {/* Glow mask: transparent at base, visible at tip */}
          <linearGradient id='glow-mask' x1='0%' y1='0%' x2='0%' y2='100%'>
            <stop offset='0%' stopColor='white' stopOpacity='0' />
            <stop offset='60%' stopColor='white' stopOpacity='0' />
            <stop offset='90%' stopColor='white' stopOpacity='0.8' />
            <stop offset='100%' stopColor='white' stopOpacity='1' />
          </linearGradient>
          <mask id='tip-glow-mask'>
            <rect x='-50%' y='-50%' width='200%' height='200%' fill='url(#glow-mask)' />
          </mask>
          {/* Glow filter for needle tip - electric cyan */}
          <filter id='needle-glow' x='-20%' y='-20%' width='140%' height='140%'>
            <feGaussianBlur in='SourceAlpha' stdDeviation='1' result='blur' />
            <feFlood floodColor='#3ddcff' floodOpacity='0.7' result='color' />
            <feComposite in='color' in2='blur' operator='in' result='glow' />
            <feMerge>
              <feMergeNode in='glow' />
              <feMergeNode in='SourceGraphic' />
            </feMerge>
          </filter>
        </defs>

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
          <polygon
            points={needlePoints}
            fill='url(#needle-gradient)'
            filter='url(#needle-glow)'
            className='gauge-needle'
            transform={`translate(${center}, ${center}) rotate(${needleAngle})`}
          />
        )}
      </svg>

      <div className={cn('pointer-events-none absolute right-0 bottom-[20%] left-0 flex flex-col items-center')}>
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
