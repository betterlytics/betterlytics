const fs = require('fs');
const path = require('path');
const https = require('https');

const SOURCE_URL =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson';
const OUTPUT_DIR = path.join(__dirname, '..', 'dashboard', 'public', 'data', 'regions');

function download(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) return reject(new Error('Too many redirects'));
    https
      .get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          return download(res.headers.location, maxRedirects - 1).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode} from ${url}`));
        }
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
        res.on('error', reject);
      })
      .on('error', reject);
  });
}

async function main() {
  console.log('Downloading Natural Earth admin-1 states/provinces GeoJSON...');
  console.log(`Source: ${SOURCE_URL}`);

  const raw = await download(SOURCE_URL);

  console.log(`Downloaded ${(Buffer.byteLength(raw) / 1024 / 1024).toFixed(1)} MB`);
  console.log('Parsing GeoJSON...');

  const geojson = JSON.parse(raw);
  console.log(`Total features: ${geojson.features.length}`);

  // Log sample feature properties to understand data shape
  if (geojson.features.length > 0) {
    const sample = geojson.features[0].properties;
    console.log('\nSample feature properties:');
    console.log(
      JSON.stringify(
        Object.fromEntries(
          Object.entries(sample).filter(
            ([_, v]) => typeof v === 'string' || typeof v === 'number'
          )
        ),
        null,
        2
      )
    );
  }

  // Group features by country code
  const byCountry = {};
  const skipped = [];

  for (const feature of geojson.features) {
    const props = feature.properties;
    const iso2 = props.iso_a2;
    const iso3166_2 = props.iso_3166_2;
    const name = props.name || props.name_en || 'Unknown';

    // Skip features without valid identifiers
    if (!iso2 || iso2 === '-1' || iso2 === '-99') {
      skipped.push({ name, reason: `invalid iso_a2: ${iso2}` });
      continue;
    }
    if (!iso3166_2 || iso3166_2 === '-1' || iso3166_2 === '-99') {
      skipped.push({ name, iso2, reason: `invalid iso_3166_2: ${iso3166_2}` });
      continue;
    }

    if (!byCountry[iso2]) {
      byCountry[iso2] = [];
    }

    byCountry[iso2].push({
      type: 'Feature',
      id: iso3166_2,
      properties: { name },
      geometry: feature.geometry,
    });
  }

  const countryCount = Object.keys(byCountry).length;
  const regionCount = Object.values(byCountry).reduce((sum, f) => sum + f.length, 0);
  console.log(`\nCountries: ${countryCount}`);
  console.log(`Regions: ${regionCount}`);

  if (skipped.length > 0) {
    console.log(`Skipped: ${skipped.length}`);
    for (const s of skipped) {
      console.log(`  - ${s.name} (${s.reason})`);
    }
  }

  // Create output directory
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Write per-country files
  let totalBytes = 0;
  for (const [countryCode, features] of Object.entries(byCountry).sort()) {
    const collection = {
      type: 'FeatureCollection',
      features,
    };

    const json = JSON.stringify(collection);
    const filePath = path.join(OUTPUT_DIR, `${countryCode}.geo.json`);
    fs.writeFileSync(filePath, json);
    totalBytes += Buffer.byteLength(json);

    const sizeKB = (Buffer.byteLength(json) / 1024).toFixed(0);
    console.log(`  ${countryCode}: ${features.length} regions (${sizeKB} KB)`);
  }

  console.log(`\nTotal output: ${(totalBytes / 1024 / 1024).toFixed(1)} MB across ${countryCount} files`);
  console.log(`Output directory: ${OUTPUT_DIR}`);
  console.log('Done!');
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
