# Remove Per-Dashboard GeoLevel Setting — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the per-dashboard `geoLevel` setting so geography granularity is controlled solely by the `ENABLE_GEOLOCATION` / `ENABLE_GEOSUBDIVISION` environment variables.

**Architecture:** The per-dashboard `geoLevel` (stored in SiteConfig, exposed through SiteConfigProvider, consumed in pages/actions/filters) is replaced by a server-side env check. Server components and actions call `getEnabledGeoLevels()` which reads env vars synchronously. This eliminates ~15 files of schema/migration/provider/UI code.

**Tech Stack:** Next.js (server components + actions), Prisma, Rust backend, ClickHouse, Zod

---

## PR Review Comment Resolution Matrix

Each of the 29 review comments from flopper123 is mapped to how it's resolved.

### Resolved by this refactor

| # | File | Comment | Resolution |
|---|------|---------|------------|
| 3 | `processing/mod.rs` | Import at top of file | Inline `use crate::site_config::cache::GeoLevel` is removed entirely |
| 4 | `processing/mod.rs` | Country should always be included | No per-dashboard control; country is always populated when geo enabled |
| 5 | `site_config/cache.rs` | Use `matches!` macro | GeoLevel enum removed from cache entirely |
| 6 | `site_config/cache.rs` | Move to own crate | GeoLevel removed from cache entirely |
| 7 | `config.rs` | Move GeoLevel to separate crate | Per-dashboard GeoLevel removed; GeolocationMode stays in config (it IS config) |
| 8 | `main.rs` | Arc clone vs borrow for site config cache | EventProcessor no longer takes SiteConfigCache |
| 9 | `prisma/migrations/...` | Delete and remake migrations | Both geoLevel migrations deleted (no geoLevel in DB anymore) |
| 10 | `prisma/schema.prisma` | Store in lowercase | geoLevel field removed from schema entirely |
| 13 | `overview/page.tsx` | Eliminate `?? 'COUNTRY'` fallback | No geoLevel prop; env-based check in server component |
| 14 | `geography/page.tsx` | Same as #13 | Same |
| 15 | `geography/page.tsx` | Same as #13 | Same |
| 16 | `DataSettings.tsx` | Simplify settings pattern | Geography settings UI removed entirely |
| 20 | `geography.entities.ts` | `getAllowedGeoLevels` is business logic | Replaced with `getEnabledGeoLevels()` in a server-only helper (`lib/geoLevels.ts`) |
| 21 | `dashboardSettings.entities.ts` | Duplicate GeoLevel types | GeoLevelSetting removed; only ClickHouse-level GeoLevel type remains |

### Address during implementation

| # | File | Comment | Action |
|---|------|---------|--------|
| 1 | `geoip/mod.rs:172` | Does subdivision take the first correctly? | Add comment: MaxMind returns subdivisions ordered by admin level; first = primary (state/province) |
| 2 | `db/models.rs:91` | Should this be `city_code`? | No change needed. `city` is correct — cities have no standardized ISO codes unlike countries (3166-1) and subdivisions (3166-2). MaxMind returns plain city names. Add comment. |
| 11 | `GeographySection.tsx:50` | Incorrect `use()`, move to presenter | Partially addressed: level decision is now server-side. Full presenter extraction (moving label formatting server-side) is out of scope — would require reworking streaming pattern. Comment on PR explaining. |
| 12 | `overview/page.tsx:54` | Responsibility propagating to frontend | Addressed: page reads env var (synchronous, no DB query). Deciding which actions to call IS appropriate server component responsibility. |
| 17 | `geography.actions.ts:36` | Why 1000 limit? What is topKeys? | Add code comments explaining the pattern |
| 18 | `geography.actions.ts:40` | Type casting misplaced | Fix by tightening the `GeoVisitor` type or extracting a `GeoVisitorRow<L>` type from the repository |
| 19 | `QueryFilterInputRow.tsx:94` | Filtering is convoluted | Simplified: remove geoLevel-based filtering entirely. Always show all filter columns. |
| 22 | `filters.repository.ts:28` | What problem does NULL check solve? | Add comment: subdivision_code and city are `Nullable(String)` in ClickHouse; explicit NULL check prevents unexpected behavior |
| 23 | `countryCodes.ts:11` | Why was this changed? | Comment on PR: converted from async dynamic imports to sync static imports to fix race condition (async `registerLocales()` could complete after first lookup call) |
| 24 | `subdivisionCodes.ts:35` | City equivalent? | Comment on PR: cities have no standardized code-to-name mapping; MaxMind returns human-readable names directly |
| 25 | `geography.mdx:128` | Remove dashes | Line is in "Privacy: Minimum Visitor Threshold" section — entire section removed |
| 26 | `geography.mdx:134` | Out of date | Same section — removed |
| 27 | `self-hosting.mdx:195` | Careful with legal language | Remove GDPR/singling-out language from Privacy Considerations. Replace with neutral, factual note |
| 28 | `21_add_subdivision_and_city.sql:5` | LowCardinality? Combine ALTER TABLEs? | Combine into single ALTER TABLE. Keep LowCardinality (appropriate for both columns). Add explanatory comment |
| 29 | `21_add_subdivision_and_city.sql:17` | Why bloom_filter indexes? | Add comment explaining they speed up WHERE clause filtering. Remove MATERIALIZE INDEX (no-op on new empty columns) |

---

## File Map

### Files to fully revert to main (delete all branch changes)

| File | Reason |
|------|--------|
| `backend/src/site_config/cache.rs` | GeoLevel enum + geo_level field only existed for per-dashboard setting |
| `backend/src/site_config/mod.rs` | GeoLevel re-export only |
| `backend/src/site_config/repository.rs` | geo_level SQL column + struct field only |
| `backend/src/main.rs` | Only change was passing SiteConfigCache to EventProcessor |
| `dashboard/prisma/schema.prisma` | geoLevel column on SiteConfig |
| `dashboard/src/entities/dashboard/dashboardSettings.entities.ts` | GeoLevelSettingSchema only |
| `dashboard/src/entities/dashboard/siteConfig.entities.ts` | geoLevel field only |
| `dashboard/src/app/(protected)/dashboard/[dashboardId]/DashboardProvider.tsx` | SiteConfigProvider wrapping only |
| `dashboard/src/app/(protected)/dashboard/[dashboardId]/(settings)/settings/data/DataSettings.tsx` | Geography level UI only |
| `dashboard/src/app/(protected)/dashboard/[dashboardId]/(settings)/settings/data/page.tsx` | Rename only |

### Files to delete

| File | Reason |
|------|--------|
| `dashboard/prisma/migrations/20260308222238_add_geo_level/` | Migration for feature being removed |
| `dashboard/prisma/migrations/20260310120000_move_geo_level_to_site_config/` | Migration for feature being removed |
| `dashboard/src/contexts/SiteConfigProvider.tsx` | Only existed for geoLevel UI |

### Files to simplify (keep geo features, remove per-dashboard logic)

| File | What changes |
|------|-------------|
| `backend/src/processing/mod.rs` | Remove SiteConfigCache; assign all geo fields unconditionally |
| `dashboard/src/entities/analytics/geography.entities.ts` | Remove `getAllowedGeoLevels` + `GeoLevelSetting` import |
| `dashboard/src/app/actions/analytics/geography.actions.ts` | Replace getSiteConfig with env check |
| `dashboard/src/app/(protected)/.../overview/page.tsx` | Replace getSiteConfig with env check |
| `dashboard/src/app/(protected)/.../overview/GeographySection.tsx` | Remove geoLevel prop + OFF check |
| `dashboard/src/app/(protected)/.../geography/page.tsx` | Replace getSiteConfig with env check |
| `dashboard/src/app/(protected)/.../geography/GeographySection.tsx` | Remove geoLevel prop + OFF check |
| `dashboard/src/components/filters/QueryFilterInputRow.tsx` | Remove geoLevel-based filter visibility |

### New files

| File | Purpose |
|------|---------|
| `dashboard/src/lib/geoLevels.ts` | Server-only helper: `getEnabledGeoLevels()` reads env vars |

### Files unchanged by this refactor (keep branch changes as-is)

All backend files except the ones listed above, plus:
`geography.service.ts`, `geography.repository.ts`, `filters.repository.ts`, `filter.entities.ts`,
`countryCodes.ts`, `subdivisionCodes.ts`, `lib/env.ts`, `mcp/registry/filterColumns.ts`,
`package.json`, `.env.example`, `.env.production.example`, `.gitignore`, `CONTRIBUTING.md`,
`pnpm-lock.yaml`

---

## Chunk 1: Backend Cleanup

### Task 1: Revert site_config changes

**Files:**
- Revert: `backend/src/site_config/cache.rs`
- Revert: `backend/src/site_config/mod.rs`
- Revert: `backend/src/site_config/repository.rs`

- [ ] **Step 1: Revert cache.rs**

Remove the entire `GeoLevel` enum and its `impl` block (lines added by this branch).
Remove `geo_level: GeoLevel` from `SiteConfig` struct.
Remove `geo_level: GeoLevel::from_db_str(&record.geo_level)` from `From<SiteConfigRecord>` impl.

Run: `git diff main -- backend/src/site_config/cache.rs` to confirm what to revert.
Then: `git checkout main -- backend/src/site_config/cache.rs`

- [ ] **Step 2: Revert mod.rs**

Remove `GeoLevel` from the re-export line.

Run: `git checkout main -- backend/src/site_config/mod.rs`

- [ ] **Step 3: Revert repository.rs**

Remove `geo_level` from the SQL query, `SiteConfigRecord` struct, and `TryFrom<Row>` impl.

Run: `git checkout main -- backend/src/site_config/repository.rs`

---

### Task 2: Simplify processing/mod.rs

**Files:**
- Modify: `backend/src/processing/mod.rs`

The subdivision_code and city fields on `ProcessedEvent` STAY. The `SiteConfigCache` dependency and per-dashboard GeoLevel logic are REMOVED.

- [ ] **Step 1: Remove SiteConfigCache from EventProcessor**

Remove `use crate::site_config::SiteConfigCache;` import.
Remove `site_config_cache: Arc<SiteConfigCache>` from `EventProcessor` struct.
Revert `new()` to take only `geoip_service: GeoIpService` (remove `site_config_cache` param).
Revert the constructor body to `(Self { event_tx, geoip_service }, event_rx)`.

- [ ] **Step 2: Simplify get_geolocation()**

Replace the entire function body with:

```rust
async fn get_geolocation(&self, processed: &mut ProcessedEvent) -> Result<()> {
    debug!("Performing Geolocation lookup");
    let geo = self.geoip_service.lookup(&processed.event.ip_address);

    processed.country_code = geo.country_code;
    processed.subdivision_code = geo.subdivision_code;
    processed.city = geo.city;

    if processed.country_code.is_some() {
        debug!("Geolocation successful: country={:?}, subdivision={:?}, city={:?}",
            processed.country_code, processed.subdivision_code, processed.city);
    } else {
        debug!("Geolocation lookup returned no country code.");
    }
    Ok(())
}
```

Note: Keep `use std::sync::Arc;` at the top only if still needed by other code. Remove if unused.

---

### Task 3: Revert main.rs

**Files:**
- Revert: `backend/src/main.rs`

- [ ] **Step 1: Move EventProcessor creation back before SiteConfigCache**

Run: `git checkout main -- backend/src/main.rs`

Then re-apply the one legitimate change: `EventProcessor::new(geoip_service)` (without site_config_cache). Actually, since main.rs's only branch change was adding site_config_cache to EventProcessor, a full revert is correct.

Wait — verify: the branch also moved `EventProcessor::new` to after `SiteConfigCache` init. Reverting puts it back before. Since EventProcessor no longer needs SiteConfigCache, the original position is correct.

---

### Task 4: Address geoip review comments (#1, #2)

**Files:**
- Modify: `backend/src/geoip/mod.rs` (add comment)
- Modify: `backend/src/db/models.rs` (add comment)

- [ ] **Step 1: Add subdivision comment in geoip/mod.rs**

At the line where `.and_then(|subs| subs.first())` is called, add:

```rust
// MaxMind returns subdivisions ordered by administrative level
// (largest first). The first entry is the primary subdivision
// (state/province), which is what we want for ISO 3166-2.
```

- [ ] **Step 2: Add city naming comment in db/models.rs**

At the `city` field, add:

```rust
/// City name (not a code — cities lack standardized ISO codes
/// unlike countries and subdivisions)
pub city: Option<String>,
```

- [ ] **Step 3: Commit backend changes**

```
git add backend/
git commit -m "refactor: remove per-dashboard geoLevel from backend

The EventProcessor no longer reads per-dashboard geo settings from
SiteConfigCache. Geography granularity is now controlled entirely
by ENABLE_GEOLOCATION / ENABLE_GEOSUBDIVISION env vars, which
determine the GeolocationMode and what the GeoIpService returns."
```

---

## Chunk 2: Dashboard — All Frontend Changes (single commit to avoid broken intermediate state)

> **Note:** Tasks 5–15 are committed together to avoid broken intermediate states. Deleting
> SiteConfigProvider before its consumers are cleaned up would break the build. All consumer
> cleanup (pages, actions, filters) and provider deletion happen in the same commit.

### Task 5: Delete prisma migrations and revert schema

**Files:**
- Delete: `dashboard/prisma/migrations/20260308222238_add_geo_level/`
- Delete: `dashboard/prisma/migrations/20260310120000_move_geo_level_to_site_config/`
- Revert: `dashboard/prisma/schema.prisma`

> **Migration note:** These migrations have never been merged to main or deployed to any
> environment. Deleting them is safe — no "down" migration is needed. If a dev environment
> has run them locally, run `npx prisma migrate reset` to re-sync.

- [ ] **Step 1: Delete migration directories**

```bash
rm -rf dashboard/prisma/migrations/20260308222238_add_geo_level
rm -rf dashboard/prisma/migrations/20260310120000_move_geo_level_to_site_config
```

- [ ] **Step 2: Revert schema.prisma**

Remove the `geoLevel String @default("COUNTRY")` line from the `SiteConfig` model.

Run: `git checkout main -- dashboard/prisma/schema.prisma`

- [ ] **Step 3: Regenerate Prisma client**

```bash
cd dashboard && npx prisma generate
```

This ensures the TypeScript types from `@prisma/client` no longer include `geoLevel`.

---

### Task 6: Revert dashboard entities

**Files:**
- Revert: `dashboard/src/entities/dashboard/dashboardSettings.entities.ts`
- Revert: `dashboard/src/entities/dashboard/siteConfig.entities.ts`

- [ ] **Step 1: Revert dashboardSettings.entities.ts**

Remove `GEO_LEVEL_VALUES`, `GeoLevelSettingSchema`, `GeoLevelSetting` type.

Run: `git checkout main -- dashboard/src/entities/dashboard/dashboardSettings.entities.ts`

- [ ] **Step 2: Revert siteConfig.entities.ts**

Remove `geoLevel` from `DEFAULT_SITE_CONFIG_VALUES`, `SiteConfigSchema`, `SiteConfigUpdateSchema`. Remove `GeoLevelSettingSchema` import.

Run: `git checkout main -- dashboard/src/entities/dashboard/siteConfig.entities.ts`

---

### Task 7: Create server-only geo levels helper

**Files:**
- Create: `dashboard/src/lib/geoLevels.ts`

- [ ] **Step 1: Create the helper**

```typescript
import 'server-only';
import { env } from '@/lib/env';
import type { GeoLevel } from '@/entities/analytics/geography.entities';

/** Returns the geo levels enabled by server environment configuration */
export function getEnabledGeoLevels(): GeoLevel[] {
  if (!env.ENABLE_GEOLOCATION) return [];
  if (!env.ENABLE_GEOSUBDIVISION) return ['country_code'];
  return ['country_code', 'subdivision_code', 'city'];
}
```

---

### Task 8: Simplify geography.entities.ts

**Files:**
- Modify: `dashboard/src/entities/analytics/geography.entities.ts`

- [ ] **Step 1: Remove getAllowedGeoLevels and GeoLevelSetting import**

Remove:
```typescript
import type { GeoLevelSetting } from '@/entities/dashboard/dashboardSettings.entities';
```

Remove the entire `getAllowedGeoLevels` function.

Keep: `GEO_LEVELS`, `GeoLevelSchema`, `GeoLevel`, `GeoVisitorSchema`, `worldMapResponseSchema`, and other types.

---

### Task 9: Simplify geography.actions.ts

**Files:**
- Modify: `dashboard/src/app/actions/analytics/geography.actions.ts`

- [ ] **Step 1: Replace getSiteConfig with env-based check**

Remove imports:
```typescript
import { getAllowedGeoLevels } from '@/entities/analytics/geography.entities';
import { getSiteConfig } from '@/services/dashboard/siteConfig.service';
```

Add import:
```typescript
import { getEnabledGeoLevels } from '@/lib/geoLevels';
```

- [ ] **Step 2: Simplify fetchTopGeoVisits helper**

Replace the `getSiteConfig` + `getAllowedGeoLevels` logic with:

```typescript
async function fetchTopGeoVisits(
  ctx: AuthContext,
  query: BAAnalyticsQuery,
  level: GeoLevel,
  limit: number,
) {
  const enabledLevels = getEnabledGeoLevels();

  if (!enabledLevels.includes(level)) {
    return [];
  }

  const { main, compare } = toSiteQuery(ctx.siteId, query);

  const geoVisitors = await fetchVisitorsByGeoLevel(main, level, limit);

  // Extract primary keys from main results to filter comparison data,
  // ensuring comparison only includes rows present in the main result set
  const topKeys = geoVisitors.map((r) => r[level]);

  // Use high limit (1000) for comparison to capture all matching rows,
  // not just the top N — then filter to the main result's keys
  const compareGeoVisitors =
    compare &&
    (await fetchVisitorsByGeoLevel(compare, level, 1000)).filter((row) =>
      topKeys.includes(row[level]),
    );

  return toDataTable({
    data: geoVisitors as (GeoVisitor & Record<GeoLevel, string>)[],
    compare: compareGeoVisitors as (GeoVisitor & Record<GeoLevel, string>)[] | null | undefined,
    categoryKey: level,
  });
}
```

- [ ] **Step 3: Simplify getWorldMapDataAlpha2**

Replace the `getSiteConfig` + `getAllowedGeoLevels` logic with:

```typescript
const enabledLevels = getEnabledGeoLevels();

if (!enabledLevels.includes('country_code')) {
  return { visitorData: [], compareData: [], maxVisitors: 0 };
}
```

- [ ] **Step 4: Address review comment #18 (type casting)**

The `as (GeoVisitor & Record<GeoLevel, string>)[]` cast is needed because `GeoVisitor` has `subdivision_code` and `city` as optional, but when querying by a specific level, that level's value is guaranteed present. Investigate if `toDataTable` can be made generic, or if the repository can return a tighter type. If not straightforward, add a `// TODO: tighten GeoVisitor type per-level to eliminate this cast` comment.

---

### Task 10: Simplify overview page.tsx

**Files:**
- Modify: `dashboard/src/app/(protected)/dashboard/[dashboardId]/(dashboard)/(overview)/page.tsx`

- [ ] **Step 1: Replace getSiteConfig with env check**

Remove imports:
```typescript
import type { GeoLevel } from '@/entities/analytics/geography.entities';
import { getAllowedGeoLevels } from '@/entities/analytics/geography.entities';
import { getSiteConfig } from '@/services/dashboard/siteConfig.service';
```

Add import:
```typescript
import { getEnabledGeoLevels } from '@/lib/geoLevels';
```

- [ ] **Step 2: Replace geoLevel logic**

Replace:
```typescript
const siteConfig = await getSiteConfig(dashboardId);
const allowedLevels = getAllowedGeoLevels(siteConfig?.geoLevel ?? 'COUNTRY');
```

With:
```typescript
const enabledLevels = getEnabledGeoLevels();
```

Use `enabledLevels` everywhere `allowedLevels` was used.

- [ ] **Step 3: Conditionally render GeographySection**

Wrap in a condition so the geography section is hidden when geo is disabled:
```tsx
{enabledLevels.length > 0 && (
  <Suspense fallback={<TableSkeleton />}>
    <GeographySection worldMapPromise={worldMapPromise} topByGeoLevel={topByGeoLevel} />
  </Suspense>
)}
```

Remove `geoLevel` prop from GeographySection.

---

### Task 11: Simplify overview GeographySection.tsx

**Files:**
- Modify: `dashboard/src/app/(protected)/dashboard/[dashboardId]/(dashboard)/(overview)/GeographySection.tsx`

- [ ] **Step 1: Remove geoLevel-related code**

Remove imports:
```typescript
import { getAllowedGeoLevels, type GeoLevel } from '@/entities/analytics/geography.entities';
import type { GeoLevelSetting } from '@/entities/dashboard/dashboardSettings.entities';
```

Add import (GeoLevel + GEO_LEVELS still needed):
```typescript
import { GEO_LEVELS, type GeoLevel } from '@/entities/analytics/geography.entities';
```

- [ ] **Step 2: Remove geoLevel from props type**

Change:
```typescript
type GeographySectionProps = {
  worldMapPromise: ReturnType<typeof getWorldMapDataAlpha2>;
  topByGeoLevel: Partial<Record<GeoLevel, GeoTablePromise>>;
  geoLevel: GeoLevelSetting;
};
```

To:
```typescript
type GeographySectionProps = {
  worldMapPromise: ReturnType<typeof getWorldMapDataAlpha2>;
  topByGeoLevel: Partial<Record<GeoLevel, GeoTablePromise>>;
};
```

- [ ] **Step 3: Remove early return and getAllowedGeoLevels**

Remove:
```typescript
if (geoLevel === 'OFF') return null;
const allowedLevels = getAllowedGeoLevels(geoLevel);
```

- [ ] **Step 4: Iterate using GEO_LEVELS for stable ordering**

Replace:
```typescript
const geoLevelTabs = allowedLevels.map((level) => ({
  level,
  data: topByGeoLevel[level] ? use(topByGeoLevel[level]) : [],
}))
```

With (uses canonical GEO_LEVELS order instead of Object.keys for stability):
```typescript
const geoLevelTabs = GEO_LEVELS
  .filter((level) => level in topByGeoLevel)
  .map((level) => ({
    level,
    data: topByGeoLevel[level] ? use(topByGeoLevel[level]) : [],
  }))
```

The rest of the chain (`.map(({ level, data }) => ...)`) stays the same.

---

### Task 12: Simplify geography full page + section

**Files:**
- Modify: `dashboard/src/app/(protected)/dashboard/[dashboardId]/(dashboard)/geography/page.tsx`
- Modify: `dashboard/src/app/(protected)/dashboard/[dashboardId]/(dashboard)/geography/GeographySection.tsx`

- [ ] **Step 1: Simplify geography/page.tsx**

Remove:
```typescript
import { getSiteConfig } from '@/services/dashboard/siteConfig.service';
import { getAllowedGeoLevels } from '@/entities/analytics/geography.entities';
```

Add:
```typescript
import { getEnabledGeoLevels } from '@/lib/geoLevels';
```

Replace:
```typescript
const siteConfig = await getSiteConfig(dashboardId);
const allowedLevels = getAllowedGeoLevels(siteConfig?.geoLevel ?? 'COUNTRY');
```

With:
```typescript
const enabledLevels = getEnabledGeoLevels();
```

Remove `geoLevel` prop from `<GeographySection>`:
```tsx
<GeographySection worldMapPromise={worldMapPromise} />
```

- [ ] **Step 2: Simplify geography/GeographySection.tsx**

Remove `GeoLevelSetting` import and `geoLevel` from props type.
Remove the `if (geoLevel === 'OFF')` block with the disabled message.
The component just renders the map. When geo is disabled the map will have empty data (no visitors).

---

### Task 13: Simplify QueryFilterInputRow.tsx

**Files:**
- Modify: `dashboard/src/components/filters/QueryFilterInputRow.tsx`

- [ ] **Step 1: Remove geoLevel-based filter visibility**

Remove imports:
```typescript
import { useSiteConfig } from '@/contexts/SiteConfigProvider';
import { getAllowedGeoLevels } from '@/entities/analytics/geography.entities';
import type { GeoLevel } from '@/entities/analytics/geography.entities';
```

Remove from component body:
```typescript
const { siteConfig } = useSiteConfig();
const allowedGeoLevels = getAllowedGeoLevels(siteConfig?.geoLevel ?? 'COUNTRY');
```

Remove the `GEO_FILTER_COLUMNS` constant.

- [ ] **Step 2: Remove the filter callback**

Replace:
```typescript
{FILTER_COLUMN_SELECT_OPTIONS.filter((column) => {
  const geoLevel = GEO_FILTER_COLUMNS[column.value];
  return !geoLevel || allowedGeoLevels.includes(geoLevel);
}).map((column) => {
```

With:
```typescript
{FILTER_COLUMN_SELECT_OPTIONS.map((column) => {
```

All filter options (including subdivision_code and city) are always shown. When geo data isn't available, the filter search returns empty results. This is a simpler approach per reviewer #19.

---

### Task 14: Delete SiteConfigProvider, revert DashboardProvider, DataSettings, settings page

**Files:**
- Delete: `dashboard/src/contexts/SiteConfigProvider.tsx`
- Revert: `dashboard/src/app/(protected)/dashboard/[dashboardId]/DashboardProvider.tsx`
- Revert: `dashboard/src/app/(protected)/dashboard/[dashboardId]/(settings)/settings/data/DataSettings.tsx`
- Revert: `dashboard/src/app/(protected)/dashboard/[dashboardId]/(settings)/settings/data/page.tsx`

> **Important:** This task comes AFTER Tasks 9–13 which remove all consumers of
> `useSiteConfig`, `GeoLevelSetting`, and `getAllowedGeoLevels`. Deleting the
> provider before its consumers are cleaned up would break the build.

- [ ] **Step 1: Delete SiteConfigProvider.tsx**

```bash
rm dashboard/src/contexts/SiteConfigProvider.tsx
```

- [ ] **Step 2: Revert DashboardProvider.tsx**

```bash
git checkout main -- "dashboard/src/app/(protected)/dashboard/[dashboardId]/DashboardProvider.tsx"
```

- [ ] **Step 3: Revert DataSettings.tsx and page.tsx**

```bash
git checkout main -- "dashboard/src/app/(protected)/dashboard/[dashboardId]/(settings)/settings/data/DataSettings.tsx"
git checkout main -- "dashboard/src/app/(protected)/dashboard/[dashboardId]/(settings)/settings/data/page.tsx"
```

- [ ] **Step 4: Commit all Chunk 2 changes**

All of Tasks 5–14 are committed together as a single atomic commit:

```
git add dashboard/prisma/ dashboard/src/ dashboard/src/lib/geoLevels.ts
git commit -m "refactor: remove per-dashboard geoLevel from dashboard

Replace per-dashboard geoLevel setting with env-based getEnabledGeoLevels()
helper. Delete SiteConfigProvider, prisma migrations, GeoLevelSettingSchema.
Server components and actions now read ENABLE_GEOLOCATION/ENABLE_GEOSUBDIVISION
env vars directly. Simplify filter column visibility."
```

---

## Chunk 3: i18n, Documentation & ClickHouse

### Task 15: Clean up i18n files

**Files:**
- Modify: `dashboard/messages/en.json`
- Modify: `dashboard/messages/da.json`
- Modify: `dashboard/messages/it.json`
- Modify: `dashboard/messages/nb.json`

- [ ] **Step 1: Remove geoLevel settings keys from all 4 locale files**

Remove from `components.dashboardSettingsDialog.data`:
- `geographyTitle`
- `geoLevelLabel`
- `geoLevelHelp`
- `geoLevelOptions` (entire object with OFF/COUNTRY/REGION/CITY)

- [ ] **Step 2: Remove disabled geography message from all 4 locale files**

Remove from `components.geography`:
- `disabled`

Keep: `loading`, `visitors`, `regionLoadError`, `noData`

Keep: `dashboard.tabs.countries`, `regions`, `cities` (still used for overview tabs)
Keep: `components.filters.columns.subdivision_code`, `city` (still used in filter labels)

---

### Task 16: Update documentation

**Files:**
- Modify: `docs/src/content/dashboard/geography.mdx`
- Modify: `docs/src/content/installation/self-hosting.mdx`

- [ ] **Step 1: Remove "Privacy: Minimum Visitor Threshold" from geography.mdx**

Delete the entire section starting at "## Privacy: Minimum Visitor Threshold" through the Callout. This was from code already removed but the docs weren't updated. This also resolves review comments #25 and #26.

- [ ] **Step 2: Simplify self-hosting.mdx privacy section**

Replace the "Privacy Considerations" section with a brief, factual note:

```markdown
#### Privacy Note

City-level geolocation data, while useful for regional analysis, provides more granular location information about your visitors. Consider your privacy requirements and applicable regulations when enabling subdivision-level data. IP addresses are never stored — only the derived geographic data is kept.
```

This resolves review comment #27 (careful with legal language) by removing GDPR recital references and "singling out" language.

- [ ] **Step 3: Remove per-dashboard settings references from self-hosting.mdx**

Remove the sentence: "This setting is configurable per-dashboard in **Settings > Data > Privacy**."

---

### Task 17: Address ClickHouse migration review comments (#28, #29)

**Files:**
- Modify: `migrations/21_add_subdivision_and_city.sql`

- [ ] **Step 1: Combine ALTER TABLEs and add comments**

Rewrite the migration:

```sql
-- Add subdivision and city columns for granular geography data.
-- LowCardinality is appropriate: subdivision codes are a bounded set (~5K globally),
-- and city names, while more numerous, still benefit from dictionary encoding in
-- ClickHouse (effective up to ~10K unique values per partition).
ALTER TABLE analytics.events
    ADD COLUMN IF NOT EXISTS subdivision_code LowCardinality(Nullable(String)) AFTER country_code,
    ADD COLUMN IF NOT EXISTS city LowCardinality(Nullable(String)) AFTER subdivision_code;

-- Bloom filter indexes speed up point lookups in WHERE clauses (e.g. filtering
-- dashboard by a specific city or region). GRANULARITY 3 balances index size vs
-- filtering precision for these low-to-medium cardinality string columns.
ALTER TABLE analytics.events
    ADD INDEX IF NOT EXISTS subdivision_code_idx subdivision_code TYPE bloom_filter GRANULARITY 3,
    ADD INDEX IF NOT EXISTS city_idx city TYPE bloom_filter GRANULARITY 3;
```

Note: Removed `MATERIALIZE INDEX` statements — these are a no-op for newly added empty columns and only needed when adding indexes to columns with existing data.

- [ ] **Step 2: Add NULL check comment in filters.repository.ts**

At the `AND value IS NOT NULL` line in `dashboard/src/repositories/clickhouse/filters.repository.ts`, add:

```typescript
// subdivision_code and city are Nullable(String) in ClickHouse;
// explicit NULL check prevents these from appearing in filter suggestions
```

- [ ] **Step 3: Commit i18n, docs and migration cleanup**

```
git add dashboard/messages/ dashboard/src/repositories/ docs/ migrations/
git commit -m "chore: clean up i18n, docs, and ClickHouse migration

Remove per-dashboard geoLevel settings keys from all locale files.
Remove threshold docs section and simplify privacy language.
Combine ClickHouse ALTER TABLEs and add explanatory comments."
```

---

## Chunk 4: Build Verification

### Task 18: Build verification

- [ ] **Step 1: Run TypeScript check**

```bash
cd dashboard && npx tsc --noEmit
```

- [ ] **Step 2: Run linter**

```bash
cd dashboard && npx next lint
```

- [ ] **Step 3: Fix any errors**

If there are import errors (likely from removed files), fix them. Common issues:
- Stale imports of `GeoLevelSetting`, `getAllowedGeoLevels`, `SiteConfigProvider`, `useSiteConfig`
- Missing `getEnabledGeoLevels` import in files that were switched

- [ ] **Step 4: Run backend check (if Rust toolchain available)**

```bash
cd backend && cargo check
```

- [ ] **Step 5: Verify no remaining references to removed code**

Run:
```bash
grep -r "GeoLevelSetting\|getAllowedGeoLevels\|geoLevel\|SiteConfigProvider\|useSiteConfig\|geoMinThreshold" \
  dashboard/src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".next"
```

Expected: No matches (or only the `GeoLevel` type in geography.entities.ts and filter.entities.ts).

---

## PR Review Comment Responses

Draft responses to post on the PR for informational comments (questions that don't require code changes):

**#2 (city_code):** "No — `city` is correct. Countries have ISO 3166-1 codes and subdivisions have ISO 3166-2 codes, but cities don't have standardized codes. MaxMind returns plain city names (in English), so this is a name, not a code."

**#11 (use() in GeographySection):** "We've moved the level-selection logic server-side — the page now determines enabled levels via env vars and only passes promises for those levels. The client's `use()` calls are for unwrapping streamed promises within Suspense boundaries, which is the intended React pattern. Fully moving label formatting and icon rendering to a server presenter would require reworking the streaming architecture — deferring that to a follow-up."

**#12 (responsibility propagating to frontend):** "Addressed — the page now reads env vars synchronously (no DB query) to decide which actions to call. This is appropriate server component responsibility."

**#17 (1000 limit / topKeys):** "The pattern ensures comparison data aligns with the main result. `topKeys` extracts category values from the main query (e.g. top 10 cities). We then query comparison data with a high limit (1000) and filter to only those keys, so comparison percentages are shown only for rows in the main result. Added code comments."

**#22 (NULL filter check):** "`subdivision_code` and `city` are `Nullable(String)` in ClickHouse. Without the explicit NULL check, these could surface in filter suggestions. Added a comment."

**#23 (countryCodes change):** "Converted from async dynamic imports to sync static imports. The previous `registerLocales()` was async at module load time — a race condition where lookups could execute before registration completed."

**#24 (cities equivalent):** "Not needed. Countries have ISO 3166-1 and subdivisions have ISO 3166-2/CLDR for code-to-name mapping, but cities are plain names from MaxMind — already human-readable."

**#28 (LowCardinality / combine ALTERs):** "Combined into a single ALTER TABLE. Kept LowCardinality — it's appropriate for both columns (subdivision: ~5K unique globally, city: benefits from dictionary encoding up to ~10K unique values per partition)."

**#29 (bloom_filter indexes):** "These speed up WHERE clause filtering when users filter their dashboard by city or region. Added explanatory comments. Removed MATERIALIZE INDEX since the columns are new and empty."
