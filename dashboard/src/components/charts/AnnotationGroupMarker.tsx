'use client';

import React, { useRef, useCallback } from 'react';
import { type AnnotationGroup } from '@/utils/chartAnnotations';
import { type ChartAnnotation } from './AnnotationMarker';

interface AnnotationGroupMarkerProps {
  group: AnnotationGroup;
  isHovered: boolean;
  onHover: (bucketDate: number | null) => void;
  onGroupClick: (group: AnnotationGroup, anchorRect: DOMRect) => void;
  onSingleClick: (annotation: ChartAnnotation) => void;
  cx?: number;
  cy?: number;
}

const AnnotationGroupMarker: React.FC<AnnotationGroupMarkerProps> = ({
  group,
  isHovered,
  onHover,
  onGroupClick,
  onSingleClick,
  cx = 0,
  cy = 0,
}) => {
  const pillRef = useRef<SVGGElement>(null);
  const { annotations, tier } = group;
  const firstAnnotation = annotations[0];
  const extraCount = annotations.length - 1;
  const hasMultiple = extraCount > 0;

  const primaryColor = 'hsl(var(--primary))'; // or #4766E5 ?
  const pillHeight = 22;
  const pillGap = 2;
  const pillY = 12 + tier * (pillHeight + pillGap);
  const pillRadius = 11;

  // Calculate pill width
  const labelText = firstAnnotation?.label ?? '';
  const baseTextWidth = labelText.length * 6.5 + 16;
  const badgeWidth = hasMultiple ? 28 : 0;
  const totalWidth = baseTextWidth + badgeWidth;

  const lineStartY = pillY + pillHeight / 2;
  const lineEndY = cy;

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      if (hasMultiple) {
        // Get the pill's bounding rect for popover positioning
        const pillElement = pillRef.current;
        if (pillElement) {
          const rect = pillElement.getBoundingClientRect();
          onGroupClick(group, rect);
        }
      } else if (firstAnnotation) {
        // Single annotation - open edit dialog directly
        onSingleClick(firstAnnotation);
      }
    },
    [hasMultiple, group, firstAnnotation, onGroupClick, onSingleClick],
  );

  if (!firstAnnotation) return null;

  return (
    <g
      ref={pillRef}
      onMouseEnter={() => onHover(group.bucketDate)}
      onMouseLeave={() => onHover(null)}
      onClick={handleClick}
      style={{ cursor: 'pointer', color: primaryColor }}
    >
      {/* Dashed line from pill to data point */}
      <line
        x1={cx}
        y1={lineStartY}
        x2={cx}
        y2={lineEndY}
        stroke='currentColor'
        strokeWidth={2}
        strokeDasharray='4 4'
        opacity={0.8}
      />

      {/* Dot on the chart line */}
      <circle
        cx={cx}
        cy={cy}
        r={isHovered ? 6 : 5}
        fill='currentColor'
        stroke='white'
        strokeWidth={2}
        style={{ filter: isHovered ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' : 'none' }}
      />

      {/* Pill background */}
      <rect
        x={cx - totalWidth / 2}
        y={pillY - pillHeight / 2}
        width={totalWidth}
        height={pillHeight}
        rx={pillRadius}
        ry={pillRadius}
        fill='currentColor'
        fillOpacity={0.35}
        opacity={isHovered ? 1 : 0.9}
        style={{ filter: isHovered ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' : 'none' }}
      />

      {/* Label text */}
      <text
        x={cx - (hasMultiple ? badgeWidth / 2 : 0)}
        y={pillY + 4}
        textAnchor='middle'
        fill='white'
        fontSize={11}
        fontWeight={500}
      >
        {labelText}
      </text>

      {/* +N badge for multiple annotations */}
      {hasMultiple && (
        <>
          {/* Badge background (slightly darker) */}
          <rect
            x={cx + totalWidth / 2 - badgeWidth - 4}
            y={pillY - 8}
            width={24}
            height={16}
            rx={8}
            fill='rgba(0,0,0,0.25)'
          />
          {/* Badge text */}
          <text
            x={cx + totalWidth / 2 - badgeWidth / 2 - 7}
            y={pillY + 3}
            textAnchor='middle'
            fill='white'
            fontSize={10}
            fontWeight={600}
          >
            +{extraCount}
          </text>
        </>
      )}

      {/* Hover tooltip for single annotation with description */}
      {isHovered && !hasMultiple && firstAnnotation.description && (
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
            {firstAnnotation.description}
          </text>
        </g>
      )}

      {/* Hover hint for multiple annotations */}
      {isHovered && hasMultiple && (
        <g>
          <rect
            x={cx - 60}
            y={pillY + pillHeight / 2 + 8}
            width={120}
            height={24}
            rx={6}
            fill='var(--popover, #1f2937)'
            stroke='var(--border, #374151)'
            strokeWidth={1}
          />
          <text
            x={cx}
            y={pillY + pillHeight / 2 + 24}
            textAnchor='middle'
            fill='var(--popover-foreground, #f3f4f6)'
            fontSize={11}
          >
            Click to see all
          </text>
        </g>
      )}
    </g>
  );
};

AnnotationGroupMarker.displayName = 'AnnotationGroupMarker';

export default AnnotationGroupMarker;
