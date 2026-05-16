if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

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
    await client.exec({
      query: `GRANT dictGet ON analytics.* TO backend_role`,
    });
    await client.exec({
      query: `GRANT SELECT ON system.dictionaries TO backend_role`,
    });
    await client.exec({
      query: `GRANT SYSTEM RELOAD DICTIONARY ON *.* TO backend_role`,
    });
    await client.exec({
      query: `GRANT dictGet ON analytics.* TO dashboard_role`,
    });

    if (!workerUser || !workerPassword) {
      console.log(
        "Post-migration (clickhouse): WORKER_CLICKHOUSE_WRITE_USER not set, skipping worker user creation.",
      );
      return;
    }

    await client.exec({
      query: `CREATE USER IF NOT EXISTS ${workerUser} IDENTIFIED BY '${workerPassword.replace(/'/g, "\\'")}'`,
    });
    await client.exec({
      query: `ALTER USER ${workerUser} IDENTIFIED BY '${workerPassword.replace(/'/g, "\\'")}'`,
    });
    await client.exec({ query: `CREATE ROLE IF NOT EXISTS worker_role` });
    await client.exec({ query: `GRANT SELECT ON analytics.* TO worker_role` });
    await client.exec({ query: `GRANT dictGet ON analytics.* TO worker_role` });
    await client.exec({ query: `GRANT DELETE ON analytics.* TO worker_role` });
    await client.exec({
      query: `GRANT ALTER UPDATE ON analytics.* TO worker_role`,
    });
    await client.exec({
      query: `GRANT ALTER DELETE ON analytics.* TO worker_role`,
    });
    await client.exec({ query: `GRANT worker_role TO ${workerUser}` });

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
