require("dotenv").config();

const { createClient } = require("@clickhouse/client");

async function main() {
  const url = process.env.CLICKHOUSE_URL;
  const adminUser = process.env.CLICKHOUSE_USER;
  const adminPassword = process.env.CLICKHOUSE_PASSWORD;
  const workerUser = process.env.WORKER_CLICKHOUSE_WRITE_USER;
  const workerPassword = process.env.WORKER_CLICKHOUSE_WRITE_PASSWORD;

  if (!url || !adminUser || !adminPassword) {
    console.error(
      "Post-migration (clickhouse): CLICKHOUSE_URL, CLICKHOUSE_USER, and CLICKHOUSE_PASSWORD must be set.",
    );
    process.exit(1);
  }

  const client = createClient({
    url,
    username: adminUser,
    password: adminPassword,
  });

  try {
    await client.command({
      query: `GRANT dictGet ON analytics.* TO backend_role`,
    });
    await client.command({
      query: `GRANT SELECT ON system.dictionaries TO backend_role`,
    });
    await client.command({
      query: `GRANT SYSTEM RELOAD DICTIONARY ON *.* TO backend_role`,
    });
    await client.command({
      query: `GRANT dictGet ON analytics.* TO dashboard_role`,
    });

    // Full fallback chain of backend/src/config.rs replay_retention_days, including its
    // 365 default, so S3 lifecycle and ClickHouse TTL always agree on effective retention
    const retentionDays = parseInt(
      process.env.REPLAY_RETENTION_DAYS || process.env.DATA_RETENTION_DAYS || "365",
      10,
    );
    if (Number.isFinite(retentionDays) && retentionDays > 0) {
      await client.command({
        query: `ALTER TABLE analytics.session_replays MODIFY TTL date + INTERVAL ${retentionDays} DAY DELETE`,
      });
      await client.command({
        query: `ALTER TABLE analytics.session_replay_segments MODIFY TTL date + INTERVAL ${retentionDays} DAY DELETE`,
      });
    } else {
      // DATA_RETENTION_DAYS=-1 means keep indefinitely; the S3 lifecycle arm skips its
      // expiry rule for <= 0, so drop the DDL default TTL to keep the two stores agreeing
      await client.command({ query: `ALTER TABLE analytics.session_replays REMOVE TTL` });
      await client.command({ query: `ALTER TABLE analytics.session_replay_segments REMOVE TTL` });
    }

    if (!workerUser || !workerPassword) {
      console.log(
        "Post-migration (clickhouse): WORKER_CLICKHOUSE_WRITE_USER not set, skipping worker user creation.",
      );
      return;
    }

    await client.command({
      query: `CREATE USER IF NOT EXISTS ${workerUser} IDENTIFIED BY '${workerPassword.replace(/'/g, "\\'")}'`,
    });
    await client.command({
      query: `ALTER USER ${workerUser} IDENTIFIED BY '${workerPassword.replace(/'/g, "\\'")}'`,
    });
    await client.command({ query: `CREATE ROLE IF NOT EXISTS worker_role` });
    await client.command({
      query: `GRANT SELECT ON analytics.* TO worker_role`,
    });
    await client.command({
      query: `GRANT dictGet ON analytics.* TO worker_role`,
    });
    await client.command({
      query: `GRANT DELETE ON analytics.* TO worker_role`,
    });
    await client.command({
      query: `GRANT ALTER UPDATE ON analytics.* TO worker_role`,
    });
    await client.command({
      query: `GRANT ALTER DELETE ON analytics.* TO worker_role`,
    });
    await client.command({ query: `GRANT worker_role TO ${workerUser}` });

    console.log(
      "Post-migration (clickhouse): user and privileges ensured successfully.",
    );
  } catch (error) {
    console.error(
      "Post-migration (clickhouse): Failed:",
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
