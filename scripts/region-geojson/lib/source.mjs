import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const NE_COMMIT = 'ca96624a56bd078437bca8184e78163e5039ad19';
const NE_FILE = 'ne_10m_admin_1_states_provinces.geojson';
const NE_URL = `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/${NE_COMMIT}/geojson/${NE_FILE}`;

const CACHE_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.cache');

export function cachePath(name) {
  return path.join(CACHE_DIR, name);
}

export function groupByCountry(geojson) {
  const byCountry = new Map();
  const skipped = [];
  for (const feature of geojson.features) {
    const { iso_a2, iso_3166_2, name } = feature.properties;
    if (!iso_a2 || iso_a2 === '-1' || iso_a2 === '-99') {
      skipped.push({ name, iso_a2, iso_3166_2 });
      continue;
    }
    if (!byCountry.has(iso_a2)) byCountry.set(iso_a2, []);
    byCountry.get(iso_a2).push(feature);
  }
  return { byCountry, skipped };
}

export async function loadSourceGeojson() {
  const file = cachePath(NE_FILE);
  if (!fs.existsSync(file)) {
    console.log(`Downloading Natural Earth admin-1 (${NE_COMMIT.slice(0, 8)})...`);
    const res = await fetch(NE_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${NE_URL}`);
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  }
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}
