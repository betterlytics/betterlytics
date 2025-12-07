'use client';

import React, { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import {
  ANNOTATION_BADGE_WIDTH,
  ANNOTATION_PILL_TEXT,
  getAnnotationPillWidth,
  resolveAnnotationColor,
  type AnnotationGroup,
} from '@/utils/chartAnnotations';
import { type ChartAnnotation } from '@/entities/dashboard/annotation.entities';

const PILL = {
  height: 22,
  gap: 2,
  radius: 11,
  backdropPadding: 1,
  baseY: 12,
  textFontWeight: ANNOTATION_PILL_TEXT.fontWeight,
} as const;

const TOOLTIP = {
  maxWidth: 240,
  padding: 10,
  lineHeight: 16,
  charsPerLine: 32,
  offsetY: 8,
} as const;

const BADGE = {
  rectWidth: ANNOTATION_BADGE_WIDTH,
  rectHeight: 16,
  rectRadius: 8,
  textFontSize: 10,
  textFontWeight: 600,
} as const;

const LABEL = { fontSize: ANNOTATION_PILL_TEXT.fontSize, fontFamily: ANNOTATION_PILL_TEXT.fontFamily } as const;

const COLORS = { neutralStroke: '#cbd5e1' } as const;

const cubicEaseOut = (t: number) => 1 - (1 - t) ** 3;

const useAnimatedValue = (target: number, duration = 2000, ease: (t: number) => number = cubicEaseOut) => {
  const [value, setValue] = useState(target);
  const latestValueRef = useRef(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    latestValueRef.current = value;
  }, [value]);

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const from = latestValueRef.current;
    const delta = target - from;
    if (delta === 0) return;

    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const next = from + delta * ease(t);
      setValue(next);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, ease]);

  return value;
};

interface AnnotationGroupMarkerProps {
  group: AnnotationGroup;
  isHovered: boolean;
  onHover: (bucketDate: number | null) => void;
  onHoverPill?: (bucketDate: number | null) => void;
  onGroupClick: (group: AnnotationGroup, anchorRect: DOMRect) => void;
  onSingleClick: (annotation: ChartAnnotation) => void;
  isAnnotationMode?: boolean;
  isDisabled?: boolean;
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
  isDisabled = false,
  cx = 0,
  cy = 0,
}) => {
  const t = useTranslations('components.annotations.groupMarker');
  const pillRef = useRef<SVGGElement>(null);
  const animatedY = useAnimatedValue(cy);

  const { annotations, tier } = group;
  const firstAnnotation = annotations[0];
  const extraCount = annotations.length - 1;
  const hasMultiple = extraCount > 0;

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const primaryColor = resolveAnnotationColor(firstAnnotation.colorToken, isDark ? 'dark' : 'light');
  const fillOpacity = isDark ? 0.75 : 0.95;
  const pillY = useMemo(() => PILL.baseY + tier * (PILL.height + PILL.gap), [tier]);

  // Calculate pill width
  const labelText = firstAnnotation?.label ?? '';
  const totalWidth = useMemo(() => getAnnotationPillWidth(labelText, extraCount), [labelText, extraCount]);
  const badgeWidth = useMemo(() => (hasMultiple ? ANNOTATION_BADGE_WIDTH : 0), [hasMultiple]);

  const lineStartY = useMemo(() => pillY + PILL.height / 2, [pillY]);
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

  const renderDescriptionTooltip = () => {
    if (!isHovered || isAnnotationMode || !firstAnnotation?.description || hasMultiple) return null;

    const lines = Math.max(1, Math.ceil(firstAnnotation.description.length / TOOLTIP.charsPerLine));
    const height = lines * TOOLTIP.lineHeight + TOOLTIP.padding * 2;
    const tooltipX = cx - TOOLTIP.maxWidth / 2;
    const tooltipY = pillY + PILL.height / 2 + TOOLTIP.offsetY;

    return (
      <g>
        <rect
          x={tooltipX}
          y={tooltipY}
          width={TOOLTIP.maxWidth}
          height={height}
          rx={8}
          fill='var(--popover, #1f2937)'
          stroke='var(--border, #374151)'
          strokeWidth={1}
        />
        <foreignObject x={tooltipX} y={tooltipY} width={TOOLTIP.maxWidth} height={height}>
          <div
            style={{
              height: '100%',
              padding: `${TOOLTIP.padding}px`,
              color: 'var(--popover-foreground, #f3f4f6)',
              fontSize: `${LABEL.fontSize}px`,
              fontFamily: LABEL.fontFamily,
              lineHeight: `${TOOLTIP.lineHeight}px`,
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
  };

  const renderBadge = () => {
    if (!hasMultiple) return null;
    return (
      <>
        <rect
          x={cx + totalWidth / 2 - badgeWidth - 4}
          y={pillY - 8}
          width={BADGE.rectWidth}
          height={BADGE.rectHeight}
          rx={BADGE.rectRadius}
          fill='rgba(0,0,0,0.25)'
          stroke='rgba(255,255,255,0.35)'
          strokeWidth={0.5}
        />
        <text
          x={cx + totalWidth / 2 - badgeWidth / 2 - 7}
          y={pillY + 3}
          textAnchor='middle'
          fill='white'
          fontSize={BADGE.textFontSize}
          fontWeight={BADGE.textFontWeight}
        >
          +{extraCount}
        </text>
      </>
    );
  };

  const renderPill = () => (
    <g
      onMouseEnter={() => onHoverPill?.(group.bucketDate)}
      onMouseLeave={() => onHoverPill?.(null)}
      onClick={isDisabled ? undefined : handleClick}
      style={{ pointerEvents: 'auto', cursor: isDisabled ? 'default' : 'pointer' }}
    >
      <rect
        x={cx - totalWidth / 2 - PILL.backdropPadding}
        y={pillY - PILL.height / 2 - PILL.backdropPadding}
        width={totalWidth + PILL.backdropPadding * 2}
        height={PILL.height + PILL.backdropPadding * 2}
        rx={PILL.radius + 2}
        ry={PILL.radius + 2}
        fill='var(--background, #0b1221)'
        opacity={1}
      />

      <rect
        x={cx - totalWidth / 2}
        y={pillY - PILL.height / 2}
        width={totalWidth}
        height={PILL.height}
        rx={PILL.radius}
        ry={PILL.radius}
        fill='currentColor'
        fillOpacity={fillOpacity}
        opacity={isHovered ? 1 : 0.9}
        stroke={COLORS.neutralStroke}
        strokeWidth={0.75}
        strokeOpacity={0.9}
        style={{ filter: isHovered ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' : 'none' }}
      />

      <text
        x={cx - (hasMultiple ? badgeWidth / 2 : 0)}
        y={pillY + 4}
        textAnchor='middle'
        fill='white'
        fontSize={LABEL.fontSize}
        fontWeight={PILL.textFontWeight}
        fontFamily={LABEL.fontFamily}
      >
        {labelText}
      </text>

      {renderBadge()}
    </g>
  );

  const renderMultiHint = () =>
    isHovered && !isAnnotationMode && hasMultiple && !isDisabled ? (
      <g>
        <rect
          x={cx - 60}
          y={pillY + PILL.height / 2 + TOOLTIP.offsetY}
          width={120}
          height={24}
          rx={6}
          fill='var(--popover, #1f2937)'
          stroke='var(--border, #374151)'
          strokeWidth={1}
        />
        <text
          x={cx}
          y={pillY + PILL.height / 2 + 24}
          textAnchor='middle'
          fill='var(--popover-foreground, #f3f4f6)'
          fontSize={11}
        >
          {t('clickToSeeAll')}
        </text>
      </g>
    ) : null;

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
        stroke={COLORS.neutralStroke}
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

      {renderPill()}

      {renderDescriptionTooltip()}

      {renderMultiHint()}
    </g>
  );
};

AnnotationGroupMarker.displayName = 'AnnotationGroupMarker';

export default AnnotationGroupMarker;
