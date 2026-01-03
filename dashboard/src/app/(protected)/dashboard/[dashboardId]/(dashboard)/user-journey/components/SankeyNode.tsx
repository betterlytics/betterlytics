'use client';

import { useRef } from 'react';
import { formatPercentage, formatString } from '@/utils/formatters';
import { useSvgTextWidth } from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/user-journey/useSvgTextWidth';
import { NodePosition } from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/user-journey/types';
import { COLORS, LAYOUT } from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/user-journey/constants';
import { formatNumber } from '@/utils/formatters';

export interface SankeyNodeProps {
  node: NodePosition;
  isHighlighted: boolean;
  isMuted: boolean;
  onHover: (nodeId: string | null) => void;
  onClick: (nodeId: string) => void;
  totalEntrySessions: number;
}

export function SankeyNode({
  node,
  isHighlighted,
  isMuted,
  onHover,
  onClick,
  totalEntrySessions,
}: SankeyNodeProps) {
  const cardPadding = { x: 7, y: 5 };
  const cardGap = 5;
  const cardHeight = 30;
  const cardRadius = 4;

  const titleRef = useRef<SVGTextElement>(null);
  const countRef = useRef<SVGTextElement>(null);

  // Position label card to the right of the node
  const cardX = node.x + node.width + cardGap;
  const cardY = node.y + node.height / 2 - cardHeight / 2;

  // Percentage of total sessions that reached this node
  const percentageRaw = totalEntrySessions > 0 ? (node.totalTraffic / totalEntrySessions) * 100 : 0;
  const percentageValue = Math.max(0, Math.min(100, percentageRaw));
  const percentageLabel = formatPercentage(percentageValue, 1);

  const titleText = formatString(node.name, 17);
  const countText = `${formatNumber(node.totalTraffic)} (${percentageLabel})`;

  const titleWidth = useSvgTextWidth(titleRef, [titleText], {
    min: 56,
    max: 170,
    padding: cardPadding.x * 2,
  });
  const countWidth = useSvgTextWidth(countRef, [countText, percentageLabel], {
    min: 56,
    max: 170,
    padding: cardPadding.x * 2,
  });
  const cardWidth = Math.max(titleWidth, countWidth);

  // Colors based on state
  const nodeFill = isMuted ? COLORS.node.mutedFill : COLORS.node.fill;
  const nodeStroke = isMuted ? COLORS.node.mutedStroke : COLORS.node.stroke;

  const cardBgClass = isMuted ? COLORS.card.bgMuted : isHighlighted ? COLORS.card.bgHighlight : COLORS.card.bg;

  const cardBorderClass = isMuted
    ? COLORS.card.borderMuted
    : isHighlighted
      ? COLORS.card.borderHighlight
      : COLORS.card.border;

  const titleClass = isMuted ? COLORS.card.textMuted : COLORS.card.text;
  const labelOpacity = isMuted ? 0.5 : 1;

  return (
    <g
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(node.id)}
      className='cursor-pointer'
    >
      {/* Node rectangle */}
      <rect
        x={node.x}
        y={node.y}
        width={node.width}
        height={node.height}
        rx={LAYOUT.nodeRadius}
        ry={LAYOUT.nodeRadius}
        fill={nodeFill}
        stroke={nodeStroke}
        strokeWidth={COLORS.node.strokeWidth}
        className='transition-all duration-200'
      />

      {/* Label card background */}
      <rect
        x={cardX}
        y={cardY}
        width={cardWidth}
        height={cardHeight}
        rx={cardRadius}
        ry={cardRadius}
        strokeWidth={1}
        fill={cardBgClass}
        stroke={cardBorderClass}
        className={`pointer-events-none transition-all duration-200`}
        opacity={labelOpacity}
        filter={isHighlighted ? 'url(#cardGlow)' : undefined}
      />

      {/* Page name */}
      <text
        ref={titleRef}
        x={cardX + cardPadding.x}
        y={cardY + cardPadding.y + 6}
        textAnchor='start'
        dominantBaseline='middle'
        fontSize={9}
        fontWeight={500}
        letterSpacing='-0.01em'
        fill={titleClass}
        className={`pointer-events-none transition-colors duration-200 select-none`}
        opacity={labelOpacity}
      >
        {titleText}
      </text>

      {/* Traffic count */}
      <text
        ref={countRef}
        x={cardX + cardPadding.x}
        y={cardY + cardPadding.y + 18}
        textAnchor='start'
        dominantBaseline='middle'
        fontSize={8}
        fontWeight={700}
        letterSpacing='-0.01em'
        fill={COLORS.card.textMuted}
        className={`pointer-events-none transition-colors duration-200 select-none`}
        opacity={labelOpacity}
      >
        {formatNumber(node.totalTraffic)}
        <tspan fontSize={7} fontWeight={600} dx={2}>
          ({percentageLabel})
        </tspan>
      </text>
    </g>
  );
}
