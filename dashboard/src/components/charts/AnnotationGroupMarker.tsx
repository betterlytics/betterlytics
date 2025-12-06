'use client';

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { resolveAnnotationColor, type AnnotationGroup } from '@/utils/chartAnnotations';
import { type ChartAnnotation } from '@/entities/annotation';

interface AnnotationGroupMarkerProps {
  group: AnnotationGroup;
  isHovered: boolean;
  onHover: (bucketDate: number | null) => void;
  onHoverPill?: (bucketDate: number | null) => void;
  onGroupClick: (group: AnnotationGroup, anchorRect: DOMRect) => void;
  onSingleClick: (annotation: ChartAnnotation) => void;
  isAnnotationMode?: boolean;
  cx?: number;
  cy?: number;
}

const AnnotationGroupMarker: React.FC<AnnotationGroupMarkerProps> = ({
  group,
  isHovered,
  onHover,
  onHoverPill,
  onGroupClick,
  onSingleClick,
  isAnnotationMode = false,
  cx = 0,
  cy = 0,
}) => {
  const pillRef = useRef<SVGGElement>(null);
  const animationRef = useRef<number | null>(null);
  const animatedYRef = useRef(cy);
  const [animatedY, setAnimatedY] = useState(cy);

  useEffect(() => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);

    const from = animatedYRef.current;
    const to = cy;
    const delta = to - from;

    if (delta === 0) return;

    const duration = 2000;
    const ease = (t: number) => 1 - (1 - t) ** 3;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const next = from + delta * ease(t);
      animatedYRef.current = next;
      setAnimatedY(next);

      if (t < 1) {
        animationRef.current = requestAnimationFrame(tick);
      } else {
        animatedYRef.current = to;
      }
    };

    animationRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [cy]);

  const { annotations, tier } = group;
  const firstAnnotation = annotations[0];
  const extraCount = annotations.length - 1;
  const hasMultiple = extraCount > 0;

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const primaryColor = resolveAnnotationColor(firstAnnotation.colorToken, isDark ? 'dark' : 'light');
  const fillOpacity = isDark ? 0.75 : 0.95;
  const neutralStroke = '#cbd5e1';
  const pillHeight = 22;
  const pillGap = 2;
  const pillY = 12 + tier * (pillHeight + pillGap);
  const pillRadius = 11;
  const pillBackdropPadding = 1;

  // Calculate pill width
  const labelText = firstAnnotation?.label ?? '';
  const baseTextWidth = labelText.length * 6.5 + 16;
  const badgeWidth = hasMultiple ? 28 : 0;
  const totalWidth = baseTextWidth + badgeWidth;

  const lineStartY = pillY + pillHeight / 2;
  const lineEndY = animatedY;

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

  const handleMouseEnter = () => {
    onHover(group.bucketDate);
    onHoverPill?.(null);
  };

  const handleMouseLeave = () => {
    onHover(null);
    onHoverPill?.(null);
  };

  return (
    <g
      ref={pillRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ color: primaryColor }}
    >
      {/* Dashed line from pill to data point */}
      <line
        x1={cx}
        y1={lineStartY}
        x2={cx}
        y2={lineEndY}
        stroke={neutralStroke}
        strokeWidth={2}
        strokeDasharray='4 4'
        opacity={0.8}
        style={{ pointerEvents: 'none' }}
      />

      {/* Dot on the chart line */}
      <circle
        cx={cx}
        cy={animatedY}
        r={isHovered ? 6 : 5}
        fill='currentColor'
        stroke='white'
        strokeWidth={2}
        style={{
          filter: isHovered ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' : 'none',
          pointerEvents: 'none',
        }}
      />

      <g
        onMouseEnter={() => onHoverPill?.(group.bucketDate)}
        onMouseLeave={() => onHoverPill?.(null)}
        onClick={handleClick}
        style={{ pointerEvents: 'auto', cursor: 'pointer' }}
      >
        {/* Backdrop to keep other lines from showing through the pill */}
        <rect
          x={cx - totalWidth / 2 - pillBackdropPadding}
          y={pillY - pillHeight / 2 - pillBackdropPadding}
          width={totalWidth + pillBackdropPadding * 2}
          height={pillHeight + pillBackdropPadding * 2}
          rx={pillRadius + 2}
          ry={pillRadius + 2}
          fill='var(--background, #0b1221)'
          opacity={1}
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
          fillOpacity={fillOpacity}
          opacity={isHovered ? 1 : 0.9}
          stroke={neutralStroke}
          strokeWidth={0.75}
          strokeOpacity={0.9}
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
              stroke='rgba(255,255,255,0.35)'
              strokeWidth={0.5}
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
      </g>

      {/* Hover tooltip for single annotation with description */}
      {isHovered &&
        !isAnnotationMode &&
        !hasMultiple &&
        firstAnnotation.description &&
        (() => {
          const maxWidth = 240;
          const padding = 10;
          const lineHeight = 16;
          const charsPerLine = 32;
          const lines = Math.max(1, Math.ceil(firstAnnotation.description.length / charsPerLine));
          const height = lines * lineHeight + padding * 2;
          const tooltipX = cx - maxWidth / 2;
          const tooltipY = pillY + pillHeight / 2 + 8;

          return (
            <g>
              <rect
                x={tooltipX}
                y={tooltipY}
                width={maxWidth}
                height={height}
                rx={8}
                fill='var(--popover, #1f2937)'
                stroke='var(--border, #374151)'
                strokeWidth={1}
              />
              <foreignObject x={tooltipX} y={tooltipY} width={maxWidth} height={height}>
                <div
                  style={{
                    height: '100%',
                    padding: `${padding}px`,
                    color: 'var(--popover-foreground, #f3f4f6)',
                    fontSize: '11px',
                    lineHeight: `${lineHeight}px`,
                    textAlign: 'left',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {firstAnnotation.description}
                </div>
              </foreignObject>
            </g>
          );
        })()}

      {/* Hover hint for multiple annotations */}
      {isHovered && !isAnnotationMode && hasMultiple && (
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
