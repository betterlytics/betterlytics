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

    const parseDays = (value) => {
      const days = parseInt(value ?? "", 10);
      return Number.isFinite(days) ? days : undefined;
    };
    const retentionDays = parseDays(process.env.REPLAY_RETENTION_DAYS) ?? 60;
    const replayTables = ["session_replays", "session_replay_segments"];
    const retentionMarker = `replay_retention_days=${retentionDays > 0 ? retentionDays : -1}`;
    for (const table of replayTables) {
      const result = await client.query({
        query: `SELECT comment, engine_full FROM system.tables WHERE database = 'analytics' AND name = '${table}'`,
        format: "JSONEachRow",
      });
      const rows = await result.json();
      if (rows[0]?.comment === retentionMarker) continue;

      const hasTtl = /\bTTL\b/.test(rows[0]?.engine_full ?? "");
      if (retentionDays > 0) {
        await client.command({
          query: `ALTER TABLE analytics.${table} MODIFY TTL date + INTERVAL ${retentionDays} DAY DELETE`,
        });
      } else if (hasTtl) {
        await client.command({ query: `ALTER TABLE analytics.${table} REMOVE TTL` });
      }
      await client.command({
        query: `ALTER TABLE analytics.${table} MODIFY COMMENT '${retentionMarker}'`,
      });
      console.log(
        `Post-migration (clickhouse): set analytics.${table} replay retention to ${retentionDays > 0 ? `${retentionDays} days` : "indefinite"}.`,
      );
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
