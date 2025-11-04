## Timeseries bugs

  * ✅ FIXED: Map is reset to timeseries whenever a filter is changed (accumulate doenst persist) or page is refreshed

  * If there is NO data at all, it shows colors as black (not even localhost)

## Code Review Issues (Critical → Nice-to-have)

### Critical

  * **Empty data edge case in maxVisitors calculation** (`toGeoTimeseries.ts:33-34`)
    - `Math.max(...[])` returns `-Infinity` when arrays are empty
    - This breaks color scale calculations when there's zero data
    - Should default to `1` or handle empty case explicitly
    - Likely causes the "black colors" bug above

  * **usePlayback position clipping missing** (`use-playback.ts`)
    - No effect to clamp `position` when `frameCount` changes
    - If on frame 10 with 20 frames, switching to accumulated (1 frame) tries to access `frames[10]`
    - Causes potential array out-of-bounds errors
    - Should add: `useEffect(() => setPosition(prev => Math.min(prev, Math.max(0, frameCount - 1))), [frameCount])`

### High Priority

  * **Color scale edge cases** (`use-deckgl-mapstyle.ts`)
    - Domain `[0, 1, maxVisitors]` breaks when maxVisitors is 0 or -Infinity
    - No handling for maxVisitors <= 1 case
    - Should use `Math.max(1, maxVisitors)` to ensure valid domain

  * **Type safety: colorUpdateTrigger is `any`** (`use-countries-layer.ts:19`)
    - Should be typed as `unknown` or specific type like `[number, boolean]`
    - Makes it harder to catch bugs at compile time

### Medium Priority

  * **frameAtToggleTimeseries state management** (`MapTimeseries.tsx:109-114`)
    - Logic for preserving frame position when toggling is confusing
    - Variable name doesn't explain what it stores (previous frame before toggle)
    - Consider renaming to `previousViewFrame` or refactoring approach

  * **Missing error boundaries**
    - DeckGL components have no error boundaries
    - If map fails to render, entire page crashes
    - Should add error boundary in GeographyTimeseriesSection

  * **Compare data filtering inconsistency** (`geography.ts:165-174`)
    - Compare data is filtered to only show countries in primary dataset
    - But accumulated compare is calculated from filtered data
    - This could show misleading percentages if compare period has different countries
    - Document this behavior or rethink approach

### Low Priority / Polish

  * **TODO comment in useEffect** (`use-deckgl-with-compare.ts:104`)
    - "TODO: update hovered here"
    - Should implement or remove

  * **Magic numbers in MapPlayActionbar** (`MapPlayActionbar.tsx:45-46`)
    - `PADDING_BOTTOM_PX = 64` and `PADDING_TOP_PX = 16`
    - Should be constants or theme variables

  * **Duplicate geojson accumulation logic** (`geography.ts:148-155, 183-190`)
    - Same reduce pattern repeated twice
    - Extract to helper function `accumulateByCountry()`

  * **Hardcoded localhost string** (`toGeoTimeseries.ts:84`)
    - `cur.country_code !== 'Localhost'` should be constant
    - Could break if backend changes casing or format

  * **Style prop in DeckGLMap is inline object** (`DeckGLMap.tsx:83`)
    - `style={{ position: 'fixed' }}` recreates object on every render
    - Should be memoized or moved outside component

### Questions / Clarifications Needed

  * **Why use `useBARouter` instead of Next.js router?**
    - Is there specific functionality needed? Document the reason

  * **Is the `stop()` method in usePlayback used?**
    - Only defines stop but doesn't expose it in return
    - Either expose or remove

  * **Why filter compare countries to primary set?**
    - In `geography.ts:174` - is this intentional UX decision or optimization?
    - Should be documented if intentional

