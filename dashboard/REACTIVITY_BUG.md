1 + # Comparison Filter Reactivity Bug - Investigation Notes
2 +
3 + ## Issue
4 + When toggling comparison modes (off/previous/year/custom), the map tooltips don't update without a

- page refresh. Other components on the same dashboard page (TopCountries, charts) update correctly.
  5 +
  6 + ## What We Know
  7 + 1. **Data is fetched correctly** - Refresh shows correct data
  8 + 2. **URL updates properly** - Added `compare` parameter always included
- (filterSearchParams.ts:78-81)
  9 + 3. **Other components work** - TopCountries table updates immediately on same page
  10 + 4. **Same data source** - Both map and TopCountries use the same promises in GeographySection
  11 +
  12 + ## Where to Look
  13 +
  14 + ### 1. GeoJSON Component Key (MapCountryGeoJSON.tsx:124)
  15 + **Current:** `key={`${visitorData.length}-${locale}`}`
  16 + **Problem:** Key doesn't include comparison state, so component doesn't remount when comparison
- changes
  17 +
  18 + **Try:**
  19 + ```typescript
  20 + const geoJsonKey =
- `${visitorData.length}-${timeRangeCtx.compareMode}-${timeRangeCtx.compareStartDate?.getTime() ??
- 'none'}-${timeRangeCtx.compareEndDate?.getTime() ?? 'none'}-${locale}`;
21 +  ```
22 +
23 +  ### 2. Comparison Data Detection (MapCountryGeoJSON.tsx:55)
24 +  **Current:** `compareVisitors: compareData.length === 0 ? undefined : (compareVisitor?.visitors ??
- 0)`25 +  **Problem:** Checking array length instead of actual comparison mode
26 +
27 +  **Try:**
28 +  ```typescript
29 +  compareVisitors: timeRangeCtx.compareMode === 'off' ? undefined : (compareVisitor?.visitors ?? 0)
30 +  ```
31 +
32 +  ### 3. useCallback Dependencies (MapCountryGeoJSON.tsx:119)
33 +  **Current:**`[size, style, visitorData, compareData, locale, t, timeRangeCtx, setMapSelection]`34 +  **Check:** timeRangeCtx might not be triggering re-creation of callback
35 +  - Is timeRangeCtx reference stable?
36 +  - Does timeRangeCtx.compareMode change cause the callback to recreate?
37 +
38 +  ### 4. Data Flow Investigation
39 +  - Check if compareData array is actually changing when toggling
40 +  - Add console.logs in MapCountryGeoJSON to see:
41 +    - When component renders
42 +    - When onEachFeature runs
43 +    - What compareData contains
44 +    - What timeRangeCtx.compareMode is
45 +
46 +  ## Why TopCountries Works but Map Doesn't
47 +  TopCountries likely:
48 +  - Renders based on data props directly (no layer caching)
49 +  - Uses different key strategy
50 +  - Doesn't have memoized callbacks creating layers
51 +
52 +  Map has:
53 +  - Leaflet layers that persist across renders
54 +  - onEachFeature callback that creates layers once
55 +  - Layers don't automatically update when data changes
56 +
57 +  ## Attempted Fixes (Reverted)
58 +  1. Added compareMode to GeoJSON key - didn't work
59 +  2. Changed comparison detection to use timeRangeCtx.compareMode - didn't work
60 +
61 +  ## Next Steps
62 +  1. Add debug logging to understand render cycle
63 +  2. Verify timeRangeCtx is actually updating
64 +  3. Consider forcing GeoJSON remount with better key strategy
65 +  4. May need to manually update layers instead of relying on remount
66 +
67 +  ## Related Files
68 +  -`dashboard/src/components/map/MapCountryGeoJSON.tsx`- Main issue location
69 +  -`dashboard/src/utils/filterSearchParams.ts`- URL parameter handling
70 +  -`dashboard/src/contexts/TimeRangeContextProvider.tsx`- Comparison mode state
71 +  -`dashboard/src/app/(protected)/dashboard/[dashboardId]/(dashboard)/GeographySection.tsx` - Data
- flow
