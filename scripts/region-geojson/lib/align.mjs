import { createRequire } from 'node:module';
import { cldrKey } from './cldr.mjs';

const mapshaper = createRequire(import.meta.url)('mapshaper');

const GENERIC_WORDS =
  /\b(region|province|county|governorate|department|departamento|district|municipality|oblast|oblisi|oblysy|division|voivodeship|autonomous|community|principality|republic|city|of|the|and|de|state|prefecture|territory|federal|metropolitan|capital|chartered)\b/g;

export function normalizeName(name) {
  return (name ?? '')
    .replace(/\(.*?\)/g, ' ')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(GENERIC_WORDS, ' ')
    .replace(/[^a-z0-9]/g, '');
}

const featureNames = (p) =>
  [p.name, p.name_en, p.gn_name, p.woe_name, ...(p.name_alt ?? '').split('|')].filter(Boolean);
const regionCodeId = (p) => (p.region_cod ? p.region_cod.replace('.', '-') : null);

function singletonGroups(features) {
  return features.map((feature) => ({
    key: feature.properties.iso_3166_2,
    name: feature.properties.name,
    features: [feature],
    candidateIds: [feature.properties.iso_3166_2].filter(Boolean),
    names: featureNames(feature.properties),
  }));
}

function regionGroups(features) {
  const byRegion = new Map();
  for (const feature of features) {
    const region = feature.properties.region || feature.properties.iso_3166_2;
    if (!byRegion.has(region)) byRegion.set(region, []);
    byRegion.get(region).push(feature);
  }
  return [...byRegion].map(([region, members]) => {
    const p = members[0].properties;
    const single = members.length === 1;
    return {
      key: region,
      name: region,
      features: members,
      candidateIds: [regionCodeId(p), single ? p.iso_3166_2 : null].filter(Boolean),
      names: [region, ...(single ? featureNames(p) : [])],
    };
  });
}

function explicitGroups(features, spec) {
  const taken = new Set();
  const groups = Object.entries(spec).map(([id, rule]) => {
    const members = features.filter(
      (f) =>
        !taken.has(f) && (rule.regions?.includes(f.properties.region) || rule.ids?.includes(f.properties.iso_3166_2)),
    );
    for (const member of members) taken.add(member);
    return { key: id, name: null, features: members, candidateIds: [id], names: [], fixedId: id };
  });
  return [...groups, ...singletonGroups(features.filter((f) => !taken.has(f)))];
}

function assignIds(groups, codes, cldrNames, overrides) {
  const codeSet = new Set(codes.map((c) => c.code));
  const used = new Set();
  const assigned = new Map();
  const claim = (group, id) => {
    used.add(id);
    assigned.set(group, id);
  };

  for (const group of groups) {
    const keys = [group.key, ...group.features.map((f) => `${f.properties.iso_3166_2}|${f.properties.name}`)];
    const id = group.fixedId ?? keys.map((key) => overrides[key]).find((value) => value && !used.has(value));
    if (id) claim(group, id);
  }
  for (const group of groups) {
    if (assigned.has(group)) continue;
    const id = group.candidateIds.find((c) => codeSet.has(c) && !used.has(c));
    if (id) claim(group, id);
  }
  const byName = new Map();
  for (const { code, name } of codes) {
    if (used.has(code)) continue;
    for (const candidate of [name, cldrNames[cldrKey(code)]].filter(Boolean).map(normalizeName)) {
      const existing = byName.get(candidate);
      if (existing !== undefined && existing !== code) byName.set(candidate, null);
      else byName.set(candidate, code);
    }
  }
  for (const group of groups) {
    if (assigned.has(group)) continue;
    const id = group.names.map((n) => byName.get(normalizeName(n))).find((code) => code && !used.has(code));
    if (id) claim(group, id);
  }
  return assigned;
}

function fallbackId(countryCode, group) {
  if (group.features.length === 1 && group.features[0].properties.iso_3166_2) {
    return group.features[0].properties.iso_3166_2;
  }
  return `${countryCode}-${normalizeName(group.key).slice(0, 10).toUpperCase() || 'X'}~`;
}

function outputProperties(countryCode, group, id, codes) {
  const single = group.features.length === 1;
  return {
    ...(single ? group.features[0].properties : {}),
    iso_a2: countryCode,
    iso_3166_2: id,
    name: single ? group.features[0].properties.name : (codes.find((c) => c.code === id)?.name ?? group.name),
    gn_level: 1,
  };
}

async function dissolveGroups(countryCode, groups, ids, codes) {
  const tagged = groups.flatMap((group, index) =>
    group.features.map((f) => ({ type: 'Feature', properties: { g: String(index) }, geometry: f.geometry })),
  );
  const result = await mapshaper.applyCommands('-i in.json -dissolve g -o out.json format=geojson', {
    'in.json': JSON.stringify({ type: 'FeatureCollection', features: tagged }),
  });
  const geometries = new Map(
    JSON.parse(result['out.json'].toString('utf-8')).features.map((f) => [f.properties.g, f.geometry]),
  );
  return groups
    .map((group, index) => ({
      type: 'Feature',
      properties: outputProperties(countryCode, group, ids.get(group), codes),
      geometry: geometries.get(String(index)) ?? null,
    }))
    .filter((f) => f.geometry);
}

export async function alignCountry(countryCode, features, codes, cldrNames, { regionGroups: explicit, idOverrides }) {
  const overrides = idOverrides?.[countryCode] ?? {};
  const layouts = explicit?.[countryCode]
    ? [{ layout: 'groups', groups: explicitGroups(features, explicit[countryCode]) }]
    : [{ layout: 'features', groups: singletonGroups(features) }];
  if (!explicit?.[countryCode] && features.some((f) => f.properties.gn_level === 2 && f.properties.region)) {
    layouts.push({ layout: 'regions', groups: regionGroups(features) });
  }

  const codeSet = new Set(codes.map((c) => c.code));
  const scored = layouts.map((candidate) => {
    const assigned = assignIds(candidate.groups, codes, cldrNames, overrides);
    const matched = [...assigned.values()].filter((id) => codeSet.has(id)).length;
    return { ...candidate, assigned, matched, leftover: candidate.groups.length - assigned.size };
  });
  const best = scored.reduce((a, b) =>
    b.matched > a.matched || (b.matched === a.matched && b.leftover < a.leftover) ? b : a,
  );
  const ids = new Map(best.groups.map((group) => [group, best.assigned.get(group) ?? fallbackId(countryCode, group)]));
  const needsDissolve = best.groups.some((group) => group.features.length > 1);
  const aligned = needsDissolve
    ? await dissolveGroups(countryCode, best.groups, ids, codes)
    : best.groups.map((group) => ({
        ...group.features[0],
        properties: outputProperties(countryCode, group, ids.get(group), codes),
      }));

  const matchedCodes = new Set([...ids.values()].filter((id) => codeSet.has(id)));
  return {
    features: aligned,
    layout: best.layout,
    coverage: codes.length === 0 ? 0 : +(matchedCodes.size / codes.length).toFixed(3),
    missingCodes: codes.filter((c) => !matchedCodes.has(c.code)).map((c) => c.code),
    unmatchedIds: best.groups.filter((group) => !best.assigned.has(group)).map((group) => ids.get(group)),
  };
}
