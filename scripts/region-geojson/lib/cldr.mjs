import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CLDR_EN_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..', '..', '..',
  'dashboard', 'node_modules', 'cldr-subdivisions-full', 'subdivisions', 'en', 'en.json',
);

export function loadCldrEnNames() {
  if (!fs.existsSync(CLDR_EN_PATH)) return null;
  return JSON.parse(fs.readFileSync(CLDR_EN_PATH, 'utf-8')).subdivisions.localeDisplayNames.subdivisions;
}

export function cldrKey(isoCode) {
  return isoCode.toLowerCase().replace('-', '');
}
