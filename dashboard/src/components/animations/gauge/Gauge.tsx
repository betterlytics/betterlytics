import React from 'react';
import { NumberRoll } from '@/components/animations';
import { useGauge } from './useGauge';
import type { Segment } from './gauge-utils';

type GaugeProps = {
  segments: Segment[];
  progress: number; // 0–100
  size?: number;
  strokeWidth?: number;
  gapDeg?: number;
  arcGap?: number;
  widthRatio?: number;
  title?: string;
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
  } = useGauge({ segments, progress, size, strokeWidth, gapDeg, arcGap, widthRatio });

  return (
    <div
      className="gauge-root relative flex items-center justify-center"
      style={{ width: svgWidth, height: viewBoxHeight }}
    >
      <svg
        className="absolute top-0 left-0"
        width={svgWidth}
        height={viewBoxHeight}
        viewBox={`0 0 ${size} ${viewBoxHeight}`}
        preserveAspectRatio="none"
      >
        {segmentPaths.map((seg, i) => (
          <path
            key={i}
            d={seg.path}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            className="gauge-segment"
          />
        ))}

        <path
          d={innerArcPath}
          fill="none"
          stroke="currentColor"
          strokeWidth={innerStrokeWidth}
          opacity={0.15}
        />

        <path
          d={innerArcPath}
          fill="none"
          stroke={progressColor}
          strokeWidth={innerStrokeWidth}
          className="gauge-progress"
          style={{
            '--path-length': pathLength,
            '--dash-offset': dashOffset,
          } as React.CSSProperties}
        />
      </svg>

      <div
        className="relative flex flex-col items-center justify-center pointer-events-none"
        style={{ marginTop: (center - viewBoxHeight / 2) * 2 }}
      >
        {title && (
          <span className="text-[10px] uppercase tracking-[0.25em] font-black text-muted-foreground/50 mb-1">
            {title}
          </span>
        )}
        <div className="text-4xl font-bold tracking-tight text-foreground drop-shadow-sm">
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
