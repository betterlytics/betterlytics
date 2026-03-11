# Geography Granularity Per-Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a per-dashboard geography granularity level setting (Off/Country/Region/City) that controls what geo data is collected and shown.

**Architecture:** New `geoLevel` field on `DashboardSettings` (Prisma). Backend reads it via existing `SiteConfigCache` to conditionally extract geo fields at ingestion. Frontend renders geography tabs and queries based on the setting. Global env vars remain as infrastructure ceiling.

**Tech Stack:** Prisma (PostgreSQL), Zod, Next.js (React Server Components + Server Actions), Rust (backend event pipeline), next-intl (i18n)

---

### Task 1: Prisma Schema — Add `geoLevel` Field

**Files:**
- Modify: `dashboard/prisma/schema.prisma:276` (DashboardSettings model)

**Step 1: Add field to schema**

In `DashboardSettings` model, add:

```prisma
  // Geography Settings
  geoLevel          String  @default("COUNTRY") // OFF, COUNTRY, REGION, CITY
```

**Step 2: Generate migration**

Run: `cd dashboard && npx prisma migrate dev --name add_geo_level`

Expected: New migration file in `dashboard/prisma/migrations/` with `ALTER TABLE "DashboardSettings" ADD COLUMN "geoLevel" TEXT NOT NULL DEFAULT 'COUNTRY'`

**Step 3: Generate Prisma client**

Run: `cd dashboard && npx prisma generate`

**Step 4: Commit**

```
feat: Add geoLevel field to DashboardSettings schema
```

---

### Task 2: Dashboard Entities — Add GeoLevel to Settings Types

**Files:**
- Modify: `dashboard/src/entities/dashboard/dashboardSettings.entities.ts`

**Step 1: Add the GeoLevel enum and update schemas**

Add at top (after imports):

```typescript
export const GEO_LEVEL_VALUES = ['OFF', 'COUNTRY', 'REGION', 'CITY'] as const;
export const GeoLevelSettingSchema = z.enum(GEO_LEVEL_VALUES);
export type GeoLevelSetting = z.infer<typeof GeoLevelSettingSchema>;
```

Add `geoLevel: GeoLevelSettingSchema` to:
- `DashboardSettingsSchema` (after alertsThreshold)
- `DashboardSettingsCreateSchema` (same position)
- `DashboardSettingsUpdateSchema` (as `GeoLevelSettingSchema.optional()`)
- `DEFAULT_DASHBOARD_SETTINGS` (value: `'COUNTRY'`)

**Step 2: Verify TypeScript compiles**

Run: `cd dashboard && npx tsc --noEmit`

**Step 3: Commit**

```
feat: Add GeoLevel setting type to dashboard entities
```

---

### Task 3: Frontend — Settings UI (Geography Section)

**Files:**
- Modify: `dashboard/src/app/(protected)/dashboard/[dashboardId]/(settings)/settings/data/DataSettings.tsx`
- Modify: `dashboard/messages/en.json` (i18n keys)
- Modify: `dashboard/messages/da.json`
- Modify: `dashboard/messages/nb.json`
- Modify: `dashboard/messages/it.json`

**Step 1: Add i18n keys to `en.json`**

Under `components.dashboardSettingsDialog.data`, add:

```json
"geographyTitle": "Track Geography Data",
"geoLevelLabel": "Geography Level",
"geoLevelHelp": "Controls what location data is collected and shown. Higher levels include all lower levels.",
"geoLevelOptions": {
  "OFF": "Off",
  "COUNTRY": "Country",
  "REGION": "Region",
  "CITY": "City"
},
"geoLevelDocsLink": "Learn about geography levels and privacy"
```

Add equivalent translations to `da.json`, `nb.json`, `it.json`.

**Step 2: Update `DataSettings.tsx`**

Replace the standalone geo threshold `SettingsSection` with a new "Track Geography Data" section containing the level selector.

```tsx
// New state
const [geoLevel, setGeoLevel] = useState<string>(settings.geoLevel);

// New handler
const saveGeoLevel = (newLevel: string) => {
  if (newLevel === settings.geoLevel) return;
  const previousLevel = geoLevel;
  setGeoLevel(newLevel);

  startTransition(async () => {
    try {
      await updateDashboardSettingsAction(dashboardId, { geoLevel: newLevel as GeoLevelSetting });
      await refreshSettings();
      toast.success(t('toastSuccess'));
    } catch {
      setGeoLevel(previousLevel);
      toast.error(t('toastError'));
    }
  });
};

```

Replace the `geoThresholdTitle` SettingsSection with the geography level selector inside a new `SettingsSection`.

**Step 3: Verify it renders**

Run: `cd dashboard && npm run dev` — navigate to dashboard settings > data tab, verify the new geography section renders.

**Step 4: Commit**

```
feat: Add geography level selector to dashboard settings UI
```

---

### Task 4: Frontend — Geography Actions Respect `geoLevel`

**Files:**
- Modify: `dashboard/src/app/actions/analytics/geography.actions.ts`
- Modify: `dashboard/src/entities/analytics/geography.entities.ts`

**Step 1: Add helper to map setting to allowed ClickHouse levels**

In `geography.entities.ts`, add:

```typescript
import { GeoLevelSetting } from '@/entities/dashboard/dashboardSettings.entities';

/** Maps a dashboard geoLevel setting to the ClickHouse geo levels it permits */
export function getAllowedGeoLevels(geoLevel: GeoLevelSetting): GeoLevel[] {
  switch (geoLevel) {
    case 'OFF': return [];
    case 'COUNTRY': return ['country_code'];
    case 'REGION': return ['country_code', 'subdivision_code'];
    case 'CITY': return ['country_code', 'subdivision_code', 'city'];
  }
}
```

**Step 2: Update geography actions to check geoLevel**

In `geography.actions.ts`, update `fetchTopGeoVisits`:

```typescript
import { getAllowedGeoLevels } from '@/entities/analytics/geography.entities';

async function fetchTopGeoVisits(
  ctx: AuthContext,
  query: BAAnalyticsQuery,
  level: GeoLevel,
  limit: number,
) {
  const settings = await getDashboardSettings(ctx.dashboardId);
  const allowedLevels = getAllowedGeoLevels(settings.geoLevel as GeoLevelSetting);

  if (!allowedLevels.includes(level)) {
    return [];
  }

  const { main, compare } = toSiteQuery(ctx.siteId, query);
  // ... rest unchanged
}
```

Update `getWorldMapDataAlpha2` similarly:

```typescript
export const getWorldMapDataAlpha2 = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery): Promise<WorldMapResponse> => {
    const settings = await getDashboardSettings(ctx.dashboardId);
    const allowedLevels = getAllowedGeoLevels(settings.geoLevel as GeoLevelSetting);

    if (!allowedLevels.includes('country_code')) {
      return { visitorData: [], compareData: [], maxVisitors: 0 };
    }

    // ... existing try/catch
  },
);
```

**Step 3: Verify TypeScript compiles**

Run: `cd dashboard && npx tsc --noEmit`

**Step 4: Commit**

```
feat: Gate geography queries behind dashboard geoLevel setting
```

---

### Task 5: Frontend — Overview Page Conditional Tab Rendering

**Files:**
- Modify: `dashboard/src/app/(protected)/dashboard/[dashboardId]/(dashboard)/(overview)/page.tsx`
- Modify: `dashboard/src/app/(protected)/dashboard/[dashboardId]/(dashboard)/(overview)/GeographySection.tsx`

**Step 1: Update overview page to pass geoLevel**

In `page.tsx`, replace the hardcoded `topByGeoLevel` with setting-aware logic. Import `getDashboardSettings` and use server-side settings fetch:

```typescript
import { getDashboardSettings } from '@/services/dashboard/dashboardSettings.service';
import { getAllowedGeoLevels } from '@/entities/analytics/geography.entities';
import type { GeoLevelSetting } from '@/entities/dashboard/dashboardSettings.entities';

// Inside DashboardPage, before the JSX:
const settings = await getDashboardSettings(dashboardId);
const allowedLevels = getAllowedGeoLevels(settings.geoLevel as GeoLevelSetting);

const worldMapPromise = allowedLevels.includes('country_code')
  ? getWorldMapDataAlpha2(dashboardId, query)
  : Promise.resolve({ visitorData: [], compareData: [], maxVisitors: 0 });

const topByGeoLevel: Partial<Record<GeoLevel, ReturnType<typeof getTopGeoVisitsAction>>> = {};
for (const level of allowedLevels) {
  topByGeoLevel[level] = getTopGeoVisitsAction(dashboardId, query, level);
}
```

Remove the `env.ENABLE_GEOLOCATION` / `env.ENABLE_GEOSUBDIVISION` checks that currently gate the geography calls — this is now controlled by per-dashboard `geoLevel`.

Pass `geoLevel` to `GeographySection`:

```tsx
<GeographySection
  worldMapPromise={worldMapPromise}
  topByGeoLevel={topByGeoLevel}
  geoLevel={settings.geoLevel as GeoLevelSetting}
/>
```

**Step 2: Update `GeographySection` to conditionally render tabs**

Add `geoLevel` to props:

```typescript
import { getAllowedGeoLevels, type GeoLevel } from '@/entities/analytics/geography.entities';
import type { GeoLevelSetting } from '@/entities/dashboard/dashboardSettings.entities';

type GeographySectionProps = {
  worldMapPromise: ReturnType<typeof getWorldMapDataAlpha2>;
  topByGeoLevel: Partial<Record<GeoLevel, GeoTablePromise>>;
  geoLevel: GeoLevelSetting;
};
```

Filter `geoLevelTabs` to only allowed levels:

```typescript
const allowedLevels = getAllowedGeoLevels(geoLevel);

const geoLevelTabs = allowedLevels.map((level) => ({
  level,
  data: topByGeoLevel[level] ? use(topByGeoLevel[level]) : [],
})).map(({ level, data }) => ({
  // ... same mapping as before
}));
```

If `geoLevel === 'OFF'`, render nothing (or a placeholder — deferred):

```typescript
if (geoLevel === 'OFF') return null;
```

**Step 3: Verify it renders correctly**

Test with different `geoLevel` values by changing the setting in the UI. Verify tabs appear/disappear correctly.

**Step 4: Commit**

```
feat: Render geography tabs conditionally based on geoLevel setting
```

---

### Task 6: Backend — Extend SiteConfigCache with `geo_level`

**Files:**
- Modify: `backend/src/site_config/repository.rs`
- Modify: `backend/src/site_config/cache.rs`

**Step 1: Add `GeoLevel` enum**

In `cache.rs`, add:

```rust
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum GeoLevel {
    Off,
    Country,
    Region,
    City,
}

impl GeoLevel {
    pub fn from_str(s: &str) -> Self {
        match s {
            "OFF" => GeoLevel::Off,
            "REGION" => GeoLevel::Region,
            "CITY" => GeoLevel::City,
            _ => GeoLevel::Country, // default
        }
    }

    pub fn includes_country(self) -> bool {
        self != GeoLevel::Off
    }

    pub fn includes_subdivision(self) -> bool {
        matches!(self, GeoLevel::Region | GeoLevel::City)
    }

    pub fn includes_city(self) -> bool {
        self == GeoLevel::City
    }
}
```

Add field to `SiteConfig`:

```rust
pub struct SiteConfig {
    pub domain: String,
    pub blacklisted_ips: Vec<String>,
    pub enforce_domain: bool,
    pub geo_level: GeoLevel, // new
}
```

Update the `From<SiteConfigRecord>` impl:

```rust
impl From<SiteConfigRecord> for SiteConfig {
    fn from(record: SiteConfigRecord) -> Self {
        Self {
            domain: record.domain,
            blacklisted_ips: record.blacklisted_ips,
            enforce_domain: record.enforce_domain,
            geo_level: GeoLevel::from_str(&record.geo_level),
        }
    }
}
```

**Step 2: Extend SQL query in `repository.rs`**

Add `geo_level` to `SiteConfigRecord`:

```rust
pub struct SiteConfigRecord {
    pub site_id: String,
    pub domain: String,
    pub blacklisted_ips: Vec<String>,
    pub enforce_domain: bool,
    pub geo_level: String, // new
    pub updated_at: DateTime<Utc>,
}
```

Update `BASE_SELECT`:

```sql
SELECT
    d."siteId" AS site_id,
    d."domain" AS domain,
    sc."blacklistedIps" AS blacklisted_ips,
    sc."enforceDomain" AS enforce_domain,
    COALESCE(ds."geoLevel", 'COUNTRY') AS geo_level,
    GREATEST(sc."updatedAt", COALESCE(ds."updatedAt", sc."updatedAt")) AS updated_at
FROM "SiteConfig" sc
INNER JOIN "Dashboard" d ON d."id" = sc."dashboardId"
LEFT JOIN "DashboardSettings" ds ON ds."dashboardId" = d."id"
```

Update `TryFrom<Row>` to parse `geo_level`:

```rust
geo_level: row.try_get::<_, String>("geo_level")
    .unwrap_or_else(|_| "COUNTRY".to_string()),
```

**Step 3: Verify it compiles**

Run: `cd backend && cargo check`

**Step 4: Commit**

```
feat: Extend SiteConfigCache with per-dashboard geo_level
```

---

### Task 7: Backend — Conditional Geo Extraction in Event Processing

**Files:**
- Modify: `backend/src/processing/mod.rs`
- Modify: `backend/src/main.rs` or `backend/src/lib.rs` (wire SiteConfigCache into EventProcessor)

**Step 1: Add `SiteConfigCache` to `EventProcessor`**

```rust
use crate::site_config::SiteConfigCache;
use std::sync::Arc;

pub struct EventProcessor {
    event_tx: mpsc::Sender<ProcessedEvent>,
    geoip_service: GeoIpService,
    site_config_cache: Arc<SiteConfigCache>, // new
}

impl EventProcessor {
    pub fn new(
        geoip_service: GeoIpService,
        site_config_cache: Arc<SiteConfigCache>,
    ) -> (Self, mpsc::Receiver<ProcessedEvent>) {
        let (event_tx, event_rx) = mpsc::channel(100_000);
        (Self { event_tx, geoip_service, site_config_cache }, event_rx)
    }
}
```

**Step 2: Update `get_geolocation` to respect `geo_level`**

```rust
async fn get_geolocation(&self, processed: &mut ProcessedEvent) -> Result<()> {
    let geo_level = self.site_config_cache
        .get(&processed.site_id)
        .map(|cfg| cfg.geo_level)
        .unwrap_or(GeoLevel::Country);

    if geo_level == GeoLevel::Off {
        debug!("Geolocation disabled for site {}", processed.site_id);
        return Ok(());
    }

    debug!("Performing Geolocation lookup (level: {:?})", geo_level);
    let geo = self.geoip_service.lookup(&processed.event.ip_address);

    if geo_level.includes_country() {
        processed.country_code = geo.country_code;
    }
    if geo_level.includes_subdivision() {
        processed.subdivision_code = geo.subdivision_code;
    }
    if geo_level.includes_city() {
        processed.city = geo.city;
    }

    if processed.country_code.is_some() {
        debug!("Geolocation successful: country={:?}, subdivision={:?}, city={:?}",
            processed.country_code, processed.subdivision_code, processed.city);
    } else {
        debug!("Geolocation lookup returned no country code.");
    }
    Ok(())
}
```

**Step 3: Update `EventProcessor::new()` call site**

Find where `EventProcessor::new(geoip_service)` is called (likely `main.rs` or `lib.rs`) and pass the `site_config_cache`:

```rust
let (event_processor, event_rx) = EventProcessor::new(geoip_service, site_config_cache.clone());
```

**Step 4: Verify it compiles**

Run: `cd backend && cargo check`

**Step 5: Commit**

```
feat: Conditionally extract geo fields based on per-dashboard geoLevel
```

---

### Task 8: i18n — Add Translations for All Locales

**Files:**
- Modify: `dashboard/messages/da.json`
- Modify: `dashboard/messages/nb.json`
- Modify: `dashboard/messages/it.json`

**Step 1: Add translations**

For each locale, add the same keys as the English version under `components.dashboardSettingsDialog.data`:

**Danish (`da.json`):**
```json
"geographyTitle": "Spor geografidata",
"geoLevelLabel": "Geografisk niveau",
"geoLevelHelp": "Kontrollerer, hvilke lokationsdata der indsamles og vises. Højere niveauer inkluderer alle lavere niveauer.",
"geoLevelOptions": {
  "OFF": "Fra",
  "COUNTRY": "Land",
  "REGION": "Region",
  "CITY": "By"
},
"geoLevelDocsLink": "Læs om geografiniveauer og privatliv"
```

**Norwegian (`nb.json`):**
```json
"geographyTitle": "Spor geografidata",
"geoLevelLabel": "Geografisk nivå",
"geoLevelHelp": "Kontrollerer hvilke stedsdata som samles inn og vises. Høyere nivåer inkluderer alle lavere nivåer.",
"geoLevelOptions": {
  "OFF": "Av",
  "COUNTRY": "Land",
  "REGION": "Region",
  "CITY": "By"
},
"geoLevelDocsLink": "Les om geografinivåer og personvern"
```

**Italian (`it.json`):**
```json
"geographyTitle": "Traccia dati geografici",
"geoLevelLabel": "Livello geografico",
"geoLevelHelp": "Controlla quali dati di posizione vengono raccolti e mostrati. I livelli superiori includono tutti i livelli inferiori.",
"geoLevelOptions": {
  "OFF": "Disattivato",
  "COUNTRY": "Paese",
  "REGION": "Regione",
  "CITY": "Città"
},
"geoLevelDocsLink": "Scopri i livelli geografici e la privacy"
```

Remove the old `geoThresholdTitle` key from all locales (it's replaced by `geographyTitle`).

**Step 2: Verify no missing keys**

Run: `cd dashboard && npm run dev` — check for i18n warnings in console.

**Step 3: Commit**

```
feat: Add geography level translations for all locales
```

---

### Task 9: Documentation — Geography Privacy Section

**Files:**
- Identify and modify the user-facing docs file that covers geography/settings (check `docs/` directory)

**Step 1: Write privacy section**

Cover:
- The four granularity levels and what data each collects
- GDPR context: location data is personal data under GDPR; lower granularity = lower compliance burden
- IP handling: last 3 digits are not processed or stored
- Reference iOS App Tracking Transparency (ATT) — when declaring location data, the granularity maps to Apple's "coarse" vs "precise" location
- Reference Google Play Data Safety — location data precision level declaration
- Recommendation: use the lowest granularity that meets your analytics needs

**Step 2: Add link from settings UI**

The `geoLevelDocsLink` i18n key should link to this section. Add an `<a>` tag in the settings UI pointing to the docs URL.

**Step 3: Commit**

```
docs: Add geography granularity privacy section
```

---

## Execution Order Summary

| Task | Description | Depends On |
|------|-------------|-----------|
| 1 | Prisma schema migration | — |
| 2 | Dashboard entities/types | Task 1 |
| 3 | Settings UI (level selector) | Task 2 |
| 4 | Geography actions respect geoLevel | Task 2 |
| 5 | Overview page conditional tabs | Task 4 |
| 6 | Backend SiteConfigCache extension | Task 1 |
| 7 | Backend conditional geo extraction | Task 6 |
| 8 | i18n translations | Task 3 |
| 9 | Documentation | — |

**Parallelizable:** Tasks 3+4 can run in parallel. Tasks 6+7 (backend) can run in parallel with 3+4+5 (frontend). Task 8 can run with Task 5. Task 9 is independent.
