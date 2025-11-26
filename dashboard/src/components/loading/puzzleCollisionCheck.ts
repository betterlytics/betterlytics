/**
 * Collision detection for puzzle animation
 * Run with: npx ts-node puzzleCollisionCheck.ts
 *
 * This checks:
 * 1. Scattered positions don't overlap
 * 2. Animation paths don't cause collisions
 */

// Piece bounding boxes (approximate, from the SVG paths)
// Format: { minX, maxX, minY, maxY } relative to piece's final position
interface BoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

const PIECE_BOUNDS: BoundingBox[] = [
  // 0: left-dark (top of left column)
  { minX: 2, maxX: 322, minY: 0, maxY: 640 },
  // 1: left-blue (bottom of left column)
  { minX: 0, maxX: 322, minY: 590, maxY: 1068 },
  // 2: left-circle
  { minX: 113, maxX: 209, minY: 461, maxY: 557 },
  // 3: middle-dark (top of middle column)
  { minX: 376, maxX: 697, minY: 0, maxY: 718 },
  // 4: middle-blue (bottom of middle column)
  { minX: 376, maxX: 697, minY: 646, maxY: 1068 },
  // 5: middle-circle
  { minX: 488, maxX: 584, minY: 752, maxY: 848 },
  // 6: right-dark (top of right column)
  { minX: 751, maxX: 1007, minY: 0, maxY: 493 },
  // 7: right-blue (spans most of right column)
  { minX: 750, maxX: 1071, minY: 291, maxY: 1068 },
  // 8: right-circle
  { minX: 977, maxX: 1071, minY: 154, maxY: 248 },
];

interface Point {
  x: number;
  y: number;
}

// Current piece paths from the animation (v2 - wider spacing)
const PIECE_PATHS: Point[][] = [
  // 0: left-dark
  [
    { x: 1400, y: -900 },
    { x: 1400, y: 600 },
    { x: -800, y: 600 },
    { x: -800, y: 0 },
    { x: 0, y: 0 },
  ],
  // 1: left-blue
  [
    { x: 1400, y: 0 },
    { x: 1400, y: 1100 },
    { x: -900, y: 1100 },
    { x: -900, y: 300 },
    { x: 0, y: 300 },
    { x: 0, y: 0 },
  ],
  // 2: left-circle
  [
    { x: 1400, y: 900 },
    { x: 1400, y: 1050 },
    { x: -850, y: 1050 },
    { x: -850, y: 0 },
    { x: 0, y: 0 },
  ],
  // 3: middle-dark
  [
    { x: 0, y: -1000 },
    { x: 0, y: 0 },
  ],
  // 4: middle-blue
  [
    { x: 500, y: 1100 },
    { x: 500, y: 700 },
    { x: 0, y: 700 },
    { x: 0, y: 0 },
  ],
  // 5: middle-circle
  [
    { x: -600, y: 1100 },
    { x: -600, y: 500 },
    { x: 0, y: 500 },
    { x: 0, y: 0 },
  ],
  // 6: right-dark
  [
    { x: -1400, y: -900 },
    { x: -1400, y: -1100 },
    { x: 1200, y: -1100 },
    { x: 1200, y: 0 },
    { x: 0, y: 0 },
  ],
  // 7: right-blue
  [
    { x: -1400, y: 0 },
    { x: -1400, y: -1150 },
    { x: 1300, y: -1150 },
    { x: 1300, y: 300 },
    { x: 0, y: 300 },
    { x: 0, y: 0 },
  ],
  // 8: right-circle
  [
    { x: -1400, y: 900 },
    { x: -1400, y: 1150 },
    { x: 1200, y: 1150 },
    { x: 1200, y: 0 },
    { x: 0, y: 0 },
  ],
];

const ASSEMBLY_ORDER = [0, 2, 1, 3, 5, 4, 6, 8, 7];

// Animation timing
const ASSEMBLY_PIECE_DELAY = 1200;
const ASSEMBLY_DURATION = 1400;

// Get bounding box at a given offset
function getBoundsAtOffset(pieceIndex: number, offset: Point): BoundingBox {
  const base = PIECE_BOUNDS[pieceIndex];
  return {
    minX: base.minX + offset.x,
    maxX: base.maxX + offset.x,
    minY: base.minY + offset.y,
    maxY: base.maxY + offset.y,
  };
}

// Check if two bounding boxes overlap
function boxesOverlap(a: BoundingBox, b: BoundingBox): boolean {
  return !(a.maxX < b.minX || b.maxX < a.minX || a.maxY < b.minY || b.maxY < a.minY);
}

// Interpolate along a path
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

// Get piece position at a given time during assembly
function getPiecePosition(pieceIndex: number, assemblyTime: number): Point {
  const orderIndex = ASSEMBLY_ORDER.indexOf(pieceIndex);
  const pieceStartTime = orderIndex * ASSEMBLY_PIECE_DELAY;
  const pieceElapsed = assemblyTime - pieceStartTime;

  const path = PIECE_PATHS[pieceIndex];
  const scattered = path[0];

  if (pieceElapsed < 0) {
    // Not started yet - at scattered position
    return scattered;
  } else if (pieceElapsed < ASSEMBLY_DURATION) {
    // Moving along path
    const progress = pieceElapsed / ASSEMBLY_DURATION;
    return interpolatePath(path, progress);
  } else {
    // Assembled
    return { x: 0, y: 0 };
  }
}

// Check collisions at scattered positions
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
        errors.push(`  Piece ${i} bounds: [${Math.round(boundsI.minX)}, ${Math.round(boundsI.minY)}] to [${Math.round(boundsI.maxX)}, ${Math.round(boundsI.maxY)}]`);
        errors.push(`  Piece ${j} bounds: [${Math.round(boundsJ.minX)}, ${Math.round(boundsJ.minY)}] to [${Math.round(boundsJ.maxX)}, ${Math.round(boundsJ.maxY)}]`);
      }
    }
  }

  return errors;
}

// Check collisions during assembly animation
function checkAssemblyCollisions(): string[] {
  const errors: string[] = [];
  const totalAssemblyTime = 9 * ASSEMBLY_PIECE_DELAY + ASSEMBLY_DURATION;
  const timeStep = 50; // Check every 50ms

  for (let t = 0; t <= totalAssemblyTime; t += timeStep) {
    // Get all piece positions at this time
    const positions: Point[] = [];
    for (let i = 0; i < 9; i++) {
      positions.push(getPiecePosition(i, t));
    }

    // Check all pairs for collision
    for (let i = 0; i < 9; i++) {
      const boundsI = getBoundsAtOffset(i, positions[i]);

      for (let j = i + 1; j < 9; j++) {
        const boundsJ = getBoundsAtOffset(j, positions[j]);

        if (boxesOverlap(boundsI, boundsJ)) {
          // Only report first collision for each pair
          const key = `${i}-${j}`;
          if (!errors.some(e => e.includes(`Piece ${i}`) && e.includes(`Piece ${j}`))) {
            errors.push(`ASSEMBLY COLLISION at t=${t}ms: Piece ${i} overlaps Piece ${j}`);
            errors.push(`  Piece ${i} at offset (${Math.round(positions[i].x)}, ${Math.round(positions[i].y)})`);
            errors.push(`  Piece ${j} at offset (${Math.round(positions[j].x)}, ${Math.round(positions[j].y)})`);
          }
        }
      }
    }
  }

  return errors;
}

// Run all checks
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
