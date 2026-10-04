require("dotenv").config();

const { Client } = require("pg");

/**
 * One-shot carry-over of the retired DATA_RETENTION_DAYS env var (self-host, v1.3.5 and earlier)
 * to dashboards still at the 1 year default. A marker comment on "DashboardSettings" makes it
 * run once, so an owner who later sets a dashboard back to 1 year is not overridden.
 */

const DEFAULT_RETENTION_DAYS = 365;
const UNLIMITED_RETENTION_DAYS = -1;
// The presets above the default in DATA_RETENTION_PRESETS (dashboard/src/utils/settingsUtils.ts)
const LONGER_PRESETS = [730, 1095, 1825];
const MARKER_PREFIX = "retention_env_carried_over=";

// Mirrors v1.3.5's parse::<i32>(): -1 kept data forever, a positive value was a TTL in days, anything else was ignored
function resolveCarryOverDays(raw) {
  const value = raw.trim();
  if (!/^[+-]?\d+$/.test(value)) return null;
  const days = Number(value);
  if (days === UNLIMITED_RETENTION_DAYS) return UNLIMITED_RETENTION_DAYS;
  if (days <= DEFAULT_RETENTION_DAYS) return null;
  return LONGER_PRESETS.find((preset) => preset >= days) ?? UNLIMITED_RETENTION_DAYS;
}

async function main() {
  if (process.env.IS_CLOUD === "true") return;

  const raw = process.env.DATA_RETENTION_DAYS;
  if (!raw || !raw.trim()) return;

  const days = resolveCarryOverDays(raw);
  if (days === null) {
    console.log(
      `post_migrate_retention_env: DATA_RETENTION_DAYS=${raw.trim()} keeps no more than the 1 year default, nothing to carry over.`,
    );
    return;
  }

  const databaseUrl = process.env.POSTGRES_URL;
  if (!databaseUrl) {
    console.error("post_migrate_retention_env: POSTGRES_URL must be set in the environment.");
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  try {
    await client.connect();
    await client.query("BEGIN");
    const { rows } = await client.query(
      `SELECT obj_description('"DashboardSettings"'::regclass, 'pg_class') AS marker`,
    );
    if (rows[0]?.marker?.startsWith(MARKER_PREFIX)) {
      await client.query("ROLLBACK");
      console.log(`post_migrate_retention_env: already carried over (${rows[0].marker}), skipping.`);
      return;
    }
    const result = await client.query(
      `UPDATE "DashboardSettings" SET "dataRetentionDays" = $1, "updatedAt" = CURRENT_TIMESTAMP
       WHERE "dataRetentionDays" = $2`,
      [days, DEFAULT_RETENTION_DAYS],
    );
    // COMMENT takes no bind parameters; days is an integer computed above
    await client.query(`COMMENT ON TABLE "DashboardSettings" IS '${MARKER_PREFIX}${days}'`);
    await client.query("COMMIT");
    const target = days === UNLIMITED_RETENTION_DAYS ? "Keep forever" : `${days} days`;
    console.log(
      `post_migrate_retention_env: DATA_RETENTION_DAYS=${raw.trim()}, moved ${result.rowCount} dashboard(s) from 1 year to ${target}. DATA_RETENTION_DAYS has no further effect; remove it from .env.`,
    );
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error(
      "post_migrate_retention_env: failed to carry DATA_RETENTION_DAYS over to dashboard retention. Fix the error, or unset DATA_RETENTION_DAYS to skip:",
      // A refused connection is an AggregateError with an empty message, only its code says why
      (error instanceof Error && error.message) || String(error?.code ?? error),
    );
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

main();
