'use client';

import React, { memo, useState, useCallback } from 'react';
import { useAnimationFrame } from '@/hooks/useAnimationFrame';

interface AnimatedDashboardLogoPuzzleProps {
  size?: number;
  className?: string;
  speed?: number;
}

// Piece transform - just x, y translation for true 2D sliding
interface PieceTransform {
  x: number;
  y: number;
}

// Piece definitions - the 9 natural geometric parts
interface PieceDef {
  id: string;
  type: 'path' | 'circle';
  d?: string;
  cx?: number;
  cy?: number;
  r?: number;
  fill: string;
  className?: string;
  // Center point for initial scatter calculation
  centerX: number;
  centerY: number;
}

const PIECES: PieceDef[] = [
  // Left column
  {
    id: 'left-dark',
    type: 'path',
    d: 'M322 0H2V640l4-2c3-3 67-70 70-73 1-4 1-5-1-8-11-21-15-44-10-67 7-27 21-49 45-64 23-13 49-18 75-12l3 1c17 5 36 15 47 29l3 4c3 4 7 8 9 12 12 21 16 48 10 71l-4 18 58 44c3 2 5 4 8 5V0Z',
    fill: 'currentColor',
    className: 'fill-foreground',
    centerX: 162,
    centerY: 320,
  },
  {
    id: 'left-blue',
    type: 'path',
    d: 'M230.956 595.875s-5.14-4.399-8.364-5.639c0 0-2.011-.236-5.148 1.886-9.245 6.015-9.245 6.015-19.34 10.562-20.592 8.9-45.916 9.678-66.912 1.701-5.445-2.128-10.794-4.523-16.611-5.385-2.75 1.725-106.364 111.463-108.777 113.643-6.06 6.809-6.06 6.809-5.654 34.792C.215 751.654 1.58 1068 1.58 1068h320.001s1.516-394.198 1.108-398.532c-1.784-5.583-5.439-7.858-10.207-10.801-2.808-1.522-2.808-1.522-4.788-3.142z',
    fill: '#1E78C6',
    centerX: 161,
    centerY: 830,
  },
  {
    id: 'left-circle',
    type: 'circle',
    cx: 161,
    cy: 509,
    r: 48,
    fill: '#2073BC',
    centerX: 161,
    centerY: 509,
  },
  // Middle column
  {
    id: 'middle-dark',
    type: 'path',
    d: 'M697 0H376v639l3 3 96 76c2-1 4-2 6-3 4-3 8-5 12-6 23-11 49-13 73-5l11 3 112-139c5-6 5-6 5-25V0Z',
    fill: 'currentColor',
    className: 'fill-foreground',
    centerX: 536,
    centerY: 360,
  },
  {
    id: 'middle-blue',
    type: 'path',
    d: 'M697 646h-3l-70 86c-3 3-6 6-6 10l2 2c12 19 16 38 15 59-1 22-10 46-26 61l-2 2c-21 19-44 31-73 30-25-1-49-11-67-29l-2-2c-10-11-18-22-22-36l-1-2c-6-18-6-37-1-55l3-13-59-45c-3-2-5-3-9-4v359h321V646Z',
    fill: '#1E78C6',
    centerX: 536,
    centerY: 857,
  },
  {
    id: 'middle-circle',
    type: 'circle',
    cx: 536,
    cy: 800,
    r: 48,
    fill: '#2580CD',
    centerX: 536,
    centerY: 800,
  },
  // Right column
  {
    id: 'right-dark',
    type: 'path',
    d: 'M941 44C884 3 819 0 751 0v493h2l185-225 4-4c0-3 0-5-2-8-10-16-15-36-14-55v-2c1-23 11-46 27-63l2-2c14-13 31-21 49-26l3-1c0-3 0-3-1-5-4-4-8-8-12-13s-9-10-14-15l-2-1c-10-8-21-16-32-24-2-1-4-2-5-4Z',
    fill: 'currentColor',
    className: 'fill-foreground',
    centerX: 880,
    centerY: 246,
  },
  {
    id: 'right-blue',
    type: 'path',
    d: 'M1050.71 386.68c12.41-29.545 20.99-63.469 19.62-95.68-21.33 5.938-42.33 13.5-73.876 5.938-4.419-1.441-8.502-2.508-13.125-2.938-2.228 1.902-226.431 275.795-228.473 277.898-5.02 5.939-5.02 5.939-4.776 22.166.032 1.967.83 332.002.826 333.97.093 46.656.252 93.306.423 139.966 7.188.04 14.376.08 21.564.1 3.688.01 7.376.02 11.064.04 14.762.09 29.519.48 44.17-1.61h.006c1.611-.27 1.613-.27 3.196-.53 33.579-5.2 66.21-16.06 95.849-32.78.731-.42 1.441-.82 2.151-1.22 11.993-6.61 23.055-14.07 33.928-22.4.704-.54 1.388-1.07 2.072-1.6 8.614-6.64 16.439-13.83 23.562-22.062 1.73-2.016 3.47-3.97 5.332-5.864 15.037-14.797 27.837-31.295 38.577-49.449.52-.892 1.03-1.759 1.53-2.625 25.75-44.115 38.41-96.868 37.07-147.83-.03-.738-.05-1.454-.07-2.17-.81-28.95-6.53-57.445-16.12-84.734-.88-2.469-1.77-4.935-2.61-7.416-7.07-21.151-17.81-40.798-30.83-58.86-.49-.677-.96-1.333-1.44-1.99-5.43-7.539-10.9-14.959-17.19-21.812-2.46-2.621-4.847-5.232-7.116-8.024-6.17-7.793-12.911-13.95-20.633-20.164l-5.062-4c-5.507-4.496-11.076-8.827-16.875-12.938-3.422-2.419-6.833-4.845-10.195-7.347a850 850 0 0 0-20.289-14.844L920.329 534c6.383-5.078 12.78-9.966 19.687-14.312 14.513-9.109 29.419-19.258 41.372-31.614l1.692-1.807.249-.267c5.355-5.716 10.692-11.446 15.812-17.375 1.559-1.806 3.119-3.558 4.819-5.238 3.62-3.497 6.91-7.105 10-11.08.53-.699 1.04-1.378 1.56-2.057 12.51-16.479 24.1-34.625 31.56-54 1.16-3.223 2.32-6.409 3.63-9.57',
    fill: '#1E78C6',
    centerX: 910,
    centerY: 680,
  },
  {
    id: 'right-circle',
    type: 'circle',
    cx: 1024,
    cy: 201,
    r: 47,
    fill: '#1E72BC',
    centerX: 1024,
    centerY: 201,
  },
];

// Original logo dimensions
const LOGO_WIDTH = 1071;
const LOGO_HEIGHT = 1069;

// VERY large area needed for perimeter highways that don't cross parking spots
const SCATTER_PADDING = 3700;
const VIEW_BOX_WIDTH = LOGO_WIDTH + SCATTER_PADDING * 2;
const VIEW_BOX_HEIGHT = LOGO_HEIGHT + SCATTER_PADDING * 2;

// Offset to center the logo within the expanded viewBox
const LOGO_OFFSET_X = SCATTER_PADDING;
const LOGO_OFFSET_Y = SCATTER_PADDING;

// Animation timing (in ms) - SLOW for puzzle feel
const SCATTER_DURATION = 1800;   // Phase 1: pieces scatter from center
const SCATTER_HOLD = 600;        // Hold scattered state
const ASSEMBLY_PIECE_DELAY = 1000; // Delay between pieces - slight overlap but mostly sequential
const ASSEMBLY_DURATION = 1600;   // Time for each piece to complete its path
const ASSEMBLED_HOLD = 2000;     // Hold assembled state before restarting

const NUM_PIECES = 9;
const ASSEMBLY_TOTAL = NUM_PIECES * ASSEMBLY_PIECE_DELAY + ASSEMBLY_DURATION;
const TOTAL_CYCLE = SCATTER_DURATION + SCATTER_HOLD + ASSEMBLY_TOTAL + ASSEMBLED_HOLD;

// COLLISION-FREE PUZZLE ASSEMBLY v10
// Validated by puzzleCollisionCheck.ts - ALL CHECKS PASSED
//
// Rules:
// 1. NO TWO PIECES MAY EVER OVERLAP after landing on the floor
// 2. Pieces scattered on WRONG sides - must travel AROUND to reach destination
// 3. Highway system at ±2500, parking at x=±1900 (staggered y)
//
// Left column pieces (0,1,2) → parked FAR RIGHT, travel via BOTTOM highway
// Middle column pieces (3,4,5) → parked TOP/BOTTOM with direct vertical paths
// Right column pieces (6,7,8) → parked FAR LEFT, travel via TOP highway

type PiecePath = PieceTransform[];

const PIECE_PATHS: PiecePath[] = [
  // === LEFT COLUMN: travel via BOTTOM highway ===
  // Approach from BELOW to avoid crossing sibling pieces

  // 0: left-dark - parked far right, TOP
  [
    { x: 1900, y: -1400 },   // park: far right, high up
    { x: 2500, y: -1400 },   // east to right highway
    { x: 2500, y: 2500 },    // south along highway
    { x: 0, y: 2500 },       // west along bottom highway to center
    { x: 0, y: 0 },          // slide up into place
  ],

  // 1: left-blue - parked far right, MIDDLE
  [
    { x: 1900, y: 200 },     // park: far right, middle
    { x: 2500, y: 200 },     // east to right highway
    { x: 2500, y: 2500 },    // south along highway
    { x: 0, y: 2500 },       // west along bottom highway to center
    { x: 0, y: 0 },          // slide up into place
  ],

  // 2: left-circle - parked far right, BOTTOM
  [
    { x: 1900, y: 1800 },    // park: far right, low
    { x: 2500, y: 1800 },    // east to right highway
    { x: 2500, y: 2500 },    // south to corner
    { x: 0, y: 2500 },       // west along bottom highway to center
    { x: 0, y: 0 },          // slide up into place
  ],

  // === MIDDLE COLUMN: direct vertical paths ===

  // 3: middle-dark - parked FAR ABOVE
  [
    { x: 0, y: -1800 },      // park: center, way up
    { x: 0, y: -900 },       // down
    { x: 0, y: 0 },          // into place
  ],

  // 4: middle-blue - parked FAR BELOW (past y=3500 to avoid highway at 2500)
  [
    { x: 400, y: 3600 },     // park: way down, far past bottom highway
    { x: 400, y: 600 },      // up
    { x: 0, y: 600 },        // left
    { x: 0, y: 0 },          // into place
  ],

  // 5: middle-circle - parked FAR BELOW (past y=3500 to avoid highway at 2500)
  [
    { x: -400, y: 3600 },    // park: way down, far past bottom highway
    { x: -400, y: 700 },     // up
    { x: 0, y: 700 },        // right
    { x: 0, y: 0 },          // into place
  ],

  // === RIGHT COLUMN: travel via TOP highway ===
  // Approach from above, then slide LEFT into place

  // 6: right-dark - parked far left, TOP
  [
    { x: -1900, y: -1400 },  // park: far left, high up
    { x: -2500, y: -1400 },  // west to left highway
    { x: -2500, y: -2500 },  // north to corner
    { x: 1200, y: -2500 },   // east along top highway to far right
    { x: 1200, y: 0 },       // down to final y
    { x: 0, y: 0 },          // slide LEFT into place
  ],

  // 7: right-blue - parked far left, MIDDLE
  // Goes FIRST - direct path through clear middle
  [
    { x: -1900, y: 200 },    // park: far left, middle
    { x: 0, y: 200 },        // straight across through clear center
    { x: 0, y: 0 },          // slide into place
  ],

  // 8: right-circle - parked far left, TOP (near piece 7)
  // Goes SECOND - direct path through clear middle, slides LEFT into place
  [
    { x: -1900, y: -200 },   // park: far left, near top (close to piece 7's parking)
    { x: 200, y: -200 },     // straight across through clear center, to right of final spot
    { x: 0, y: 0 },          // slide left into place
  ],
];

// Assembly order: right-blue & right-circle first (dramatic entry), then left, middle, right-dark
const ASSEMBLY_ORDER = [
  7, 8,     // Right column openers: blue, circle (longest journeys - dramatic start)
  0, 2, 1,  // Left column: dark, circle, blue
  3, 5, 4,  // Middle column: dark, circle, blue
  6,        // Right column finale: dark
];

// Easing functions
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// Interpolate along a path of waypoints
function interpolatePath(path: PiecePath, progress: number): PieceTransform {
  const numSegments = path.length - 1;
  if (numSegments <= 0) return path[0];

  // Which segment are we in?
  const segmentFloat = progress * numSegments;
  const segmentIndex = Math.min(Math.floor(segmentFloat), numSegments - 1);
  const segmentProgress = segmentFloat - segmentIndex;

  const from = path[segmentIndex];
  const to = path[segmentIndex + 1];

  // Ease within each segment
  const easedProgress = easeInOutQuad(segmentProgress);

  return {
    x: from.x + (to.x - from.x) * easedProgress,
    y: from.y + (to.y - from.y) * easedProgress,
  };
}

export const AnimatedDashboardLogoPuzzle = memo(function AnimatedDashboardLogoPuzzle({
  size = 120,
  className = '',
  speed = 1,
}: AnimatedDashboardLogoPuzzleProps) {
  // Initialize at center (start of scatter) to avoid hydration mismatch
  const [transforms, setTransforms] = useState<PieceTransform[]>(
    PIECES.map(() => ({ x: 0, y: 0 }))
  );

  const animate = useCallback((time: number) => {
    // Apply speed multiplier to time
    const scaledTime = time * speed;
    const cycleTime = scaledTime % TOTAL_CYCLE;

    const newTransforms = PIECES.map((piece, pieceIndex) => {
      const path = PIECE_PATHS[pieceIndex];
      const scatteredPos = path[0]; // First position is scattered

      // Phase 1: Scatter from center outward to first waypoint
      if (cycleTime < SCATTER_DURATION) {
        const progress = easeOutQuad(cycleTime / SCATTER_DURATION);
        return {
          x: scatteredPos.x * progress,
          y: scatteredPos.y * progress,
        };
      }

      // Phase 2: Hold scattered position
      if (cycleTime < SCATTER_DURATION + SCATTER_HOLD) {
        return scatteredPos;
      }

      // Phase 3: Assembly - pieces follow their waypoint paths
      const assemblyStartTime = SCATTER_DURATION + SCATTER_HOLD;
      const assemblyTime = cycleTime - assemblyStartTime;

      const orderIndex = ASSEMBLY_ORDER.indexOf(pieceIndex);
      const pieceStartTime = orderIndex * ASSEMBLY_PIECE_DELAY;
      const pieceElapsed = assemblyTime - pieceStartTime;

      if (pieceElapsed < 0) {
        // This piece hasn't started moving yet
        return scatteredPos;
      } else if (pieceElapsed < ASSEMBLY_DURATION) {
        // This piece is following its waypoint path
        const progress = pieceElapsed / ASSEMBLY_DURATION;
        return interpolatePath(path, progress);
      } else {
        // This piece has arrived at final position
        return { x: 0, y: 0 };
      }
    });

    setTransforms(newTransforms);
  }, [speed]);

  useAnimationFrame(animate);

  const scale = size / Math.max(VIEW_BOX_WIDTH, VIEW_BOX_HEIGHT);

  return (
    <div
      className={`relative ${className}`}
      style={{
        width: VIEW_BOX_WIDTH * scale,
        height: VIEW_BOX_HEIGHT * scale,
      }}
    >
      <svg
        width={VIEW_BOX_WIDTH * scale}
        height={VIEW_BOX_HEIGHT * scale}
        viewBox={`0 0 ${VIEW_BOX_WIDTH} ${VIEW_BOX_HEIGHT}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Group offset to center logo in expanded viewBox */}
        <g transform={`translate(${LOGO_OFFSET_X}, ${LOGO_OFFSET_Y})`}>
          {PIECES.map((piece, i) => {
            const t = transforms[i];
            // Pure 2D translation - no rotation, no scale
            const transform = `translate(${t.x}, ${t.y})`;

            if (piece.type === 'circle') {
              return (
                <circle
                  key={piece.id}
                  cx={piece.cx}
                  cy={piece.cy}
                  r={piece.r}
                  fill={piece.fill}
                  transform={transform}
                />
              );
            }

            return (
              <path
                key={piece.id}
                d={piece.d}
                fill={piece.fill}
                className={piece.className}
                transform={transform}
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
});
