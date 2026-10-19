import { loadSourceGeojson, groupByCountry } from './lib/source.mjs';
import { loadCldrEnNames } from './lib/cldr.mjs';
import { reassignCountries } from './lib/reassign.mjs';
import { alignCountry } from './lib/align.mjs';
import { loadFirstLevelCodes } from './lib/reference.mjs';
import { countryReassign, regionGroups, idOverrides, COVERAGE_FLOOR } from './config.mjs';

async function main() {
  const only = process.argv.slice(2);
  const { byCountry } = groupByCountry(await loadSourceGeojson());
  const cldrNames = loadCldrEnNames();
  if (!cldrNames) throw new Error('cldr-subdivisions-full is not installed in dashboard/node_modules');
  const reference = loadFirstLevelCodes();
  reassignCountries(byCountry, countryReassign);

  const rows = [];
  for (const code of [...byCountry.keys()].sort()) {
    if (only.length > 0 && !only.includes(code)) continue;
    const codes = reference.countries[code];
    if (!codes) continue;
    const result = await alignCountry(code, byCountry.get(code), codes, cldrNames, { regionGroups, idOverrides });
    rows.push({ code, ...result, total: codes.length });
  }

  for (const row of rows) {
    const status = row.coverage < COVERAGE_FLOOR ? 'EXCLUDED' : 'ok';
    const missing = row.missingCodes.length ? ` missing: ${row.missingCodes.join(', ')}` : '';
    const unmatched = row.unmatchedIds.length ? ` unmatched: ${row.unmatchedIds.join(', ')}` : '';
    console.log(`${row.code} ${status} ${Math.round(row.coverage * 100)}% ${row.layout} (${row.total} codes)${missing}${unmatched}`);
  }
  const excluded = rows.filter((r) => r.coverage < COVERAGE_FLOOR);
  console.log(`\n${rows.length - excluded.length} included, ${excluded.length} excluded: ${excluded.map((r) => r.code).join(' ')}`);
}

main().catch((err) => {
  console.error('Report failed:', err);
  process.exit(1);
});
