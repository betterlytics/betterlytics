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
