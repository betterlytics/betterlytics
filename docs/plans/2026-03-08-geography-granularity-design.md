# Geography Granularity Per-Dashboard Setting

## Overview

Add a per-dashboard geography granularity level setting that controls what location data is collected and displayed. Replaces the current global-only approach with per-dashboard control while keeping global env vars as an infrastructure ceiling.

## New Setting: Geography Level

**Options:** `OFF | COUNTRY | REGION | CITY` (default: `COUNTRY`)

- **Off** — No geography data collected or shown
- **Country** — Country-level only (`country_code`)
- **Region** — Country + subdivision (`country_code` + `subdivision_code`)
- **City** — All three fields (`country_code` + `subdivision_code` + `city`)

**Constraints:**
- Cannot exceed the global infrastructure ceiling (determined by `ENABLE_GEOLOCATION` / `ENABLE_GEOSUBDIVISION` env vars and which MaxMind DB is available)
- Default `COUNTRY` for all dashboards (existing and new)
## Data Model

Add `geoLevel` field to `DashboardSettings` (Prisma):

```prisma
model DashboardSettings {
  // ... existing fields ...
  geoLevel String @default("COUNTRY") // OFF, COUNTRY, REGION, CITY
}
```

No ClickHouse schema changes — `country_code`, `subdivision_code`, and `city` columns already exist.

## Backend — Ingestion-Time Filtering

The setting is enforced at data ingestion time, not just query time. The backend conditionally extracts geo fields based on the dashboard's `geoLevel`.

### Existing Infrastructure

The backend already has a `SiteConfigCache` (`backend/src/site_config/`) that:
- Reads per-dashboard config from PostgreSQL (`SiteConfig` table joined with `Dashboard`)
- Caches in-memory via `ArcSwap<HashMap<site_id, SiteConfig>>`
- Auto-refreshes: partial every 30s, full every 3min
- Used during event validation (`validate_site_policies` in `validation/mod.rs`)

### Changes Required

**1. Extend `SiteConfigRepository` SQL query** (`backend/src/site_config/repository.rs`)

Current query joins `SiteConfig` with `Dashboard`. Extend to LEFT JOIN `DashboardSettings`:

```sql
SELECT
    d."siteId" AS site_id,
    d."domain" AS domain,
    sc."blacklistedIps" AS blacklisted_ips,
    sc."enforceDomain" AS enforce_domain,
    COALESCE(ds."geoLevel", 'COUNTRY') AS geo_level,
    sc."updatedAt" AS updated_at
FROM "SiteConfig" sc
INNER JOIN "Dashboard" d ON d."id" = sc."dashboardId"
LEFT JOIN "DashboardSettings" ds ON ds."dashboardId" = d."id"
```

Note: `updatedAt` tracking needs to consider both `sc."updatedAt"` and `ds."updatedAt"` for partial refresh to detect changes. Use `GREATEST(sc."updatedAt", COALESCE(ds."updatedAt", sc."updatedAt"))`.

**2. Extend cache structs**

`SiteConfigRecord` and `SiteConfig` (`backend/src/site_config/cache.rs`):
```rust
pub struct SiteConfig {
    pub domain: String,
    pub blacklisted_ips: Vec<String>,
    pub enforce_domain: bool,
    pub geo_level: GeoLevel, // new field
}
```

New enum (can live in `config.rs` or `site_config/`):
```rust
pub enum GeoLevel {
    Off,
    Country,
    Region,
    City,
}
```

**3. Conditional geo extraction** (`backend/src/processing/mod.rs`)

`EventProcessor` needs access to `SiteConfigCache`. In `get_geolocation()`:

```rust
async fn get_geolocation(&self, processed: &mut ProcessedEvent) -> Result<()> {
    let geo_level = self.site_config_cache
        .get(&processed.site_id)
        .map(|cfg| cfg.geo_level)
        .unwrap_or(GeoLevel::Country); // default if no config found

    if geo_level == GeoLevel::Off {
        return Ok(()); // skip lookup entirely
    }

    let geo = self.geoip_service.lookup(&processed.event.ip_address);

    processed.country_code = geo.country_code;

    if geo_level >= GeoLevel::Region {
        processed.subdivision_code = geo.subdivision_code;
    }
    if geo_level == GeoLevel::City {
        processed.city = geo.city;
    }

    Ok(())
}
```

**4. Global ceiling enforcement**

The global `GeolocationMode` (from env vars) remains as the infrastructure ceiling. If the server only has the Country DB (`GeolocationMode::Countries`), the `GeoIpService` already only returns `country_code` — no code change needed for this constraint. The frontend must also be aware of the ceiling to disable unavailable options in the selector.

### Files to Modify (Backend)

| File | Change |
|------|--------|
| `backend/src/site_config/repository.rs` | Extend SQL to LEFT JOIN `DashboardSettings`, add `geo_level` to `SiteConfigRecord` |
| `backend/src/site_config/cache.rs` | Add `geo_level: GeoLevel` to `SiteConfig` struct |
| `backend/src/config.rs` | Add `GeoLevel` enum (or new module) |
| `backend/src/processing/mod.rs` | Add `SiteConfigCache` to `EventProcessor`, conditional extraction in `get_geolocation()` |
| `backend/src/main.rs` or `backend/src/lib.rs` | Wire `SiteConfigCache` into `EventProcessor` constructor |

## Frontend — Settings UI

New "Track Geography Data" section in `DataSettings.tsx`:

```
+-- Track Geography Data -------------------------+
|                                                  |
|  Geography Level                                 |
|  [Country               v]                       |
|  Controls what location data is collected.        |
|                                                  |
+-------------------------------------------------+
```

- Options above the global ceiling are disabled with tooltip
- Immediate save on change (same pattern as existing settings)
- Link to docs privacy section for informed decision-making

## Frontend — Conditional Tab Rendering

Geography overview (`GeographySection.tsx`) and full geography page:

| geoLevel | Visible Tabs |
|----------|-------------|
| OFF | Geography section hidden (empty state linking to settings — deferred) |
| COUNTRY | Map + Countries |
| REGION | Map + Countries + Regions |
| CITY | Map + Countries + Regions + Cities |

Geography server actions skip queries for levels above the setting.

## Frontend — Types & Schemas

Update `dashboardSettings.entities.ts`:
- Add `GeoLevel` enum: `z.enum(['OFF', 'COUNTRY', 'REGION', 'CITY'])`
- Add `geoLevel` to `DashboardSettingsSchema`, `DashboardSettingsCreateSchema`, `DashboardSettingsUpdateSchema`

## Documentation

Update user docs with a geography privacy section:
- Explain the four granularity levels and what each collects
- GDPR implications of location data granularity
- Note: last 3 digits of IP are not processed/stored
- Reference iOS App Tracking Transparency and Google Play Data Safety section (location precision level declaration)
- Help users choose the right level for their compliance needs

The settings UI links directly to this docs section.

## Deferred Work

- **Deletion prompt**: When user lowers granularity (e.g., City -> Country), prompt to delete existing granular data from ClickHouse
- **Empty state**: Geography section shows "tracking disabled" message with link to settings when geoLevel is OFF
- **Global ceiling API**: Expose the server's max capability to the frontend so the selector can disable unavailable options (may need a lightweight API or build-time env injection)

## Files Changed (Full List)

### Backend (Rust)
- `backend/src/site_config/repository.rs`
- `backend/src/site_config/cache.rs`
- `backend/src/config.rs`
- `backend/src/processing/mod.rs`
- `backend/src/main.rs` or `backend/src/lib.rs`

### Dashboard (TypeScript/React)
- `dashboard/prisma/schema.prisma` + migration
- `dashboard/src/entities/dashboard/dashboardSettings.entities.ts`
- `dashboard/src/app/(protected)/dashboard/[dashboardId]/(settings)/settings/data/DataSettings.tsx`
- `dashboard/src/app/(protected)/dashboard/[dashboardId]/(dashboard)/(overview)/GeographySection.tsx`
- `dashboard/src/app/(protected)/dashboard/[dashboardId]/(dashboard)/geography/` (full page)
- `dashboard/src/app/actions/analytics/geography.actions.ts`
- `dashboard/src/contexts/SettingsProvider.tsx` (if needed)
- i18n files (`en.json`, `da.json`, etc.)

### Documentation
- User docs: geography privacy section
