'use client';

import { useId, useRef } from 'react';
import { useScroll, useMotionValueEvent } from 'motion/react';
import { useHeroBackground } from './background-context';

// Mirror globe-background.tsx coordinate system
const CX = 400;
const CY = 400;
const R = 400;
const MERIDIAN_RX = [400, 328.7, 235.36, 123.1, 0];
const LATITUDE_YS = [80, 160, 240, 320, 400];
const RAY_EXTEND_Y = 1200;
const PULSE_LENGTH = 140;
const ARC_SAMPLES = 32;
const SCROLL_RANGE = 600;

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

function meridianArcLength(rx: number, fromY: number, toY: number): number {
  if (rx === 0) return Math.abs(toY - fromY);
  const fromAngle = Math.asin((fromY - CY) / R);
  const toAngle = Math.asin((toY - CY) / R);
  let length = 0;
  let pX = rx * Math.cos(fromAngle);
  let pY = R * Math.sin(fromAngle);
  for (let i = 1; i <= ARC_SAMPLES; i++) {
    const angle = fromAngle + ((toAngle - fromAngle) * i) / ARC_SAMPLES;
    const x = rx * Math.cos(angle);
    const y = R * Math.sin(angle);
    length += Math.hypot(x - pX, y - pY);
    pX = x;
    pY = y;
  }
  return length;
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
        const sweep = (to.side === 'right') === goingDown ? 0 : 1;
        d += ` A ${rx} ${R} 0 0 ${sweep} ${to.x},${to.y}`;
      }
    }
  }

  // Extend straight below the globe
  const last = waypoints[waypoints.length - 1];
  d += ` L ${last.x},${RAY_EXTEND_Y}`;
  return d;
}

function computeRouteLength(waypoints: ReadonlyArray<GridPt>): number {
  let length = 0;
  for (let i = 1; i < waypoints.length; i++) {
    const from = waypoints[i - 1];
    const to = waypoints[i];
    if (from.y === to.y) {
      length += Math.abs(to.x - from.x);
    } else {
      const rx = to.rx !== 0 ? to.rx : from.rx;
      length += meridianArcLength(rx, from.y, to.y);
    }
  }
  const last = waypoints[waypoints.length - 1];
  length += RAY_EXTEND_Y - last.y;
  return Math.round(length * 100) / 100;
}

// --- Route definitions: top-to-bottom paths along the grid ---

const TOP = gp(0, 0, 'right');

const EVENT_ROUTES: ReadonlyArray<ReadonlyArray<GridPt>> = [
  // Center — straight down
  [TOP, gp(0, 80, 'right'), gp(0, 160, 'right'), gp(0, 240, 'right'), gp(0, 320, 'right')],

  // Inner right — straight down rx=123.1
  [TOP, gp(123.1, 80, 'right'), gp(123.1, 160, 'right'), gp(123.1, 240, 'right'), gp(123.1, 320, 'right')],

  // Inner left — straight down rx=123.1
  [TOP, gp(123.1, 80, 'left'), gp(123.1, 160, 'left'), gp(123.1, 240, 'left'), gp(123.1, 320, 'left')],

  // Staircase right — center→rx=123.1 at y=80, then→rx=235.36 at y=160
  [
    TOP,
    gp(0, 80, 'right'),
    gp(123.1, 80, 'right'),
    gp(123.1, 160, 'right'),
    gp(235.36, 160, 'right'),
    gp(235.36, 240, 'right'),
    gp(235.36, 320, 'right'),
  ],

  // Staircase left — mirror
  [
    TOP,
    gp(0, 80, 'left'),
    gp(123.1, 80, 'left'),
    gp(123.1, 160, 'left'),
    gp(235.36, 160, 'left'),
    gp(235.36, 240, 'left'),
    gp(235.36, 320, 'left'),
  ],

  // Outer right — rx=235.36→rx=328.7 at y=160
  [
    TOP,
    gp(235.36, 80, 'right'),
    gp(235.36, 160, 'right'),
    gp(328.7, 160, 'right'),
    gp(328.7, 240, 'right'),
    gp(328.7, 320, 'right'),
  ],

  // Outer left — mirror
  [
    TOP,
    gp(235.36, 80, 'left'),
    gp(235.36, 160, 'left'),
    gp(328.7, 160, 'left'),
    gp(328.7, 240, 'left'),
    gp(328.7, 320, 'left'),
  ],
];

// Precompute
const ROUTE_DATA = EVENT_ROUTES.map((waypoints) => ({
  d: buildRoutePath(waypoints),
  length: computeRouteLength(waypoints),
}));

// --- Filled wireframe (globe only, no extension) ---

function buildGlobeMeridian(rx: number, side: 'left' | 'right'): string {
  if (rx === 0) return `M ${CX},0 L ${CX},320`;
  const exitPt = gp(rx, 320, side);
  const sweep = side === 'right' ? 0 : 1;
  return `M ${CX},0 A ${rx} ${R} 0 0 ${sweep} ${exitPt.x},320`;
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

export function EventRaysOverlay() {
  const { heroMode } = useHeroBackground();
  const { scrollY } = useScroll();
  const uid = useId().replace(/:/g, '');
  const clipRectRef = useRef<SVGRectElement>(null);
  const pulseRefs = useRef<Array<SVGPathElement | null>>([]);

  useMotionValueEvent(scrollY, 'change', (v) => {
    const t = Math.max(0, Math.min(1, v / SCROLL_RANGE));

    // Clip rect — reveals bright grid from top
    if (clipRectRef.current) {
      const fillHeight = Math.min(RAY_EXTEND_Y + 10, 20 + t * RAY_EXTEND_Y);
      clipRectRef.current.setAttribute('height', String(Math.round(fillHeight)));
    }

    // Pulse dashoffsets — scroll drives pulse position along each route
    ROUTE_DATA.forEach((route, i) => {
      const pulseLen = Math.min(PULSE_LENGTH, route.length - 1);
      const startOffset = pulseLen;
      const endOffset = -route.length;
      const offset = String(Math.round((startOffset + t * (endOffset - startOffset)) * 100) / 100);

      const glowEl = pulseRefs.current[i * 2];
      const coreEl = pulseRefs.current[i * 2 + 1];
      if (glowEl) glowEl.setAttribute('stroke-dashoffset', offset);
      if (coreEl) coreEl.setAttribute('stroke-dashoffset', offset);
    });
  });

  if (heroMode !== 'event-rays') return null;

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
        </defs>

        <g clipPath={`url(#ray-clip-${uid})`}>
          {/* Bright filled wireframe — latitudes */}
          {FILLED_LATITUDES.map((d, i) => (
            <path
              key={`lat-${i}`}
              d={d}
              fill='none'
              stroke='var(--globe-data-path)'
              strokeWidth='1.5'
              strokeOpacity='0.4'
              vectorEffect='non-scaling-stroke'
            />
          ))}

          {/* Bright filled wireframe — meridians (globe portion only) */}
          {FILLED_MERIDIANS.map((d, i) => (
            <path
              key={`mer-${i}`}
              d={d}
              fill='none'
              stroke='var(--globe-data-path)'
              strokeWidth='1.5'
              strokeOpacity='0.3'
              vectorEffect='non-scaling-stroke'
            />
          ))}

          {/* Scroll-driven pulses following grid routes */}
          {ROUTE_DATA.map((route, i) => {
            const pulseLen = Math.min(PULSE_LENGTH, route.length - 1);

            return (
              <g key={i}>
                {/* Outer glow */}
                <path
                  ref={(node) => {
                    pulseRefs.current[i * 2] = node;
                  }}
                  d={route.d}
                  fill='none'
                  stroke='var(--globe-data-path)'
                  strokeLinecap='round'
                  strokeOpacity='0.22'
                  strokeWidth='6'
                  vectorEffect='non-scaling-stroke'
                  strokeDasharray={`${pulseLen} ${route.length}`}
                  strokeDashoffset={pulseLen}
                />
                {/* Core pulse */}
                <path
                  ref={(node) => {
                    pulseRefs.current[i * 2 + 1] = node;
                  }}
                  d={route.d}
                  fill='none'
                  stroke='var(--globe-data-path)'
                  strokeLinecap='round'
                  strokeWidth='2'
                  vectorEffect='non-scaling-stroke'
                  strokeDasharray={`${pulseLen} ${route.length}`}
                  strokeDashoffset={pulseLen}
                />
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
