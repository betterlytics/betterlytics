import React from 'react';
import { NumberRoll } from '@/components/animations';

type Segment = {
  percent: number;
  color: string;
};

type GaugeProps = {
  segments: Segment[];
  progress: number; // 0–100
  size?: number;
  strokeWidth?: number;
  gapDeg?: number;
  arcGap?: number; // gap between inner and outer arcs in pixels
  widthRatio?: number; // horizontal stretch ratio (1 = circle, >1 = wider)
  title?: string; // short label shown above the value
};

const TOTAL_ANGLE = 225;
const START_OFFSET = (TOTAL_ANGLE - 180) / 2;

// Round to fixed precision to avoid SSR/client hydration mismatch
const round = (n: number) => Math.round(n * 1000000) / 1000000;

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  // Offset so 0° starts at bottom-left (past horizontal)
  const rad = ((angle - 180 - START_OFFSET) * Math.PI) / 180;
  return {
    x: round(cx + r * Math.cos(rad)),
    y: round(cy + r * Math.sin(rad)),
  };
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);

  const arcSpan = endAngle - startAngle;
  const largeArcFlag = arcSpan > 180 ? 1 : 0;

  return `M ${start.x} ${start.y} A ${round(r)} ${round(r)} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

function getProgressColor(segments: Segment[], progress: number): string {
  let accumulated = 0;
  for (const seg of segments) {
    accumulated += seg.percent;
    if (progress <= accumulated) {
      return seg.color;
    }
  }
  return segments[segments.length - 1]?.color ?? '#f39c12';
}

export type { Segment, GaugeProps };

export default function Gauge({
  segments,
  progress,
  size = 300,
  strokeWidth = 16,
  gapDeg = 2,
  arcGap = 4,
  widthRatio = 1,
  title,
}: GaugeProps) {
  const center = size / 2;
  const radius = center - strokeWidth;
  const innerStrokeWidth = (strokeWidth - 2) * 3;
  const innerRadius = radius - strokeWidth / 2 - innerStrokeWidth / 2 - arcGap;

  let angleCursor = 0;
  const progressColor = getProgressColor(segments, progress);

  const extraHeight = Math.sin((START_OFFSET * Math.PI) / 180) * radius;

  // Calculate path length for animation
  const pathLength = (TOTAL_ANGLE / 360) * 2 * Math.PI * innerRadius;
  const dashOffset = pathLength * (1 - (Math.min(progress, 100) / 100));

  // Stretched dimensions for the container
  // The SVG is wider than the viewBox, which naturally stretches content
  const viewBoxWidth = size;
  const viewBoxHeight = size / 2 + strokeWidth + extraHeight;
  const svgWidth = viewBoxWidth * widthRatio;
  const svgHeight = viewBoxHeight;

  return (
    <div 
      className="gauge-container"
      style={{ 
        position: 'relative', 
        width: svgWidth, 
        height: svgHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {/* SVG Gauge arcs */}
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        preserveAspectRatio="none"
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0,
        }}
      >
        {/* Outer segmented arc */}
        {segments.map((seg, i) => {
          const isFirst = i === 0;
          const isLast = i === segments.length - 1;
          const rawAngle = (seg.percent / 100) * TOTAL_ANGLE;
          const start = angleCursor + (isFirst ? 0 : gapDeg / 2);
          const end = angleCursor + rawAngle - (isLast ? 0 : gapDeg / 2);

          angleCursor += rawAngle;

          return (
            <path
              key={i}
              d={arcPath(center, center, radius, start, end)}
              fill='none'
              stroke={seg.color}
              strokeWidth={strokeWidth}
              style={{ transition: 'stroke 0.3s ease' }}
            />
          );
        })}

        {/* Inner background arc (faded) */}
        <path
          d={arcPath(center, center, innerRadius, 0, TOTAL_ANGLE)}
          fill='none'
          stroke='currentColor'
          strokeWidth={innerStrokeWidth}
          opacity={0.15}
        />

        {/* Progress arc - animate via dasharray for stability */}
        <path
          d={arcPath(center, center, innerRadius, 0, TOTAL_ANGLE)}
          fill='none'
          stroke={progressColor}
          strokeWidth={innerStrokeWidth}
          strokeDasharray={pathLength}
          strokeDashoffset={dashOffset}
          style={{ 
            transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </svg>

      {/* Center content - positioned on top, not stretched */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          // Perfectly align with the geometric center (cx, cy) of the gauge
          marginTop: (center - svgHeight / 2) * 2,
        }}
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
