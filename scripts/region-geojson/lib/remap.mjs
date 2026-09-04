import { cldrKey } from './cldr.mjs';

function normalizeName(name) {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Natural Earth subdivision codes drift from current ISO 3166-2 (which CLDR
 * and MaxMind follow). Where an NE id has no CLDR entry, try to recover the
 * current ISO code by matching the NE region name against CLDR's English
 * names for that country. Unmatched ids stay as-is and surface in validation.
 */
export function applyIdFixes(byCountry, cldrNames, { idOverrides = {}, countryReassign = {} }) {
  const report = { reassigned: [], overridden: [], remapped: [], unmatched: [] };

  for (const [fromCode, toCode] of Object.entries(countryReassign)) {
    for (const [code, features] of byCountry) {
      const moving = features.filter((f) => f.properties.iso_3166_2 === fromCode);
      if (moving.length === 0 || code === toCode) continue;
      byCountry.set(code, features.filter((f) => !moving.includes(f)));
      if (!byCountry.has(toCode)) byCountry.set(toCode, []);
      byCountry.get(toCode).push(...moving);
      report.reassigned.push(`${fromCode}: ${code} -> ${toCode}`);
    }
  }

  if (!cldrNames) return report;

  const namesByCountry = new Map();
  for (const [key, displayName] of Object.entries(cldrNames)) {
    const country = key.slice(0, 2).toUpperCase();
    if (!namesByCountry.has(country)) namesByCountry.set(country, new Map());
    const normalized = normalizeName(displayName);
    const bucket = namesByCountry.get(country);
    bucket.set(normalized, bucket.has(normalized) ? null : key);
  }

  for (const [countryCode, features] of byCountry) {
    const usedIds = new Set(features.map((f) => f.properties.iso_3166_2));
    for (const feature of features) {
      const id = feature.properties.iso_3166_2;
      if (!id) continue;
      if (idOverrides[id]) {
        feature.properties.iso_3166_2 = idOverrides[id];
        report.overridden.push(`${id} -> ${idOverrides[id]}`);
        continue;
      }
      if (id.includes('~') || cldrNames[cldrKey(id)]) continue;

      const match = namesByCountry.get(countryCode)?.get(normalizeName(feature.properties.name ?? ''));
      if (match) {
        const newId = `${countryCode}-${match.slice(2).toUpperCase()}`;
        if (!usedIds.has(newId)) {
          usedIds.add(newId);
          feature.properties.iso_3166_2 = newId;
          report.remapped.push(`${id} -> ${newId} (${feature.properties.name})`);
          continue;
        }
      }
      report.unmatched.push(`${countryCode}: ${id} (${feature.properties.name})`);
    }
  }
  return report;
}
