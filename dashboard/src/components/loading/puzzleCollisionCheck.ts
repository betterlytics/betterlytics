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

// Current piece paths from the animation - synced from AnimatedDashboardLogoPuzzle.tsx v9
// KEY: Highways at ±2500, parking at x=±1900 (staggered y), approach from ±500-800
const PIECE_PATHS: Point[][] = [
  // === LEFT COLUMN: travel via BOTTOM highway ===
  // Approach from BELOW - direct slide up from highway
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
  // Approach from above, then slide LEFT into place (from x=1200 offset)
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

// Assembly order: right-blue & right-circle first (direct path through clear middle), then others
const ASSEMBLY_ORDER = [
  7, 8,     // Right column openers: blue, circle (direct through clear middle)
  0, 2, 1,  // Left column: dark, circle, blue
  3, 5, 4,  // Middle column: dark, circle, blue
  6,        // Right column finale: dark
];

// Animation timing - slight overlap but mostly sequential
const ASSEMBLY_PIECE_DELAY = 1000;
const ASSEMBLY_DURATION = 1600;

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

// Check if a piece is at or very near its final assembled position
function isAtFinalPosition(pos: Point): boolean {
  const threshold = 200; // Within 200 units of final position (pieces are large, ~400-800px)
  return Math.abs(pos.x) < threshold && Math.abs(pos.y) < threshold;
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
          // Skip collision if BOTH pieces are at their final assembled position
          // (pieces naturally touch when assembled - that's expected)
          if (isAtFinalPosition(positions[i]) && isAtFinalPosition(positions[j])) {
            continue;
          }

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
