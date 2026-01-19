import React from 'react';

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
};

const TOTAL_ANGLE = 225;
const START_OFFSET = (TOTAL_ANGLE - 180) / 2;
const WIDTH_RATIO = 1.15; // Horizontal stretch (wider than tall)

// Round to fixed precision to avoid SSR/client hydration mismatch
const round = (n: number) => Math.round(n * 1000000) / 1000000;

function ellipseToCartesian(cx: number, cy: number, rx: number, ry: number, angle: number) {
  // Offset so 0° starts at bottom-left (past horizontal)
  const rad = ((angle - 180 - START_OFFSET) * Math.PI) / 180;
  return {
    x: round(cx + rx * Math.cos(rad)),
    y: round(cy + ry * Math.sin(rad)),
  };
}

function arcPath(cx: number, cy: number, rx: number, ry: number, startAngle: number, endAngle: number) {
  const start = ellipseToCartesian(cx, cy, rx, ry, startAngle);
  const end = ellipseToCartesian(cx, cy, rx, ry, endAngle);

  // Large arc flag: 1 if arc spans more than 180°, 0 otherwise
  const arcSpan = endAngle - startAngle;
  const largeArcFlag = arcSpan > 180 ? 1 : 0;

  return `
    M ${start.x} ${start.y}
    A ${round(rx)} ${round(ry)} 0 ${largeArcFlag} 1 ${end.x} ${end.y}
  `;
}

function getProgressColor(segments: Segment[], progress: number): string {
  let accumulated = 0;
  for (const seg of segments) {
    accumulated += seg.percent;
    if (progress <= accumulated) {
      return seg.color;
    }
  }
  // If progress exceeds all segments, use last segment color
  return segments[segments.length - 1]?.color ?? '#f39c12';
}

export type { Segment, GaugeProps };

export default function Gauge({ segments, progress, size = 300, strokeWidth = 20, gapDeg = 2 }: GaugeProps) {
  const center = size / 2;
  const ry = center - strokeWidth; // base vertical radius
  const rx = ry * WIDTH_RATIO; // horizontal radius is wider
  const innerStrokeWidth = (strokeWidth - 2) * 3;
  const arcGap = strokeWidth / 2 + innerStrokeWidth / 2 + 4; // gap between arcs
  const innerRy = ry - arcGap;
  const innerRx = rx - arcGap; // same gap in both directions for alignment

  let angleCursor = 0;
  const progressColor = getProgressColor(segments, progress);

  // Extra height for the arc extending below horizontal
  const extraHeight = Math.sin((START_OFFSET * Math.PI) / 180) * ry;
  const totalWidth = rx * 2 + strokeWidth * 2;

  return (
    <svg
      width={totalWidth}
      height={ry + strokeWidth + extraHeight}
      viewBox={`0 0 ${totalWidth} ${ry + strokeWidth + extraHeight}`}
    >
      {/* Outer segmented arc */}
      {segments.map((seg, i) => {
        const isFirst = i === 0;
        const isLast = i === segments.length - 1;
        const rawAngle = (seg.percent / 100) * TOTAL_ANGLE;
        // Gap only applies between segments, not at outer edges
        const start = angleCursor + (isFirst ? 0 : gapDeg / 2);
        const end = angleCursor + rawAngle - (isLast ? 0 : gapDeg / 2);

        angleCursor += rawAngle;

        return (
          <path
            key={i}
            d={arcPath(totalWidth / 2, ry + strokeWidth, rx, ry, start, end)}
            fill='none'
            stroke={seg.color}
            strokeWidth={strokeWidth}
          />
        );
      })}

      {/* Inner background arc (faded) */}
      <path
        d={arcPath(totalWidth / 2, ry + strokeWidth, innerRx, innerRy, 0, TOTAL_ANGLE)}
        fill='none'
        stroke='currentColor'
        strokeWidth={innerStrokeWidth}
        opacity={0.15}
      />

      {/* Progress arc - only render if progress > 0 */}
      {progress > 0 && (
        <path
          d={arcPath(
            totalWidth / 2,
            ry + strokeWidth,
            innerRx,
            innerRy,
            0,
            (Math.min(progress, 100) / 100) * TOTAL_ANGLE,
          )}
          fill='none'
          stroke={progressColor}
          strokeWidth={innerStrokeWidth}
        />
      )}

      {/* Center text */}
      <text x={totalWidth / 2} y={ry + strokeWidth - 10} textAnchor='middle' fontSize='22' fill='currentColor'>
        {Number.isInteger(progress) ? progress : progress.toFixed(2)}%
      </text>
    </svg>
  );
}
