import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openMmdb } from './lib/mmdb.mjs';
import { FIRST_LEVEL_CODES_PATH } from './lib/reference.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DEFAULT_MMDB = path.join(ROOT, 'backend', 'assets', 'geoip', 'GeoLite2-City.mmdb');

function main() {
  const file = process.argv[2] ?? DEFAULT_MMDB;
  if (!fs.existsSync(file)) {
    console.error(`GeoLite2-City database not found at ${file}`);
    process.exit(1);
  }
  const { metadata, forEachRecord } = openMmdb(file);
  const codes = new Map();
  const records = forEachRecord((entry) => {
    const country = entry.country?.iso_code;
    const subdivision = entry.subdivisions?.[0];
    if (!country || !subdivision?.iso_code) return;
    const code = `${country}-${subdivision.iso_code}`;
    if (!codes.has(code)) codes.set(code, subdivision.names?.en ?? '');
  });

  const byCountry = {};
  for (const [code, name] of [...codes].sort()) {
    (byCountry[code.slice(0, 2)] ??= []).push({ code, name });
  }
  const output = {
    database: `${metadata.database_type} ${new Date(metadata.build_epoch * 1000).toISOString().slice(0, 10)}`,
    countries: byCountry,
  };
  fs.writeFileSync(FIRST_LEVEL_CODES_PATH, JSON.stringify(output, null, 2) + '\n');
  console.log(
    `${output.database}: ${records} records, ${codes.size} first-level codes in ${Object.keys(byCountry).length} countries`,
  );
}

main();
