import React from "react"

type Segment = {
  percent: number
  color: string
}

type GaugeProps = {
  segments: Segment[]
  progress: number // 0–100
  size?: number
  strokeWidth?: number
  gapDeg?: number
}

const TOTAL_ANGLE = 210
const START_OFFSET = (TOTAL_ANGLE - 180) / 2 // 15° offset on each side

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angle: number
) {
  // Offset so 0° starts at bottom-left (past horizontal)
  const rad = (angle - 180 - START_OFFSET) * Math.PI / 180
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  }
}

function arcPath(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(cx, cy, r, startAngle)
  const end = polarToCartesian(cx, cy, r, endAngle)
  
  // Large arc flag: 1 if arc spans more than 180°, 0 otherwise
  const arcSpan = endAngle - startAngle
  const largeArcFlag = arcSpan > 180 ? 1 : 0

  return `
    M ${start.x} ${start.y}
    A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}
  `
}

function getProgressColor(segments: Segment[], progress: number): string {
  let accumulated = 0
  for (const seg of segments) {
    accumulated += seg.percent
    if (progress <= accumulated) {
      return seg.color
    }
  }
  // If progress exceeds all segments, use last segment color
  return segments[segments.length - 1]?.color ?? '#f39c12'
}

export type { Segment, GaugeProps }

export default function Gauge({
  segments,
  progress,
  size = 300,
  strokeWidth = 16,
  gapDeg = 2,
}: GaugeProps) {
  const center = size / 2
  const radius = center - strokeWidth
  const innerStrokeWidth = (strokeWidth - 2) * 2
  const innerRadius = radius - strokeWidth / 2 - innerStrokeWidth / 2 - 4 // gap between arcs

  let angleCursor = 0
  const progressColor = getProgressColor(segments, progress)

  // Extra height for the arc extending below horizontal
  const extraHeight = Math.sin(START_OFFSET * Math.PI / 180) * radius

  return (
    <svg
      width={size}
      height={size / 2 + strokeWidth + extraHeight}
      viewBox={`0 0 ${size} ${size / 2 + strokeWidth + extraHeight}`}
    >
      {/* Outer segmented arc */}
      {segments.map((seg, i) => {
        const isFirst = i === 0
        const isLast = i === segments.length - 1
        const rawAngle = (seg.percent / 100) * TOTAL_ANGLE
        // Gap only applies between segments, not at outer edges
        const start = angleCursor + (isFirst ? 0 : gapDeg / 2)
        const end = angleCursor + rawAngle - (isLast ? 0 : gapDeg / 2)

        angleCursor += rawAngle

        return (
          <path
            key={i}
            d={arcPath(center, center, radius, start, end)}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
          />
        )
      })}

      {/* Inner background arc (faded) */}
      <path
        d={arcPath(center, center, innerRadius, 0, TOTAL_ANGLE)}
        fill="none"
        stroke="currentColor"
        strokeWidth={innerStrokeWidth}
        opacity={0.15}
      />

      {/* Progress arc - only render if progress > 0 */}
      {progress > 0 && (
        <path
          d={arcPath(
            center,
            center,
            innerRadius,
            0,
            Math.min(progress, 100) / 100 * TOTAL_ANGLE
          )}
          fill="none"
          stroke={progressColor}
          strokeWidth={innerStrokeWidth}
        />
      )}

      {/* Center text */}
      <text
        x={center}
        y={center - 10}
        textAnchor="middle"
        fontSize="22"
        fill="currentColor"
      >
        {Number.isInteger(progress) ? progress : progress.toFixed(2)}%
      </text>
    </svg>
  )
}
