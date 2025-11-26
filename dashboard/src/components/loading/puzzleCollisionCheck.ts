/**
 * Collision detection for puzzle animation
 * Run with: npx ts-node puzzleCollisionCheck.ts
 */

interface BoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

const PIECE_BOUNDS: BoundingBox[] = [
  // 0: left-dark
  { minX: 2, maxX: 322, minY: 0, maxY: 640 },
  // 1: left-blue
  { minX: 0, maxX: 322, minY: 590, maxY: 1068 },
  // 2: left-circle
  { minX: 113, maxX: 209, minY: 461, maxY: 557 },
  // 3: middle-dark
  { minX: 376, maxX: 697, minY: 0, maxY: 718 },
  // 4: middle-blue
  { minX: 376, maxX: 697, minY: 646, maxY: 1068 },
  // 5: middle-circle
  { minX: 488, maxX: 584, minY: 752, maxY: 848 },
  // 6: right-dark
  { minX: 751, maxX: 1007, minY: 0, maxY: 493 },
  // 7: right-blue
  { minX: 750, maxX: 1071, minY: 291, maxY: 1068 },
  // 8: right-circle
  { minX: 977, maxX: 1071, minY: 154, maxY: 248 },
];

interface Point {
  x: number;
  y: number;
}

// Current paths - synced from AnimatedDashboardLogoPuzzle.tsx
const PIECE_PATHS: Point[][] = [
  // 0: left-dark - from right, swings left staying very high to avoid 3
  [
    { x: 1900, y: -1400 },
    { x: 0, y: -1200 },      // swing left staying very high
    { x: 0, y: 0 },          // drop into place
  ],
  // 1: left-blue - from TOP-LEFT, goes DOWN then RIGHT (very low to avoid 2)
  [
    { x: -1900, y: -1800 },  // park: far left, HIGH (top-left)
    { x: -1900, y: 1500 },   // DOWN very far (below piece 2's path)
    { x: 0, y: 0 },          // RIGHT-UP into place
  ],
  // 2: left-circle
  [
    { x: 1900, y: 1500 },
    { x: 2500, y: 1800 },
    { x: 2500, y: 2500 },
    { x: 0, y: 2500 },
    { x: 0, y: 0 },
  ],
  // 3: middle-dark - starts closer to piece 1 (left-upper area), curves into place
  [
    { x: -1000, y: -1800 },   // start: halfway between center and piece 1
    { x: 0, y: 0 },           // curve into place
  ],
  // 4: middle-blue - moved to x=2500 to avoid 0's highway
  [
    { x: 2500, y: -600 },
    { x: 2500, y: 800 },
    { x: 0, y: 800 },
    { x: 0, y: 0 },
  ],
  // 5: middle-circle
  [
    { x: -1900, y: 1200 },
    { x: 0, y: 0 },
  ],
  // 6: right-dark - from top-right diagonal (clear path)
  [
    { x: 400, y: -1800 },
    { x: 0, y: 0 },
  ],
  // 7: right-blue
  [
    { x: -1900, y: 200 },
    { x: 0, y: 0 },
  ],
  // 8: right-circle
  [
    { x: 1900, y: -1000 },
    { x: 0, y: 0 },
  ],
];

// Assembly order
const ASSEMBLY_ORDER = [
  7,        // Right-blue (from left)
  6,        // Right-dark (from top-right)
  8,        // Right-circle (from right)
  5,        // Middle-circle (from left)
  3,        // Middle-dark (from top)
  0,        // Left-dark (arc from right)
  2,        // Left-circle
  4,        // Middle-blue (last)
  1,        // Left-blue - handled specially
];

// Individual start times for each piece - optimized
const PIECE_START_TIMES: Record<number, number> = {
  7: 0,       // Right-blue (first)
  6: 300,     // Right-dark - tighter
  8: 600,     // Right-circle - tighter
  5: 900,     // Middle-circle - tighter
  3: 1200,    // Middle-dark - tighter
  0: 1700,    // Left-dark - needs 500ms gap from 3
  2: 2100,    // Left-circle
  4: 2500,    // Middle-blue
  1: 2500,    // Left-blue - same as piece 4
};

// Timing
const ASSEMBLY_DURATION = 1600;

function getBoundsAtOffset(pieceIndex: number, offset: Point): BoundingBox {
  const base = PIECE_BOUNDS[pieceIndex];
  return {
    minX: base.minX + offset.x,
    maxX: base.maxX + offset.x,
    minY: base.minY + offset.y,
    maxY: base.maxY + offset.y,
  };
}

function boxesOverlap(a: BoundingBox, b: BoundingBox): boolean {
  return !(a.maxX < b.minX || b.maxX < a.minX || a.maxY < b.minY || b.maxY < a.minY);
}

function interpolatePath(path: Point[], progress: number): Point {
  const numSegments = path.length - 1;
  if (numSegments <= 0) return path[0];

  const segmentFloat = progress * numSegments;
  const segmentIndex = Math.min(Math.floor(segmentFloat), numSegments - 1);
  const segmentProgress = segmentFloat - segmentIndex;

  const from = path[segmentIndex];
  const to = path[segmentIndex + 1];

  return {
    x: from.x + (to.x - from.x) * segmentProgress,
    y: from.y + (to.y - from.y) * segmentProgress,
  };
}

function getPiecePosition(pieceIndex: number, assemblyTime: number): Point {
  // Use individual start time for each piece
  const pieceStartTime = PIECE_START_TIMES[pieceIndex] ?? 0;
  const pieceElapsed = assemblyTime - pieceStartTime;

  const path = PIECE_PATHS[pieceIndex];
  const scattered = path[0];

  if (pieceElapsed < 0) {
    return scattered;
  } else if (pieceElapsed < ASSEMBLY_DURATION) {
    const progress = pieceElapsed / ASSEMBLY_DURATION;
    return interpolatePath(path, progress);
  } else {
    return { x: 0, y: 0 };
  }
}

function checkScatteredCollisions(): string[] {
  const errors: string[] = [];

  for (let i = 0; i < 9; i++) {
    const posI = PIECE_PATHS[i][0];
    const boundsI = getBoundsAtOffset(i, posI);

    for (let j = i + 1; j < 9; j++) {
      const posJ = PIECE_PATHS[j][0];
      const boundsJ = getBoundsAtOffset(j, posJ);

      if (boxesOverlap(boundsI, boundsJ)) {
        errors.push(`SCATTERED COLLISION: Piece ${i} overlaps Piece ${j}`);
      }
    }
  }

  return errors;
}

function isAtFinalPosition(pos: Point): boolean {
  const threshold = 200;
  return Math.abs(pos.x) < threshold && Math.abs(pos.y) < threshold;
}

function checkAssemblyCollisions(): string[] {
  const errors: string[] = [];
  const maxStartTime = Math.max(...Object.values(PIECE_START_TIMES));
  const totalAssemblyTime = maxStartTime + ASSEMBLY_DURATION;
  const timeStep = 50;

  for (let t = 0; t <= totalAssemblyTime; t += timeStep) {
    const positions: Point[] = [];
    for (let i = 0; i < 9; i++) {
      positions.push(getPiecePosition(i, t));
    }

    for (let i = 0; i < 9; i++) {
      const boundsI = getBoundsAtOffset(i, positions[i]);

      for (let j = i + 1; j < 9; j++) {
        const boundsJ = getBoundsAtOffset(j, positions[j]);

        if (boxesOverlap(boundsI, boundsJ)) {
          if (isAtFinalPosition(positions[i]) && isAtFinalPosition(positions[j])) {
            continue;
          }

          if (!errors.some(e => e.includes(`Piece ${i}`) && e.includes(`Piece ${j}`))) {
            errors.push(`COLLISION at t=${t}ms: Piece ${i} overlaps Piece ${j}`);
            errors.push(`  Piece ${i} at (${Math.round(positions[i].x)}, ${Math.round(positions[i].y)})`);
            errors.push(`  Piece ${j} at (${Math.round(positions[j].x)}, ${Math.round(positions[j].y)})`);
          }
        }
      }
    }
  }

  return errors;
}

// Run
console.log('=== PUZZLE COLLISION CHECK ===\n');

console.log('Checking scattered positions...');
const scatteredErrors = checkScatteredCollisions();
if (scatteredErrors.length === 0) {
  console.log('✓ No collisions at scattered positions\n');
} else {
  console.log('✗ Found collisions:\n');
  scatteredErrors.forEach(e => console.log(e));
  console.log('');
}

console.log('Checking assembly animation...');
const assemblyErrors = checkAssemblyCollisions();
if (assemblyErrors.length === 0) {
  console.log('✓ No collisions during assembly\n');
} else {
  console.log('✗ Found collisions:\n');
  assemblyErrors.forEach(e => console.log(e));
  console.log('');
}

if (scatteredErrors.length === 0 && assemblyErrors.length === 0) {
  console.log('=== ALL CHECKS PASSED ===');
} else {
  console.log(`=== FAILED: ${scatteredErrors.length + assemblyErrors.length} issues found ===`);
}
