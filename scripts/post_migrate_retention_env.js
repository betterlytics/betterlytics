require("dotenv").config();

const { Client } = require("pg");

/**
 * One-shot carry-over of the retention a self-host instance enforced before per-dashboard retention
 * (v1.3.5 and earlier). The per-dashboard picker did nothing then; the events TTL from the retired
 * DATA_RETENTION_DAYS env var (default 1 year) was the real retention. Every dashboard is raised to
 * at least that, so the first retention purge deletes nothing v1.3.5 kept. A marker comment on
 * "DashboardSettings" makes it run once, so a retention set after the upgrade is not overridden.
 */

const DEFAULT_RETENTION_DAYS = 365;
const UNLIMITED_RETENTION_DAYS = -1;
// The presets above the default in DATA_RETENTION_PRESETS (dashboard/src/utils/settingsUtils.ts)
const LONGER_PRESETS = [730, 1095, 1825];
const MARKER_PREFIX = "retention_env_carried_over=";

// Mirrors v1.3.5's parse::<i32>(): -1 kept data forever, a positive value was a TTL in days, anything else was ignored
function resolveEffectiveDays(raw) {
  const value = (raw ?? "").trim();
  if (!/^[+-]?\d+$/.test(value)) return DEFAULT_RETENTION_DAYS;
  const days = Number(value);
  if (days === UNLIMITED_RETENTION_DAYS) return UNLIMITED_RETENTION_DAYS;
  if (days <= DEFAULT_RETENTION_DAYS) return DEFAULT_RETENTION_DAYS;
  return LONGER_PRESETS.find((preset) => preset >= days) ?? UNLIMITED_RETENTION_DAYS;
}

function carriedOverDays(storedDays, effectiveDays) {
  if (storedDays === UNLIMITED_RETENTION_DAYS || effectiveDays === UNLIMITED_RETENTION_DAYS) {
    return UNLIMITED_RETENTION_DAYS;
  }
  return Math.max(storedDays, effectiveDays);
}

async function main() {
  if (process.env.IS_CLOUD === "true") return;

  const raw = process.env.DATA_RETENTION_DAYS?.trim();
  const days = resolveEffectiveDays(raw);

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
    const { rows: settings } = await client.query(
      `SELECT "id", "dataRetentionDays" FROM "DashboardSettings" FOR UPDATE`,
    );
    const raisedIds = settings
      .filter((row) => carriedOverDays(row.dataRetentionDays, days) !== row.dataRetentionDays)
      .map((row) => row.id);
    if (raisedIds.length > 0) {
      await client.query(
        `UPDATE "DashboardSettings" SET "dataRetentionDays" = $1, "updatedAt" = CURRENT_TIMESTAMP
         WHERE "id" = ANY($2)`,
        [days, raisedIds],
      );
    }
    // COMMENT takes no bind parameters; days is an integer computed above
    await client.query(`COMMENT ON TABLE "DashboardSettings" IS '${MARKER_PREFIX}${days}'`);
    await client.query("COMMIT");
    const target = days === UNLIMITED_RETENTION_DAYS ? "Keep forever" : `${days} days`;
    const source = raw ? `DATA_RETENTION_DAYS=${raw}` : "DATA_RETENTION_DAYS unset";
    const hint = raw ? " DATA_RETENTION_DAYS has no further effect; remove it from .env." : "";
    console.log(
      `post_migrate_retention_env: ${source}, raised ${raisedIds.length} dashboard(s) to ${target}.${hint}`,
    );
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error(
      "post_migrate_retention_env: failed to carry the pre-upgrade retention over to dashboard retention:",
      // A refused connection is an AggregateError with an empty message, only its code says why
      (error instanceof Error && error.message) || String(error?.code ?? error),
    );
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

if (require.main === module) main();

module.exports = { resolveEffectiveDays, carriedOverDays };
