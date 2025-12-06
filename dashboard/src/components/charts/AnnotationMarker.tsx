import React from 'react';
import { useTheme } from 'next-themes';
import { resolveAnnotationColor } from '@/utils/chartAnnotations';
import { AnnotationColorToken } from '@/entities/annotation';

export interface ChartAnnotation {
  id: string;
  date: number;
  label: string;
  description?: string;
  colorToken?: AnnotationColorToken;
}

// Internal type with computed value for positioning
interface AnnotationWithValue extends ChartAnnotation {
  dataValue: number | null;
}

// Complete annotation marker: dot on line + dashed line up to pill + pill label
interface AnnotationMarkerProps {
  annotation: AnnotationWithValue;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  onClick?: (annotation: ChartAnnotation) => void;
  cx?: number; // X position of the data point (from ReferenceDot)
  cy?: number; // Y position of the data point (from ReferenceDot)
  tier?: number; // Vertical tier for staggering overlapping annotations (0 = top, 1, 2, ...)
}

const AnnotationMarker: React.FC<AnnotationMarkerProps> = ({
  annotation,
  isHovered,
  onHover,
  onClick,
  cx = 0,
  cy = 0,
  tier = 0,
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const pillColor = resolveAnnotationColor(annotation.colorToken, isDark ? 'dark' : 'light');
  const neutralStroke = '#cbd5e1';
  const pillHeight = 22;
  const pillGap = 2; // Gap between stacked pills
  const pillY = 12 + tier * (pillHeight + pillGap); // Stagger vertically based on tier
  const pillRadius = 11;

  // Approximate text width for pill sizing
  const textWidth = annotation.label.length * 6.5 + 16;

  // Line goes from bottom of pill to the dot on the chart line
  const lineStartY = pillY + pillHeight / 2;
  const lineEndY = cy;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(annotation);
  };

  return (
    <g
      onMouseEnter={() => onHover(annotation.id)}
      onMouseLeave={() => onHover(null)}
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
    >
      {/* Dashed line from pill to data point */}
      <line
        x1={cx}
        y1={lineStartY}
        x2={cx}
        y2={lineEndY}
        stroke={neutralStroke}
        strokeWidth={1}
        strokeDasharray='4 4'
        opacity={0.8}
      />

      {/* Dot on the chart line */}
      <circle
        cx={cx}
        cy={cy}
        r={isHovered ? 6 : 5}
        fill={pillColor}
        stroke='white'
        strokeWidth={2}
        style={{ filter: isHovered ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' : 'none' }}
      />

      {/* Pill background */}
      <rect
        x={cx - textWidth / 2}
        y={pillY - pillHeight / 2}
        width={textWidth}
        height={pillHeight}
        rx={pillRadius}
        ry={pillRadius}
        fill={pillColor}
        opacity={isHovered ? 1 : 0.9}
        stroke={neutralStroke}
        strokeWidth={1}
        style={{ filter: isHovered ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' : 'none' }}
      />

      {/* Label text */}
      <text x={cx} y={pillY + 4} textAnchor='middle' fill='white' fontSize={11} fontWeight={500}>
        {annotation.label}
      </text>

      {/* Expanded tooltip on hover */}
      {isHovered && annotation.description && (
        <g>
          <rect
            x={cx - 90}
            y={pillY + pillHeight / 2 + 8}
            width={180}
            height={32}
            rx={6}
            fill='var(--popover, #1f2937)'
            stroke='var(--border, #374151)'
            strokeWidth={1}
          />
          <text
            x={cx}
            y={pillY + pillHeight / 2 + 28}
            textAnchor='middle'
            fill='var(--popover-foreground, #f3f4f6)'
            fontSize={11}
          >
            {annotation.description}
          </text>
        </g>
      )}
    </g>
  );
};

AnnotationMarker.displayName = 'AnnotationMarker';

export default AnnotationMarker;
