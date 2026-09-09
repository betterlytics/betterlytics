import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { countryConfig, INFLATION_THRESHOLD, FILE_BUDGET_BYTES, TOTAL_BUDGET_BYTES } from './config.mjs';
import { loadCldrEnNames, cldrKey } from './lib/cldr.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const REGIONS_DIR = path.join(ROOT, 'dashboard', 'public', 'data', 'regions');
const MANIFEST_PATH = path.join(ROOT, 'scripts', 'region-geojson', 'manifest.json');
const WORLD_MAP_PATH = path.join(ROOT, 'dashboard', 'public', 'data', 'countries.geo.json');
const MAX_TREATED_INFLATION = 1.8;

const errors = [];
const warnings = [];

function validateFile(code, entry, cldrNames) {
  const filePath = path.join(REGIONS_DIR, `${code}.geo.json`);
  if (!fs.existsSync(filePath)) {
    errors.push(`${code}: file missing`);
    return { unresolvedNames: [] };
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  if (Buffer.byteLength(raw) !== entry.bytes) {
    errors.push(`${code}: size differs from manifest (${Buffer.byteLength(raw)} vs ${entry.bytes})`);
  }

  const geojson = JSON.parse(raw);
  if (geojson.type !== 'FeatureCollection' || geojson.features.length === 0) {
    errors.push(`${code}: not a non-empty FeatureCollection`);
    return { unresolvedNames: [] };
  }

  const unresolvedNames = [];
  for (const feature of geojson.features) {
    const id = feature.id;
    const isPseudo = typeof id === 'string' && (id.includes('~') || id.startsWith('??-'));
    if (!isPseudo && !(typeof id === 'string' && new RegExp(`^${code}-`).test(id))) {
      errors.push(`${code}: feature id "${id}" does not match ${code}-*`);
    }
    validateGeometry(code, id, feature.geometry);
    if (cldrNames && !isPseudo && !cldrNames[cldrKey(id)]) unresolvedNames.push(id);
  }

  if (geojson.generator !== 'Betterlytics region geojson pipeline (https://betterlytics.io)') {
    errors.push(`${code}: missing or wrong generator attribution member`);
  }
  if (!String(geojson.license || '').startsWith('AGPL-3.0')) {
    errors.push(`${code}: missing license member`);
  }

  const frames = geojson.insets ?? [];
  for (const frame of frames) {
    const [minLon, minLat, maxLon, maxLat] = frame.bbox;
    if (!(minLon < maxLon && minLat < maxLat)) errors.push(`${code}: degenerate inset frame ${frame.label}`);
  }
  if (frames.length > 0) validateFramePlacement(code, geojson, frames);

  const bbox = geojsonBbox(geojson);
  if (code !== 'AQ' && bbox.maxLon - bbox.minLon > 359) {
    errors.push(`${code}: longitude span covers the whole world`);
  }

  return { unresolvedNames };
}

function bboxesIntersect(a, b) {
  return a.minLon < b.maxLon && a.maxLon > b.minLon && a.minLat < b.maxLat && a.maxLat > b.minLat;
}

function frameToBbox(frame) {
  return { minLon: frame.bbox[0], minLat: frame.bbox[1], maxLon: frame.bbox[2], maxLat: frame.bbox[3] };
}

/** Inset frames must sit clear of the in-place geometry and of each other. */
function validateFramePlacement(code, geojson, frames) {
  const frameBoxes = frames.map(frameToBbox);
  for (let i = 0; i < frameBoxes.length; i++) {
    for (let j = i + 1; j < frameBoxes.length; j++) {
      if (bboxesIntersect(frameBoxes[i], frameBoxes[j])) {
        errors.push(`${code}: inset frames overlap (${frames[i].label} / ${frames[j].label})`);
      }
    }
  }
  for (const feature of geojson.features) {
    const polygons =
      feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates;
    for (const rings of polygons) {
      const box = ringBbox(rings[0]);
      const contained = frameBoxes.some(
        (fb) => box.minLon >= fb.minLon && box.maxLon <= fb.maxLon && box.minLat >= fb.minLat && box.maxLat <= fb.maxLat,
      );
      if (contained) continue;
      for (let i = 0; i < frameBoxes.length; i++) {
        if (bboxesIntersect(box, frameBoxes[i])) {
          errors.push(`${code}: frame ${frames[i].label} collides with in-place geometry of ${feature.id}`);
        }
      }
    }
  }
}

function ringBbox(ring) {
  const box = { minLon: Infinity, minLat: Infinity, maxLon: -Infinity, maxLat: -Infinity };
  for (const [x, y] of ring) {
    box.minLon = Math.min(box.minLon, x);
    box.maxLon = Math.max(box.maxLon, x);
    box.minLat = Math.min(box.minLat, y);
    box.maxLat = Math.max(box.maxLat, y);
  }
  return box;
}

function validateGeometry(code, id, geometry) {
  const polygons =
    geometry.type === 'Polygon'
      ? [geometry.coordinates]
      : geometry.type === 'MultiPolygon'
        ? geometry.coordinates
        : null;
  if (!polygons) {
    errors.push(`${code}/${id}: unexpected geometry type ${geometry.type}`);
    return;
  }
  for (const rings of polygons) {
    for (const ring of rings) {
      if (ring.length < 4) {
        errors.push(`${code}/${id}: ring with fewer than 4 points`);
        continue;
      }
      const [fx, fy] = ring[0];
      const [lx, ly] = ring[ring.length - 1];
      if (fx !== lx || fy !== ly) errors.push(`${code}/${id}: unclosed ring`);
      for (const [x, y] of ring) {
        if (!Number.isFinite(x) || !Number.isFinite(y)) errors.push(`${code}/${id}: non-finite coordinate`);
      }
    }
  }
}

function geojsonBbox(geojson) {
  const bbox = { minLon: Infinity, minLat: Infinity, maxLon: -Infinity, maxLat: -Infinity };
  for (const feature of geojson.features) {
    const polygons = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates;
    for (const rings of polygons) {
      for (const [x, y] of rings[0]) {
        bbox.minLon = Math.min(bbox.minLon, x);
        bbox.maxLon = Math.max(bbox.maxLon, x);
        bbox.minLat = Math.min(bbox.minLat, y);
        bbox.maxLat = Math.max(bbox.maxLat, y);
      }
    }
  }
  return bbox;
}

function validateRegionConstant(manifestCodes) {
  const constantPath = path.join(ROOT, 'dashboard', 'src', 'constants', 'regionCountries.ts');
  if (!fs.existsSync(constantPath)) {
    errors.push('dashboard/src/constants/regionCountries.ts missing; rerun the build');
    return;
  }
  const src = fs.readFileSync(constantPath, 'utf-8');
  const constantCodes = new Set([...src.matchAll(/'([A-Z]{2})'/g)].map((m) => m[1]));
  for (const code of manifestCodes) {
    if (!constantCodes.has(code)) errors.push(`regionCountries.ts is missing ${code}; rerun the build`);
  }
  for (const code of constantCodes) {
    if (!manifestCodes.includes(code)) errors.push(`regionCountries.ts lists ${code} with no region file; rerun the build`);
  }
}

function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
  const cldrNames = loadCldrEnNames();
  if (!cldrNames) warnings.push('cldr-subdivisions-full not installed in dashboard; skipping name resolution check');
  const allUnresolved = [];

  for (const entry of manifest.countries) {
    const flagged = entry.inflationBefore > INFLATION_THRESHOLD || entry.antimeridianShifted;
    if (flagged && !countryConfig[entry.code]) {
      errors.push(`${entry.code}: flagged (x${entry.inflationBefore}) but has no config entry`);
    }
    const treated = entry.insets.length > 0 || entry.cropped.length > 0;
    if (treated && entry.inflationAfter > MAX_TREATED_INFLATION) {
      errors.push(`${entry.code}: still x${entry.inflationAfter} after treatment`);
    }
    if (entry.bytes > FILE_BUDGET_BYTES) {
      errors.push(`${entry.code}: ${Math.round(entry.bytes / 1024)} KB exceeds per-file budget`);
    }
    for (const warning of entry.warnings) warnings.push(`${entry.code}: ${warning}`);

    const { unresolvedNames } = validateFile(entry.code, entry, cldrNames);
    allUnresolved.push(...unresolvedNames.map((id) => `${entry.code}: ${id}`));
  }

  validateRegionConstant(manifest.countries.map((e) => e.code));

  if (manifest.totalBytes > TOTAL_BUDGET_BYTES) {
    errors.push(`total ${(manifest.totalBytes / 1024 / 1024).toFixed(2)} MB exceeds budget`);
  }

  if (fs.existsSync(WORLD_MAP_PATH)) {
    const world = JSON.parse(fs.readFileSync(WORLD_MAP_PATH, 'utf-8'));
    const built = new Set(manifest.countries.map((c) => c.code));
    const missing = world.features
      .map((f) => f.id)
      .filter((id) => typeof id === 'string' && id.length === 2 && !built.has(id));
    if (missing.length > 0) {
      warnings.push(`world map countries without a region file (UI must not offer drill-down): ${missing.join(', ')}`);
    }
  } else {
    warnings.push('countries.geo.json not found; skipping world map coverage check');
  }

  if (allUnresolved.length > 0) {
    warnings.push(`${allUnresolved.length} feature ids with no CLDR English name: ${allUnresolved.slice(0, 15).join(', ')}${allUnresolved.length > 15 ? ' ...' : ''}`);
  }

  console.log(`Validated ${manifest.countries.length} region files (NE @ ${manifest.neCommit.slice(0, 8)})`);
  for (const warning of warnings) console.log(`  warn: ${warning}`);
  if (errors.length > 0) {
    console.error(`\n${errors.length} errors:`);
    for (const error of errors) console.error(`  FAIL: ${error}`);
    process.exit(1);
  }
  console.log('All checks passed.');
}

main();
