require("dotenv").config();

const { spawnSync } = require("node:child_process");

// Creates the pg-boss schema if missing and applies pending migrations; idempotent.
// The worker runs with `migrate: false`, so this is the only place the schema changes.
const databaseUrl = process.env.POSTGRES_URL;
if (!databaseUrl) {
  console.error("migrate_pgboss: POSTGRES_URL must be set in the environment.");
  process.exit(1);
}

const result = spawnSync(process.execPath, [require.resolve("pg-boss/dist/cli.js"), "migrate"], {
  stdio: "inherit",
  env: { ...process.env, PGBOSS_DATABASE_URL: databaseUrl },
});

process.exit(result.status ?? 1);
