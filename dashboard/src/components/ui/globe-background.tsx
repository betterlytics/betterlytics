'use client';

import React, { useId } from 'react';
import { cn } from '@/lib/utils';

const R = 400;
const CX = 400;
const CY = 400;
const VIEWBOX = '-1 -1 802 322';
const ROUTE_PATH_LENGTH = 100;
const ROUTE_PULSE_LENGTH = 18;
const ROUTE_PULSE_KEYTIMES = '0;0.1;0.9;1';
const ROUTE_PULSE_DASHOFFSET_VALUES = `${ROUTE_PULSE_LENGTH};0;-${ROUTE_PATH_LENGTH};-${ROUTE_PATH_LENGTH}`;
const ROUTE_PULSE_OPACITY_VALUES = '0;1;1;0';

const MERIDIAN_RX = [400, 328.7, 235.36, 123.1, 0];
const LATITUDE_YS = [80, 160, 240, 320, 400];

interface GridPt {
  readonly x: number;
  readonly y: number;
  readonly rx: number;
  readonly side: 'left' | 'right';
}

function gridPoint(rx: number, y: number, side: 'left' | 'right'): GridPt {
  const dy = (y - CY) / R;
  const sign = side === 'right' ? 1 : -1;
  const x = CX + sign * rx * Math.sqrt(Math.max(0, 1 - dy * dy));
  return { x: Math.round(x * 100) / 100, y, rx, side };
}

function latitudeLines(): ReadonlyArray<{ y: number; x1: number; x2: number }> {
  return LATITUDE_YS.map((y) => {
    const dy = Math.abs(y - CY);
    const hw = Math.sqrt(R * R - dy * dy);
    return { y, x1: Math.round((CX - hw) * 1000) / 1000, x2: Math.round((CX + hw) * 1000) / 1000 };
  });
}

function meridianPaths(): ReadonlyArray<string> {
  const paths: string[] = [];
  for (const rx of MERIDIAN_RX) {
    if (rx === 0) {
      paths.push(`M ${CX},0 L ${CX},${CY * 2}`);
    } else {
      paths.push(`M ${CX},${CY * 2} A ${rx} ${R} 0 0 0 ${CX},0`);
      paths.push(`M ${CX},0 A ${rx} ${R} 0 0 0 ${CX},${CY * 2}`);
    }
  }
  return paths;
}

function arcSegment(
  rx: number,
  side: 'left' | 'right',
  from: { x: number; y: number },
  to: { x: number; y: number },
): string {
  if (rx === 0) return `L ${to.x},${to.y}`;
  const goingDown = to.y > from.y;
  // Match the wireframe: right-side going down = sweep 0, right-side going up = sweep 1
  const sweep = (side === 'right') === goingDown ? 0 : 1;
  return `A ${rx} ${R} 0 0 ${sweep} ${to.x},${to.y}`;
}

// Nodes — spread across the hemisphere
// Hub node (Betterlytics logo) — node 26
const HUB = gridPoint(0, 240, 'right'); // (400, 240)

// Source nodes that send data to the hub
const NODES: ReadonlyArray<GridPt> = [
  gridPoint(328.7, 80, 'right'), // node 3
  gridPoint(235.36, 160, 'left'), // node 13
  gridPoint(235.36, 320, 'left'), // node 31
  gridPoint(235.36, 320, 'right'), // node 32
];

// Pulse cycle — all timing derives from this
const PULSE_DUR = 4;

interface Route {
  readonly waypoints: ReadonlyArray<GridPt>;
  readonly begin: number;
  readonly duration: number;
}

// All routes flow INWARD to the hub (node 26), following grid lines
const ROUTES: ReadonlyArray<Route> = [
  // [13] → 22 → 24 → 26
  {
    waypoints: [
      gridPoint(235.36, 160, 'left'), // 13
      gridPoint(235.36, 240, 'left'), // 22
      gridPoint(123.1, 240, 'left'), // 24
      gridPoint(0, 240, 'right'), // 26 (hub)
    ],
    begin: 0,
    duration: 4,
  },
  // [31] → 33 → 35 → 26
  {
    waypoints: [
      gridPoint(235.36, 320, 'left'), // 31
      gridPoint(123.1, 320, 'left'), // 33
      gridPoint(0, 320, 'right'), // 35
      gridPoint(0, 240, 'right'), // 26 (hub)
    ],
    begin: 1.5,
    duration: 4.7,
  },
  // [3] → 12 → 14 → 16 → 17 → 26
  {
    waypoints: [
      gridPoint(328.7, 80, 'right'), // 3
      gridPoint(328.7, 160, 'right'), // 12
      gridPoint(235.36, 160, 'right'), // 14
      gridPoint(123.1, 160, 'right'), // 16
      gridPoint(0, 160, 'right'), // 17
      gridPoint(0, 240, 'right'), // 26 (hub)
    ],
    begin: 3,
    duration: 5.3,
  },
  // [32] → 34 → 25 → 26
  {
    waypoints: [
      gridPoint(235.36, 320, 'right'), // 32
      gridPoint(123.1, 320, 'right'), // 34
      gridPoint(123.1, 240, 'right'), // 25
      gridPoint(0, 240, 'right'), // 26 (hub)
    ],
    begin: 5,
    duration: 4.3,
  },
];

function buildRoutePath(waypoints: ReadonlyArray<GridPt>) {
  let d = `M ${waypoints[0].x},${waypoints[0].y}`;

  for (let i = 1; i < waypoints.length; i++) {
    const from = waypoints[i - 1];
    const to = waypoints[i];

    if (from.y === to.y) {
      d += ` L ${to.x},${to.y}`;
    } else {
      d += ` ${arcSegment(from.rx, from.side, from, to)}`;
    }
  }

  return d;
}

// Precompute
const LATITUDES = latitudeLines();
const MERIDIANS = meridianPaths();
const ROUTE_DATA = ROUTES.map((r) => ({ d: buildRoutePath(r.waypoints), begin: r.begin, duration: r.duration }));

interface GlobeBackgroundProps {
  className?: string;
  logoSrc?: string;
}

export function GlobeBackground({ className, logoSrc = '/images/favicon-dark.svg' }: GlobeBackgroundProps) {
  const uid = useId().replace(/:/g, '');

  return (
    <div className={cn('flex items-end justify-center', className)}>
      <svg viewBox={VIEWBOX} width='100%' height='100%' aria-hidden='true' className='max-w-5xl'>
        <defs>
          <radialGradient id={`g-ripple-${uid}`}>
            <stop offset='0%' stopColor='var(--globe-data-path)' stopOpacity='0.6' />
            <stop offset='60%' stopColor='var(--globe-data-path)' stopOpacity='0.2' />
            <stop offset='100%' stopColor='var(--globe-data-path)' stopOpacity='0' />
          </radialGradient>

          <linearGradient id={`g-wire-${uid}`} x1='0' y1='0' x2='0' y2={`${CY}`} gradientUnits='userSpaceOnUse'>
            <stop offset='0%' stopColor='var(--globe-grid)' stopOpacity='0.4' />
            <stop offset='100%' stopColor='var(--globe-grid)' />
          </linearGradient>

        </defs>

        {/* Background hemisphere */}
        <circle cx={CX} cy={CY} r={R} fill='var(--globe-bg)' />

        {/* Wireframe grid */}
        <g>
          {LATITUDES.map((lat) => (
            <path
              key={lat.y}
              d={`M ${lat.x1},${lat.y} h ${lat.x2 - lat.x1}`}
              fill='none'
              stroke={`url(#g-wire-${uid})`}
              strokeWidth='1'
              vectorEffect='non-scaling-stroke'
            />
          ))}
          {MERIDIANS.map((d, i) => (
            <path
              key={i}
              d={d}
              fill='none'
              stroke={`url(#g-wire-${uid})`}
              strokeWidth='1'
              vectorEffect='non-scaling-stroke'
            />
          ))}
        </g>

        {/* Animated data paths */}
        <g className='globe-data-paths'>
          {ROUTE_DATA.map((rd, i) => (
            <g key={i}>
              <path
                d={rd.d}
                fill='none'
                stroke='var(--globe-data-path)'
                strokeLinecap='round'
                strokeOpacity='0.22'
                strokeWidth='6'
                vectorEffect='non-scaling-stroke'
                pathLength={ROUTE_PATH_LENGTH}
                strokeDasharray={`${ROUTE_PULSE_LENGTH} ${ROUTE_PATH_LENGTH}`}
                strokeDashoffset={ROUTE_PULSE_LENGTH}
                opacity='0'
              >
                <animate
                  attributeName='stroke-dashoffset'
                  values={ROUTE_PULSE_DASHOFFSET_VALUES}
                  keyTimes={ROUTE_PULSE_KEYTIMES}
                  dur={`${rd.duration}s`}
                  begin={`${rd.begin}s`}
                  repeatCount='indefinite'
                />
                <animate
                  attributeName='opacity'
                  values={ROUTE_PULSE_OPACITY_VALUES}
                  keyTimes={ROUTE_PULSE_KEYTIMES}
                  dur={`${rd.duration}s`}
                  begin={`${rd.begin}s`}
                  repeatCount='indefinite'
                />
              </path>
              <path
                d={rd.d}
                fill='none'
                stroke='var(--globe-data-path)'
                strokeLinecap='round'
                strokeWidth='2'
                vectorEffect='non-scaling-stroke'
                pathLength={ROUTE_PATH_LENGTH}
                strokeDasharray={`${ROUTE_PULSE_LENGTH} ${ROUTE_PATH_LENGTH}`}
                strokeDashoffset={ROUTE_PULSE_LENGTH}
                opacity='0'
              >
                <animate
                  attributeName='stroke-dashoffset'
                  values={ROUTE_PULSE_DASHOFFSET_VALUES}
                  keyTimes={ROUTE_PULSE_KEYTIMES}
                  dur={`${rd.duration}s`}
                  begin={`${rd.begin}s`}
                  repeatCount='indefinite'
                />
                <animate
                  attributeName='opacity'
                  values={ROUTE_PULSE_OPACITY_VALUES}
                  keyTimes={ROUTE_PULSE_KEYTIMES}
                  dur={`${rd.duration}s`}
                  begin={`${rd.begin}s`}
                  repeatCount='indefinite'
                />
              </path>
            </g>
          ))}
        </g>

        {/* Source nodes with ping ripple */}
        <g>
          {NODES.map((node, i) => (
            <g key={i}>
              <circle
                cx={node.x}
                cy={node.y}
                r='8'
                fill='var(--globe-data-path)'
                opacity='0.4'
                className='animate-ping'
                style={{ transformOrigin: `${node.x}px ${node.y}px` }}
              />
              <circle
                cx={node.x}
                cy={node.y}
                r='12'
                fill='var(--globe-node-bg)'
                stroke='var(--globe-node-border)'
                strokeWidth='1'
                vectorEffect='non-scaling-stroke'
              />
              <circle cx={node.x} cy={node.y} r='4' fill='var(--globe-data-path)' />
            </g>
          ))}
        </g>

        {/* Hub node — Betterlytics logo */}
        <g>
          <circle
            cx={HUB.x}
            cy={HUB.y}
            r='10'
            fill='var(--globe-data-path)'
            opacity='0.3'
            className='animate-ping'
            style={{ transformOrigin: `${HUB.x}px ${HUB.y}px` }}
          />
          <circle
            cx={HUB.x}
            cy={HUB.y}
            r='20'
            fill='var(--globe-node-bg)'
            stroke='var(--globe-data-path)'
            strokeWidth='1.5'
            vectorEffect='non-scaling-stroke'
          />
          <image href={logoSrc} x={HUB.x - 14} y={HUB.y - 14} width='28' height='28' />
        </g>

        {/* DEBUG: numbered labels at every grid intersection */}
        {/* <g>
          {(() => {
            const pts: Array<{ x: number; y: number; id: number }> = [];
            let id = 0;
            for (const y of LATITUDE_YS) {
              for (const rx of MERIDIAN_RX) {
                if (rx === 0) {
                  pts.push({ ...gridPoint(rx, y, 'right'), id: id++ });
                } else {
                  pts.push({ ...gridPoint(rx, y, 'left'), id: id++ });
                  pts.push({ ...gridPoint(rx, y, 'right'), id: id++ });
                }
              }
            }
            return pts.map((pt) => (
              <g key={pt.id}>
                <text
                  x={pt.x}
                  y={pt.y}
                  textAnchor='middle'
                  dominantBaseline='central'
                  fill='var(--globe-node-dot)'
                  fontSize='10'
                  fontWeight='bold'
                >
                  {pt.id}
                </text>
              </g>
            ));
          })()}
        </g> */}
      </svg>
    </div>
  );
}
