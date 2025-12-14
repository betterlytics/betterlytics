'use client';

import { LinkPosition } from '@/app/(protected)/dashboard/[dashboardId]/user-journey/types';
import { COLORS } from '@/app/(protected)/dashboard/[dashboardId]/user-journey/constants';

export interface SankeyLinkProps {
  link: LinkPosition;
  isHighlighted: boolean;
  isMuted: boolean;
  onHover: (link: LinkPosition | null) => void;
}

export function SankeyLink({ link, isHighlighted, isMuted, onHover }: SankeyLinkProps) {
  // Start and end points
  const x0 = link.source.x + link.source.width;
  const y0 = link.sourceY;
  const x1 = link.target.x;
  const y1 = link.targetY;

  // Curvature
  const curvature = 0.5;
  const cx0 = x0 + (x1 - x0) * curvature;
  const cx1 = x1 - (x1 - x0) * curvature;

  const path = `M ${x0},${y0} C ${cx0},${y0} ${cx1},${y1} ${x1},${y1}`;

  const gradientId = `gradient-${link.source.id}-${link.target.id}`.replace(/\s+/g, '-');

  const start = isMuted
    ? COLORS.link.mutedStroke
    : isHighlighted
      ? COLORS.link.highlightStroke
      : COLORS.link.stroke;
  const mid = isMuted
    ? COLORS.link.mutedStrokeMiddle
    : isHighlighted
      ? COLORS.link.highlightStrokeMiddle
      : COLORS.link.strokeMiddle;

  const end = start; // symmetric

  return (
    <>
      <defs>
        <linearGradient id={gradientId} gradientUnits='userSpaceOnUse' x1={x0} y1={y0} x2={x1} y2={y1}>
          <stop offset='0%' stopColor={start} />
          <stop offset='30%' stopColor={mid} />
          <stop offset='70%' stopColor={mid} />
          <stop offset='100%' stopColor={end} />
        </linearGradient>
      </defs>

      <path
        d={path}
        fill='none'
        stroke={`url(#${gradientId})`}
        strokeWidth={link.width}
        strokeLinecap='butt'
        className='cursor-pointer transition-[stroke-opacity] duration-150'
        onMouseEnter={() => onHover(link)}
        onMouseLeave={() => onHover(null)}
      />
    </>
  );
}
