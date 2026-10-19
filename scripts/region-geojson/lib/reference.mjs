import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const FIRST_LEVEL_CODES_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'first-level-codes.json',
);

export function loadFirstLevelCodes() {
  if (!fs.existsSync(FIRST_LEVEL_CODES_PATH)) {
    throw new Error('first-level-codes.json is missing; run pnpm regions-codes against a GeoLite2-City database');
  }
  return JSON.parse(fs.readFileSync(FIRST_LEVEL_CODES_PATH, 'utf-8'));
}
