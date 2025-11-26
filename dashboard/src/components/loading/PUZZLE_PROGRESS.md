# Puzzle Animation Progress

## Goal
Create a 2D puzzle animation where 9 logo pieces:
1. SCATTER from center outward (like dropping puzzle pieces from a bag)
2. ASSEMBLE back together by sliding on the "floor" (NO OVERLAPS EVER)

## Critical Rule
**Pieces must NEVER overlap after landing on the floor** - not during scatter, not during assembly.

## Current State
- File: `AnimatedDashboardLogoPuzzle.tsx`
- Collision checker: `puzzleCollisionCheck.ts` (run with `npx ts-node puzzleCollisionCheck.ts`)

## The 9 Pieces (indices)
```
Left column:    0=left-dark, 1=left-blue, 2=left-circle
Middle column:  3=middle-dark, 4=middle-blue, 5=middle-circle
Right column:   6=right-dark, 7=right-blue, 8=right-circle
```

## Assembly Order
`[0, 2, 1, 3, 5, 4, 6, 8, 7]` - Column by column: dark → circle → blue

## Current Scattered Layout (needs validation)
```
  (-1600, -1400)    (0, -1400)     (1600, -1400)
       6                3               0

  (-1800, 200)      [CENTER]       (1800, 200)
       7            (LOGO)              1

  (-1600, 1500)   (-600,600)(600)  (1600, 1500)
       8              5    4            2
```

## What Works
- Animation framework with waypoint paths
- Two-phase animation (scatter then assemble)
- Collision detection script that checks bounding box overlaps
- Near-sequential timing (1200ms delay, 1400ms duration per piece)

## What Needs Fixing
1. **Scattered positions** may still overlap (need to run checker with new positions)
2. **Assembly paths** - some paths cross other pieces during movement
3. **Near-final collisions** - checker flags pieces sliding into adjacent slots (may be ok)

## Next Steps
1. Update `puzzleCollisionCheck.ts` with new PIECE_PATHS coordinates
2. Run collision check: `npx ts-node puzzleCollisionCheck.ts`
3. Fix any scattered position overlaps (increase spacing)
4. Fix any path collisions (reroute around obstacles)
5. Iterate until 0 collisions
6. Visual test at http://localhost:3000/en/test-logo

## Key Insight
Pieces are LARGE (~400x800px). Need ~1600px spacing between scattered positions.
Paths must go around the OUTSIDE (use corridors at y=-1600, y=1700, x=-1800, x=1800).

## Timing Constants
```typescript
SCATTER_DURATION = 1800ms   // spread out from center
SCATTER_HOLD = 600ms        // pause on floor
ASSEMBLY_PIECE_DELAY = 1200ms // between pieces starting
ASSEMBLY_DURATION = 1400ms  // each piece's journey
ASSEMBLED_HOLD = 2000ms     // show completed logo
```
