'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { GlobeGridNodes } from './globe-grid-nodes';

const R = 400;
const CX = 400;
const CY = 400;
const VIEWBOX = '-1 -1 802 322';
const ROUTE_PULSE_LENGTH = 120;
const TUNNEL_EXTRA_LENGTH = 60;
const SOURCE_OCCLUSION_RADIUS = 5;
const SOURCE_TUNNEL_STROKE = 10;
const HUB_FRONT_OCCLUDER_RADIUS = 13;
const ROUTE_PIXELS_PER_SECOND = 164;
const ARC_LENGTH_SAMPLES = 32;

const MERIDIAN_RX = [400, 328.7, 235.36, 123.1, 0];
const LATITUDE_YS = [80, 160, 240, 320, 400];

interface GridPt {
  readonly x: number;
  readonly y: number;
  readonly rx: number;
  readonly side: 'left' | 'right';
}

interface Vec2 {
  readonly x: number;
  readonly y: number;
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

function angleForY(y: number): number {
  return Math.asin((y - CY) / R);
}

function meridianArcLength(rx: number, fromY: number, toY: number): number {
  if (rx === 0) return Math.abs(toY - fromY);

  const fromAngle = angleForY(fromY);
  const toAngle = angleForY(toY);
  let prevX = rx * Math.cos(fromAngle);
  let prevY = R * Math.sin(fromAngle);
  let length = 0;

  for (let i = 1; i <= ARC_LENGTH_SAMPLES; i++) {
    const t = i / ARC_LENGTH_SAMPLES;
    const angle = fromAngle + (toAngle - fromAngle) * t;
    const x = rx * Math.cos(angle);
    const y = R * Math.sin(angle);
    length += Math.hypot(x - prevX, y - prevY);
    prevX = x;
    prevY = y;
  }

  return length;
}

function segmentLength(from: GridPt, to: GridPt): number {
  if (from.y === to.y) return Math.abs(to.x - from.x);
  return meridianArcLength(from.rx, from.y, to.y);
}

function roundMetric(value: number): number {
  return Math.round(value * 100) / 100;
}

function meridianPoint(rx: number, y: number, side: 'left' | 'right'): Vec2 {
  const dy = (y - CY) / R;
  const sign = side === 'right' ? 1 : -1;
  const x = CX + sign * rx * Math.sqrt(Math.max(0, 1 - dy * dy));

  return {
    x: roundMetric(x),
    y: roundMetric(y),
  };
}

function normalize(vec: Vec2): Vec2 {
  const length = Math.hypot(vec.x, vec.y);
  if (length === 0) return { x: 0, y: 0 };
  return { x: vec.x / length, y: vec.y / length };
}

function offsetPoint(point: Vec2, direction: Vec2, distance: number): Vec2 {
  return {
    x: roundMetric(point.x + direction.x * distance),
    y: roundMetric(point.y + direction.y * distance),
  };
}

function travelDirection(from: GridPt, to: GridPt, at: 'start' | 'end'): Vec2 {
  if (from.y === to.y) return normalize({ x: to.x - from.x, y: 0 });
  if (from.rx === 0) return normalize({ x: 0, y: to.y - from.y });

  const y = at === 'start' ? from.y : to.y;
  const theta = angleForY(y);
  const sideSign = from.side === 'right' ? 1 : -1;
  const directionSign = to.y > from.y ? 1 : -1;

  return normalize({
    x: directionSign * (-sideSign * from.rx * Math.sin(theta)),
    y: directionSign * (R * Math.cos(theta)),
  });
}

function pointBeforeRouteStart(source: GridPt, next: GridPt, distance: number): Vec2 {
  if (distance <= 0) return { x: source.x, y: source.y };

  if (source.y === next.y) {
    const direction = Math.sign(next.x - source.x) || 1;
    return {
      x: roundMetric(source.x - direction * distance),
      y: source.y,
    };
  }

  if (source.rx === 0) {
    const direction = Math.sign(next.y - source.y) || 1;
    return {
      x: source.x,
      y: roundMetric(source.y - direction * distance),
    };
  }

  const extendingUpward = next.y > source.y;
  const lowerBound = extendingUpward ? 0 : source.y;
  const upperBound = extendingUpward ? source.y : CY * 2;
  const maxReach = meridianArcLength(source.rx, lowerBound, upperBound);

  if (distance >= maxReach) {
    return meridianPoint(source.rx, extendingUpward ? lowerBound : upperBound, source.side);
  }

  let low = lowerBound;
  let high = upperBound;

  for (let i = 0; i < 24; i++) {
    const mid = (low + high) / 2;
    const travelled = meridianArcLength(source.rx, mid, source.y);

    if (travelled > distance) {
      if (extendingUpward) {
        low = mid;
      } else {
        high = mid;
      }
    } else if (extendingUpward) {
      high = mid;
    } else {
      low = mid;
    }
  }

  const y = extendingUpward ? high : low;
  return meridianPoint(source.rx, y, source.side);
}

function segmentCommand(from: Vec2, to: Vec2, templateFrom: GridPt, templateTo: GridPt): string {
  if (templateFrom.y === templateTo.y || templateFrom.rx === 0) {
    return `L ${to.x},${to.y}`;
  }

  return arcSegment(templateFrom.rx, templateFrom.side, from, to);
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

interface Route {
  readonly waypoints: ReadonlyArray<GridPt>;
  readonly begin: number;
}

interface RouteData {
  readonly d: string;
  readonly length: number;
  readonly sourceTunnelPath: string;
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
  },
];

function buildRouteData(waypoints: ReadonlyArray<GridPt>): RouteData {
  const source = waypoints[0];
  const firstHop = waypoints[1];
  const sourceTravelDirection = travelDirection(source, firstHop, 'start');
  const sourceTunnelLength = ROUTE_PULSE_LENGTH + TUNNEL_EXTRA_LENGTH;
  const sourceTunnelMouth = pointBeforeRouteStart(source, firstHop, SOURCE_OCCLUSION_RADIUS);
  const hiddenSource = offsetPoint(
    sourceTunnelMouth,
    { x: -sourceTravelDirection.x, y: -sourceTravelDirection.y },
    sourceTunnelLength - SOURCE_OCCLUSION_RADIUS,
  );

  let d = `M ${hiddenSource.x},${hiddenSource.y} L ${sourceTunnelMouth.x},${sourceTunnelMouth.y} `;
  d += segmentCommand(sourceTunnelMouth, source, source, firstHop);
  let length = sourceTunnelLength;

  for (let i = 1; i < waypoints.length; i++) {
    const from = waypoints[i - 1];
    const to = waypoints[i];
    length += segmentLength(from, to);

    if (from.y === to.y) {
      d += ` L ${to.x},${to.y}`;
    } else {
      d += ` ${arcSegment(from.rx, from.side, from, to)}`;
    }
  }

  const totalLength = roundMetric(length);

  return {
    d,
    length: totalLength,
    sourceTunnelPath: `M ${sourceTunnelMouth.x},${sourceTunnelMouth.y} L ${hiddenSource.x},${hiddenSource.y}`,
  };
}

// Precompute
const LATITUDES = latitudeLines();
const MERIDIANS = meridianPaths();
const ROUTE_DATA = ROUTES.map((route) => ({ ...buildRouteData(route.waypoints), begin: route.begin }));

interface GlobeBackgroundProps {
  className?: string;
  logoSrc?: string;
}

export function GlobeBackground({ className, logoSrc = '/images/favicon-dark.svg' }: GlobeBackgroundProps) {
  const uid = useId().replace(/:/g, '');
  const pathRefs = useRef<Array<SVGPathElement | null>>([]);
  const [routeLengths, setRouteLengths] = useState(() => ROUTE_DATA.map((route) => route.length));

  useEffect(() => {
    const nextLengths = ROUTE_DATA.map((route, i) => {
      const path = pathRefs.current[i];
      return path ? roundMetric(path.getTotalLength()) : route.length;
    });

    setRouteLengths((prev) => {
      if (
        prev.length === nextLengths.length &&
        prev.every((value, i) => Math.abs(value - nextLengths[i]) < 0.01)
      ) {
        return prev;
      }

      return nextLengths;
    });
  }, []);

  return (
    <div className={cn('flex items-end justify-center', className)}>
      <svg viewBox={VIEWBOX} width='100%' height='100%' aria-hidden='true' className='max-w-5xl'>
        <defs>
          <linearGradient id={`g-wire-${uid}`} x1='0' y1='0' x2='0' y2={`${CY}`} gradientUnits='userSpaceOnUse'>
            <stop offset='0%' stopColor='var(--globe-grid)' stopOpacity='0.4' />
            <stop offset='100%' stopColor='var(--globe-grid)' />
          </linearGradient>
          <clipPath id={`g-hub-logo-clip-${uid}`} clipPathUnits='userSpaceOnUse'>
            <circle cx={HUB.x} cy={HUB.y} r={HUB_FRONT_OCCLUDER_RADIUS} />
          </clipPath>
          {ROUTE_DATA.map((route, i) => {
            return (
              <mask
                key={i}
                id={`g-route-mask-${i}-${uid}`}
                maskUnits='userSpaceOnUse'
                x='-1'
                y='-1'
                width='802'
                height='322'
              >
                <rect x='-1' y='-1' width='802' height='322' fill='white' />
                <path
                  d={route.sourceTunnelPath}
                  fill='none'
                  stroke='black'
                  strokeWidth={SOURCE_TUNNEL_STROKE}
                  strokeLinecap='round'
                  vectorEffect='non-scaling-stroke'
                />
              </mask>
            );
          })}
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

        <GlobeGridNodes
          layer='backplates'
          nodes={NODES}
          hub={HUB}
          hubFrontRadius={HUB_FRONT_OCCLUDER_RADIUS}
          logoSrc={logoSrc}
          hubLogoClipId={`g-hub-logo-clip-${uid}`}
        />

        {/* Animated data paths */}
        <g className='globe-data-paths'>
          {ROUTE_DATA.map((rd, i) => {
            const routeLength = routeLengths[i] ?? rd.length;
            const pulseLength = Math.min(ROUTE_PULSE_LENGTH, Math.max(1, routeLength - 0.01));
            const dashOffsetStart = pulseLength;
            const dashOffsetEnd = roundMetric(-routeLength);
            const routeDuration = roundMetric((routeLength + pulseLength) / ROUTE_PIXELS_PER_SECOND);

            return (
              <g key={i} mask={`url(#g-route-mask-${i}-${uid})`}>
                <path
                  ref={(node) => {
                    pathRefs.current[i] = node;
                  }}
                  d={rd.d}
                  fill='none'
                  stroke='var(--globe-data-path)'
                  strokeLinecap='round'
                  strokeOpacity='0.22'
                  strokeWidth='6'
                  vectorEffect='non-scaling-stroke'
                  strokeDasharray={`${pulseLength} ${routeLength}`}
                  strokeDashoffset={dashOffsetStart}
                >
                  <animate
                    attributeName='stroke-dashoffset'
                    from={`${dashOffsetStart}`}
                    to={`${dashOffsetEnd}`}
                    calcMode='linear'
                    dur={`${routeDuration}s`}
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
                  strokeDasharray={`${pulseLength} ${routeLength}`}
                  strokeDashoffset={dashOffsetStart}
                >
                  <animate
                    attributeName='stroke-dashoffset'
                    from={`${dashOffsetStart}`}
                    to={`${dashOffsetEnd}`}
                    calcMode='linear'
                    dur={`${routeDuration}s`}
                    begin={`${rd.begin}s`}
                    repeatCount='indefinite'
                  />
                </path>
              </g>
            );
          })}
        </g>

        <GlobeGridNodes
          layer='occluders'
          nodes={NODES}
          hub={HUB}
          hubFrontRadius={HUB_FRONT_OCCLUDER_RADIUS}
          logoSrc={logoSrc}
          hubLogoClipId={`g-hub-logo-clip-${uid}`}
        />

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
