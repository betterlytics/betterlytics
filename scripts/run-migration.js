if (process.env.SECRET_BASE && !process.env.SALTS_DATABASE_URL) {
  // SECRET_BASE only exists on selfhost deployments; SALTS_DATABASE_URL is
  // derived by an up-to-date selfhost entrypoint. This combination means an
  // outdated betterlytics-selfhost checkout is driving a newer image.
  console.error(
    "Your betterlytics-selfhost checkout is outdated for this image.\n" +
      "Run 'git pull' in your betterlytics-selfhost directory, then 'docker compose up -d' again.\n" +
      "No migrations have been run."
  );
  process.exit(1);
}

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const { execSync } = require("child_process");

const url = process.env.CLICKHOUSE_URL;
const db = process.env.CLICKHOUSE_DB;
const user = process.env.CLICKHOUSE_USER;
const password = process.env.CLICKHOUSE_PASSWORD;

if (!url || !db) {
  console.error(
    "Error: CLICKHOUSE_URL and CLICKHOUSE_DB must be set in .env file"
  );
  process.exit(1);
}

const command = `clickhouse-migrations migrate --host=${url} --db=${db} --migrations-home=./migrations --user=${user} --password=${password} --timeout=600000`;

try {
  execSync(command, { stdio: "inherit" });
} catch (error) {
  console.error("Migration failed:", error.message);
  process.exit(1);
}
