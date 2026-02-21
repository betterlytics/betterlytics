require("dotenv").config();

const { Client } = require("pg");

async function main() {
  const databaseUrl = process.env.POSTGRES_URL;
  const siteConfigRoPassword =
    process.env.POSTGRES_SITECONFIG_RO_PASSWORD ||
    process.env.POSTGRES_PASSWORD;

  if (!databaseUrl) {
    console.error(
      "Post-migration (siteconfig_ro): POSTGRES_URL must be set in the environment."
    );
    process.exit(1);
  }

  if (!siteConfigRoPassword) {
    console.error(
      "Post-migration (siteconfig_ro): SITECONFIG_RO_PASSWORD or POSTGRES_PASSWORD must be set in the environment."
    );
    process.exit(1);
  }

  let dbName;
  try {
    const url = new URL(databaseUrl);
    dbName = url.pathname.replace(/^\//, "").split("/")[0];
  } catch (error) {
    console.error(
      "Post-migration (siteconfig_ro): Failed to parse POSTGRES_URL:",
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }

  if (!dbName) {
    console.error(
      "Post-migration (siteconfig_ro): Could not determine database name from POSTGRES_URL."
    );
    process.exit(1);
  }

  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    await client.connect();

    const roleCheck = await client.query(
      "SELECT 1 FROM pg_roles WHERE rolname = 'siteconfig_ro'"
    );

    const escapedPassword = siteConfigRoPassword.replace(/'/g, "''");

    if (roleCheck.rowCount === 0) {
      await client.query(
        `CREATE ROLE siteconfig_ro LOGIN PASSWORD '${escapedPassword}'`
      );
    } else {
      await client.query(
        `ALTER ROLE siteconfig_ro WITH PASSWORD '${escapedPassword}'`
      );
    }

    const escapedDbName = dbName.replace(/"/g, '""');
    await client.query(
      `GRANT CONNECT ON DATABASE "${escapedDbName}" TO siteconfig_ro;`
    );
    await client.query(`GRANT USAGE ON SCHEMA public TO siteconfig_ro;`);

    await client.query(`GRANT SELECT ON TABLE "SiteConfig" TO siteconfig_ro;`);
    await client.query(`GRANT SELECT ON TABLE "Dashboard" TO siteconfig_ro;`);
    await client.query(`GRANT SELECT ON TABLE "DashboardIntegration" TO siteconfig_ro;`);

    console.log(
      "Post-migration (siteconfig_ro): role and privileges ensured successfully."
    );
  } catch (error) {
    console.error(
      "Post-migration (siteconfig_ro): Failed to apply role/privileges:",
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  } finally {
    try {
      await client.end();
    } catch {}
  }
}

main();
