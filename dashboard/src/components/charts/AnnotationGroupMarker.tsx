'use client';

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import {
  ANNOTATION_BADGE_WIDTH,
  getAnnotationPillWidth,
  resolveAnnotationColor,
  type AnnotationGroup,
} from '@/utils/chartAnnotations';
import { type ChartAnnotation } from '@/entities/annotation';

const PILL_HEIGHT = 22;
const PILL_GAP = 2;
const PILL_RADIUS = 11;
const PILL_BACKDROP_PADDING = 1;
const PILL_BASE_Y = 12;
const TOOLTIP_MAX_WIDTH = 240;
const TOOLTIP_PADDING = 10;
const TOOLTIP_LINE_HEIGHT = 16;
const TOOLTIP_CHARS_PER_LINE = 32;
const TOOLTIP_OFFSET_Y = 8;
const BADGE_RECT_WIDTH = 24;
const BADGE_RECT_HEIGHT = 16;
const BADGE_RECT_RADIUS = 8;
const LABEL_FONT_SIZE = 11;
const BADGE_TEXT_FONT_SIZE = 10;
const PILL_TEXT_FONT_WEIGHT = 500;
const BADGE_TEXT_FONT_WEIGHT = 600;
const NEUTRAL_STROKE = '#cbd5e1';

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
  const t = useTranslations('components.annotations.groupMarker');
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
  const pillY = PILL_BASE_Y + tier * (PILL_HEIGHT + PILL_GAP);

  // Calculate pill width
  const labelText = firstAnnotation?.label ?? '';
  const totalWidth = getAnnotationPillWidth(labelText, extraCount);
  const badgeWidth = hasMultiple ? ANNOTATION_BADGE_WIDTH : 0;

  const lineStartY = pillY + PILL_HEIGHT / 2;
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
        stroke={NEUTRAL_STROKE}
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
          x={cx - totalWidth / 2 - PILL_BACKDROP_PADDING}
          y={pillY - PILL_HEIGHT / 2 - PILL_BACKDROP_PADDING}
          width={totalWidth + PILL_BACKDROP_PADDING * 2}
          height={PILL_HEIGHT + PILL_BACKDROP_PADDING * 2}
          rx={PILL_RADIUS + 2}
          ry={PILL_RADIUS + 2}
          fill='var(--background, #0b1221)'
          opacity={1}
        />

        {/* Pill background */}
        <rect
          x={cx - totalWidth / 2}
          y={pillY - PILL_HEIGHT / 2}
          width={totalWidth}
          height={PILL_HEIGHT}
          rx={PILL_RADIUS}
          ry={PILL_RADIUS}
          fill='currentColor'
          fillOpacity={fillOpacity}
          opacity={isHovered ? 1 : 0.9}
          stroke={NEUTRAL_STROKE}
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
          fontSize={LABEL_FONT_SIZE}
          fontWeight={PILL_TEXT_FONT_WEIGHT}
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
              width={BADGE_RECT_WIDTH}
              height={BADGE_RECT_HEIGHT}
              rx={BADGE_RECT_RADIUS}
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
              fontSize={BADGE_TEXT_FONT_SIZE}
              fontWeight={BADGE_TEXT_FONT_WEIGHT}
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
          const lines = Math.max(1, Math.ceil(firstAnnotation.description.length / TOOLTIP_CHARS_PER_LINE));
          const height = lines * TOOLTIP_LINE_HEIGHT + TOOLTIP_PADDING * 2;
          const tooltipX = cx - TOOLTIP_MAX_WIDTH / 2;
          const tooltipY = pillY + PILL_HEIGHT / 2 + TOOLTIP_OFFSET_Y;

          return (
            <g>
              <rect
                x={tooltipX}
                y={tooltipY}
                width={TOOLTIP_MAX_WIDTH}
                height={height}
                rx={8}
                fill='var(--popover, #1f2937)'
                stroke='var(--border, #374151)'
                strokeWidth={1}
              />
              <foreignObject x={tooltipX} y={tooltipY} width={TOOLTIP_MAX_WIDTH} height={height}>
                <div
                  style={{
                    height: '100%',
                    padding: `${TOOLTIP_PADDING}px`,
                    color: 'var(--popover-foreground, #f3f4f6)',
                    fontSize: `${LABEL_FONT_SIZE}px`,
                    lineHeight: `${TOOLTIP_LINE_HEIGHT}px`,
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
            y={pillY + PILL_HEIGHT / 2 + TOOLTIP_OFFSET_Y}
            width={120}
            height={24}
            rx={6}
            fill='var(--popover, #1f2937)'
            stroke='var(--border, #374151)'
            strokeWidth={1}
          />
          <text
            x={cx}
            y={pillY + PILL_HEIGHT / 2 + 24}
            textAnchor='middle'
            fill='var(--popover-foreground, #f3f4f6)'
            fontSize={11}
          >
            {t('clickToSeeAll')}
          </text>
        </g>
      )}
    </g>
  );
};

AnnotationGroupMarker.displayName = 'AnnotationGroupMarker';

export default AnnotationGroupMarker;
