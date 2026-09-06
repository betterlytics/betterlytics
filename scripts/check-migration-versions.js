#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Mirrors how clickhouse-migrations derives a version from a file name, since that
// is what ends up as the primary key in the _migrations table.
function parseVersion(file) {
  return Number(file.split("_")[0]);
}

function main() {
  const repoRoot = path.resolve(__dirname, "..");
  const migrationsDir = path.join(repoRoot, "migrations");

  if (!fs.existsSync(migrationsDir)) {
    console.error("Migrations directory not found:", migrationsDir);
    process.exit(1);
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.error("No .sql migrations found in:", migrationsDir);
    process.exit(1);
  }

  const byVersion = new Map();
  const unparseable = [];

  for (const file of files) {
    const version = parseVersion(file);
    if (!Number.isInteger(version) || version <= 0) {
      unparseable.push(file);
      continue;
    }
    const existing = byVersion.get(version);
    if (existing) {
      existing.push(file);
    } else {
      byVersion.set(version, [file]);
    }
  }

  let failed = false;

  if (unparseable.length > 0) {
    failed = true;
    console.error(
      `\n${unparseable.length} migration file(s) do not start with a positive version number:`
    );
    for (const file of unparseable) console.error(`  - migrations/${file}`);
    console.error(
      "Migrations must be named <version>_<description>.sql, for example 40_add_widget.sql."
    );
  }

  const duplicates = [...byVersion.entries()]
    .filter(([, group]) => group.length > 1)
    .sort(([a], [b]) => a - b);

  for (const [version, group] of duplicates) {
    failed = true;
    console.error(`\nDuplicate migration version ${version}:`);
    for (const file of group) console.error(`  - migrations/${file}`);
  }

  if (failed) {
    if (duplicates.length > 0) {
      console.error(
        "\nThe migration runner keys applied migrations by version alone, so two files sharing" +
          "\na version make it treat one as a modified copy of the other and abort every later run." +
          "\nRenumber the newer migration to the next unused version."
      );
    }
    process.exit(1);
  }

  const versions = [...byVersion.keys()].sort((a, b) => a - b);
  console.log(
    `Checked ${files.length} migration(s), versions ${versions[0]}-${
      versions[versions.length - 1]
    }: no duplicate version numbers.`
  );
}

main();
