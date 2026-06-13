require("dotenv").config();

const { Client } = require("pg");

/**
 * Declarative provisioning for the Postgres roles the analytics backend uses.
 *
 * This manifest is the single source of truth for which role may touch which table.
 */
const ROLES = [
  {
    name: "siteconfig_ro",
    passwordEnv: "POSTGRES_SITECONFIG_RO_PASSWORD",
    // Read-only: the backend's site-config cache.
    grants: {
      SiteConfig: ["SELECT"],
      Dashboard: ["SELECT"],
      DashboardIntegration: ["SELECT"],
    },
  },
  {
    name: "monitoring_ro",
    passwordEnv: "POSTGRES_MONITORING_RO_PASSWORD",
    // Read-only: uptime monitor configuration.
    grants: {
      MonitorCheck: ["SELECT"],
      Dashboard: ["SELECT"],
    },
  },
  {
    name: "salts_rw",
    passwordEnv: "POSTGRES_SALTS_RW_PASSWORD",
    // Read-write: secret fingerprint salts.
    grants: {
      AnalyticsSalt: ["SELECT", "INSERT", "DELETE"],
    },
  },
];

// Postgres has no parameter binding for identifiers or for DDL like CREATE ROLE, so the
// few dynamic values are quoted by hand.
function quoteIdent(name) {
  return `"${String(name).replace(/"/g, '""')}"`;
}

function quoteLiteral(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

async function provisionRole(client, dbName, role) {
  const password = process.env[role.passwordEnv];
  if (!password) {
    throw new Error(
      `${role.passwordEnv} must be set for role '${role.name}' (no fallback to POSTGRES_PASSWORD).`
    );
  }

  const roleIdent = quoteIdent(role.name);

  await client.query("BEGIN");
  try {
    const exists = await client.query(
      "SELECT 1 FROM pg_roles WHERE rolname = $1",
      [role.name]
    );

    if (exists.rowCount === 0) {
      await client.query(
        `CREATE ROLE ${roleIdent} LOGIN PASSWORD ${quoteLiteral(password)}`
      );
    } else {
      await client.query(
        `ALTER ROLE ${roleIdent} WITH LOGIN PASSWORD ${quoteLiteral(password)}`
      );
    }

    await client.query(
      `GRANT CONNECT ON DATABASE ${quoteIdent(dbName)} TO ${roleIdent}`
    );
    await client.query(`GRANT USAGE ON SCHEMA public TO ${roleIdent}`);

    await client.query(
      `REVOKE ALL ON ALL TABLES IN SCHEMA public FROM ${roleIdent}`
    );
    for (const [table, privileges] of Object.entries(role.grants)) {
      await client.query(
        `GRANT ${privileges.join(", ")} ON TABLE ${quoteIdent(table)} TO ${roleIdent}`
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }

  const summary = Object.entries(role.grants)
    .map(([table, privileges]) => `${table}(${privileges.join("/")})`)
    .join(", ");
    
  console.log(`provision_roles: '${role.name}' -> ${summary}`);
}

async function main() {
  const databaseUrl = process.env.POSTGRES_URL;
  if (!databaseUrl) {
    console.error("provision_roles: POSTGRES_URL must be set in the environment.");
    process.exit(1);
  }

  let dbName;
  try {
    const url = new URL(databaseUrl);
    dbName = url.pathname.replace(/^\//, "").split("/")[0];
  } catch (error) {
    console.error(
      "provision_roles: Failed to parse POSTGRES_URL:",
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }

  if (!dbName) {
    console.error(
      "provision_roles: Could not determine database name from POSTGRES_URL."
    );
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  let hadError = false;

  try {
    await client.connect();
    for (const role of ROLES) {
      try {
        await provisionRole(client, dbName, role);
      } catch (error) {
        hadError = true;
        console.error(
          `provision_roles: failed for role '${role.name}':`,
          error instanceof Error ? error.message : String(error)
        );
      }
    }
  } catch (error) {
    console.error(
      "provision_roles: fatal error:",
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  } finally {
    try {
      await client.end();
    } catch {}
  }

  if (hadError) {
    process.exit(1);
  }
  console.log("provision_roles: all roles provisioned successfully.");
}

main();
