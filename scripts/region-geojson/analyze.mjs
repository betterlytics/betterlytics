import fs from 'node:fs';
import { loadSourceGeojson, groupByCountry, cachePath, NE_COMMIT } from './lib/source.mjs';
import { extractParts, mergeBboxes, bboxDiagonalKm } from './lib/geometry.mjs';
import { normalizeAntimeridian, clusterParts, clusterGapKm } from './lib/clusters.mjs';
import { INFLATION_THRESHOLD, LINK_KM } from './config.mjs';

function analyzeCountry(countryCode, features) {
  const parts = features.flatMap(extractParts);
  if (parts.length === 0) return null;

  const shifted = normalizeAntimeridian(parts);
  const clusters = clusterParts(parts, LINK_KM);
  const mainland = clusters[0];
  const fullBbox = mergeBboxes(parts.map((p) => p.bbox));
  const inflation = bboxDiagonalKm(fullBbox) / Math.max(1, bboxDiagonalKm(mainland.bbox));
  const totalArea = clusters.reduce((sum, c) => sum + c.areaKm2, 0);

  const mainlandFeatureIds = new Set(mainland.parts.map((p) => p.feature.properties.iso_3166_2));
  const outliers = clusters.slice(1).map((cluster) => {
    const featureIds = [...new Set(cluster.parts.map((p) => p.feature.properties.iso_3166_2))];
    return {
      gapKm: Math.round(clusterGapKm(cluster, mainland)),
      areaSharePct: +((cluster.areaKm2 / totalArea) * 100).toFixed(2),
      partCount: cluster.parts.length,
      features: featureIds.map((id) => ({
        id,
        name: cluster.parts.find((p) => p.feature.properties.iso_3166_2 === id).feature.properties.name,
        partial: mainlandFeatureIds.has(id),
      })),
    };
  });

  return {
    countryCode,
    featureCount: features.length,
    partCount: parts.length,
    antimeridianShifted: shifted,
    clusterCount: clusters.length,
    inflation: +inflation.toFixed(2),
    outliers,
  };
}

function printCountry(result) {
  const flags = result.antimeridianShifted ? ' [antimeridian]' : '';
  console.log(
    `\n${result.countryCode}  inflation x${result.inflation}  ` +
      `(${result.featureCount} regions, ${result.partCount} parts, ${result.clusterCount} clusters)${flags}`,
  );
  const shown = result.outliers.slice(0, 6);
  for (const outlier of shown) {
    const featureList = outlier.features
      .slice(0, 4)
      .map((f) => `${f.id ?? '??'} ${f.name}${f.partial ? ' (partial)' : ''}`)
      .join(', ');
    const more = outlier.features.length > 4 ? ` +${outlier.features.length - 4} more` : '';
    console.log(
      `    ${String(outlier.gapKm).padStart(6)} km away  ${String(outlier.areaSharePct).padStart(6)}% area  ${featureList}${more}`,
    );
  }
  if (result.outliers.length > shown.length) {
    console.log(`    ... +${result.outliers.length - shown.length} more clusters`);
  }
}

async function main() {
  const geojson = await loadSourceGeojson();
  console.log(`Natural Earth admin-1 @ ${NE_COMMIT.slice(0, 8)}: ${geojson.features.length} features`);

  const { byCountry, skipped } = groupByCountry(geojson);
  console.log(`Countries: ${byCountry.size}, skipped features (no iso_a2): ${skipped.length}`);

  const results = [...byCountry.entries()]
    .map(([code, features]) => analyzeCountry(code, features))
    .filter(Boolean)
    .sort((a, b) => b.inflation - a.inflation);

  const flagged = results.filter((r) => r.inflation > INFLATION_THRESHOLD || r.antimeridianShifted);
  console.log(`\n=== ${flagged.length} countries need attention (inflation > ${INFLATION_THRESHOLD} or antimeridian) ===`);
  for (const result of flagged) printCountry(result);

  const clean = results.length - flagged.length;
  console.log(`\n${clean} countries render fine with a plain fitBounds.`);

  const report = { neCommit: NE_COMMIT, generatedAt: new Date().toISOString(), skipped, results };
  fs.writeFileSync(cachePath('analysis-report.json'), JSON.stringify(report, null, 2));
  console.log(`Full report: scripts/region-geojson/.cache/analysis-report.json`);
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
