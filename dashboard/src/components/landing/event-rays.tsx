'use client';

import { useId, useRef } from 'react';
import { useMotionValueEvent, type MotionValue } from 'motion/react';
import { useHeroBackground } from './background-context';

// Mirror globe-background.tsx coordinate system
const CX = 400;
const CY = 400;
const R = 400;
const MERIDIAN_RX = [400, 328.7, 235.36, 123.1, 0];
const LATITUDE_YS = [80, 160, 240, 320, 400];
const RAY_EXTEND_Y = 700;
const ARC_SAMPLES = 32;
const TAIL_LENGTH = 240;

// --- Grid helpers (same logic as globe-background.tsx) ---

interface GridPt {
  readonly x: number;
  readonly y: number;
  readonly rx: number;
  readonly side: 'left' | 'right';
}

function gp(rx: number, y: number, side: 'left' | 'right'): GridPt {
  if (rx === 0) return { x: CX, y, rx: 0, side };
  const dy = (y - CY) / R;
  const sign = side === 'right' ? 1 : -1;
  const x = CX + sign * rx * Math.sqrt(Math.max(0, 1 - dy * dy));
  return { x: Math.round(x * 100) / 100, y, rx, side };
}

// --- Route path builder ---

function buildRoutePath(waypoints: ReadonlyArray<GridPt>): string {
  let d = `M ${waypoints[0].x},${waypoints[0].y}`;

  for (let i = 1; i < waypoints.length; i++) {
    const from = waypoints[i - 1];
    const to = waypoints[i];

    if (from.y === to.y) {
      d += ` L ${to.x},${to.y}`;
    } else {
      const rx = to.rx !== 0 ? to.rx : from.rx;
      if (rx === 0) {
        d += ` L ${to.x},${to.y}`;
      } else {
        const goingDown = to.y > from.y;
        const sweep = (to.side === 'right') === goingDown ? 1 : 0;
        d += ` A ${rx} ${R} 0 0 ${sweep} ${to.x},${to.y}`;
      }
    }
  }

  const last = waypoints[waypoints.length - 1];
  if (last.rx === 0) {
    d += ` L ${CX},${RAY_EXTEND_Y}`;
  } else {
    const endPt = gp(last.rx, RAY_EXTEND_Y, last.side);
    const sweep = last.side === 'right' ? 1 : 0;
    d += ` A ${last.rx} ${R} 0 0 ${sweep} ${endPt.x},${endPt.y}`;
  }
  return d;
}

// --- Route definitions ---

const TOP = gp(0, 0, 'right');

function meridianRoute(rx: number, side: 'left' | 'right'): ReadonlyArray<GridPt> {
  return [
    TOP,
    gp(rx, 80, side),
    gp(rx, 160, side),
    gp(rx, 240, side),
    gp(rx, 320, side),
    gp(rx, 400, side),
    gp(rx, 500, side),
    gp(rx, 600, side),
  ];
}

const EVENT_ROUTES: ReadonlyArray<ReadonlyArray<GridPt>> = [
  meridianRoute(0, 'right'),
  meridianRoute(123.1, 'right'),
  meridianRoute(123.1, 'left'),
  meridianRoute(235.36, 'right'),
  meridianRoute(235.36, 'left'),
  meridianRoute(328.7, 'right'),
  meridianRoute(328.7, 'left'),
  // Edge — straight down the rim, no horizontal detour
  meridianRoute(400, 'right'),
  meridianRoute(400, 'left'),
];

const ROUTE_PATHS = EVENT_ROUTES.map((waypoints) => buildRoutePath(waypoints));

// --- Filled wireframe (subtle residual glow after pulse passes) ---

function buildGlobeMeridian(rx: number, side: 'left' | 'right'): string {
  if (rx === 0) return `M ${CX},0 L ${CX},600`;
  const midPt = gp(rx, 320, side);
  const endPt = gp(rx, 600, side);
  const sweepFromPole = side === 'right' ? 1 : 0;
  const sweepNormal = side === 'right' ? 0 : 1;
  return `M ${CX},0 A ${rx} ${R} 0 0 ${sweepFromPole} ${midPt.x},${midPt.y} A ${rx} ${R} 0 0 ${sweepNormal} ${endPt.x},${endPt.y}`;
}

const FILLED_MERIDIANS = MERIDIAN_RX.flatMap((rx) => {
  if (rx === 0) return [buildGlobeMeridian(0, 'right')];
  return [buildGlobeMeridian(rx, 'left'), buildGlobeMeridian(rx, 'right')];
});

const FILLED_LATITUDES = LATITUDE_YS.map((y) => {
  const dy = Math.abs(y - CY);
  const hw = Math.sqrt(R * R - dy * dy);
  const x1 = Math.round((CX - hw) * 1000) / 1000;
  return `M ${x1},${y} h ${Math.round(hw * 2 * 1000) / 1000}`;
});

// --- Component ---

interface EventRaysOverlayProps {
  readonly progress: MotionValue<number>;
}

export function EventRaysOverlay({ progress }: EventRaysOverlayProps) {
  const { heroMode } = useHeroBackground();
  const uid = useId().replace(/:/g, '');
  const clipRectRef = useRef<SVGRectElement>(null);
  const coreGradRef = useRef<SVGLinearGradientElement>(null);
  const glowGradRef = useRef<SVGLinearGradientElement>(null);

  useMotionValueEvent(progress, 'change', (v) => {
    // Complete ray animation over first 80% of scroll progress
    const t = Math.max(0, Math.min(1, v / 0.8));
    const headY = t * RAY_EXTEND_Y;
    const tailY = headY - TAIL_LENGTH;

    // Clip rect — reveals the filled wireframe from top
    if (clipRectRef.current) {
      clipRectRef.current.setAttribute('height', String(Math.round(headY + 10)));
    }

    // Move both gradients so the bright head tracks scroll position
    if (coreGradRef.current) {
      coreGradRef.current.setAttribute('y1', String(Math.round(tailY)));
      coreGradRef.current.setAttribute('y2', String(Math.round(headY + 2)));
    }
    if (glowGradRef.current) {
      glowGradRef.current.setAttribute('y1', String(Math.round(tailY - 40)));
      glowGradRef.current.setAttribute('y2', String(Math.round(headY + 2)));
    }
  });

  if (heroMode !== 'event-rays') return null;

  const stopColor = 'var(--globe-data-path)';

  return (
    <div className='pointer-events-none absolute inset-0 -bottom-[55vh] -z-[5] flex items-end justify-center'>
      <svg
        viewBox='-1 -1 802 322'
        width='100%'
        height='100%'
        aria-hidden='true'
        className='max-w-5xl'
        style={{ overflow: 'visible' }}
      >
        <defs>
          <clipPath id={`ray-clip-${uid}`}>
            <rect ref={clipRectRef} x='-10' y='-2' width='820' height='20' />
          </clipPath>

          {/* Core gradient — peaks at full opacity to match existing data paths (strokeWidth 2) */}
          <linearGradient
            ref={coreGradRef}
            id={`ray-core-${uid}`}
            gradientUnits='userSpaceOnUse'
            x1='0'
            y1={`${-TAIL_LENGTH}`}
            x2='0'
            y2='2'
          >
            <stop offset='0%' style={{ stopColor, stopOpacity: 0 }} />
            <stop offset='50%' style={{ stopColor, stopOpacity: 0.05 }} />
            <stop offset='85%' style={{ stopColor, stopOpacity: 0.4 }} />
            <stop offset='97%' style={{ stopColor, stopOpacity: 1 }} />
            <stop offset='100%' style={{ stopColor, stopOpacity: 0 }} />
          </linearGradient>

          {/* Glow gradient — peaks at 0.22 opacity to match existing data path glow (strokeWidth 6) */}
          <linearGradient
            ref={glowGradRef}
            id={`ray-glow-${uid}`}
            gradientUnits='userSpaceOnUse'
            x1='0'
            y1={`${-TAIL_LENGTH - 40}`}
            x2='0'
            y2='2'
          >
            <stop offset='0%' style={{ stopColor, stopOpacity: 0 }} />
            <stop offset='60%' style={{ stopColor, stopOpacity: 0.01 }} />
            <stop offset='90%' style={{ stopColor, stopOpacity: 0.08 }} />
            <stop offset='98%' style={{ stopColor, stopOpacity: 0.22 }} />
            <stop offset='100%' style={{ stopColor, stopOpacity: 0 }} />
          </linearGradient>
        </defs>

        {/* Filled wireframe — clipped, very subtle */}
        <g clipPath={`url(#ray-clip-${uid})`}>
          {FILLED_LATITUDES.map((d, i) => (
            <path
              key={`lat-${i}`}
              d={d}
              fill='none'
              stroke='var(--globe-data-path)'
              strokeWidth='1'
              strokeOpacity='0.07'
              vectorEffect='non-scaling-stroke'
            />
          ))}
          {FILLED_MERIDIANS.map((d, i) => (
            <path
              key={`mer-${i}`}
              d={d}
              fill='none'
              stroke='var(--globe-data-path)'
              strokeWidth='1'
              strokeOpacity='0.05'
              vectorEffect='non-scaling-stroke'
            />
          ))}
        </g>

        {/* Route paths — gradient stroke creates the smooth comet effect */}
        {ROUTE_PATHS.map((d, i) => (
          <g key={i}>
            <path
              d={d}
              fill='none'
              stroke={`url(#ray-glow-${uid})`}
              strokeWidth='6'
              strokeLinecap='round'
              vectorEffect='non-scaling-stroke'
            />
            <path
              d={d}
              fill='none'
              stroke={`url(#ray-core-${uid})`}
              strokeWidth='2'
              strokeLinecap='round'
              vectorEffect='non-scaling-stroke'
            />
          </g>
        ))}
      </svg>
    </div>
  );
}
