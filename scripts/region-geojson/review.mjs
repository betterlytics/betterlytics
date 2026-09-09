import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cachePath } from './lib/source.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const REGIONS_DIR = path.join(ROOT, 'dashboard', 'public', 'data', 'regions');
const MANIFEST_PATH = path.join(ROOT, 'scripts', 'region-geojson', 'manifest.json');
const PORT = 4499;

const PAGE = `<!doctype html>
<html><head>
<meta charset="utf-8"><title>Region geojson review</title>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  body { margin: 0; font: 14px system-ui, sans-serif; background: #14161a; color: #d8dce2; }
  header { display: flex; gap: 12px; align-items: center; padding: 10px 14px; flex-wrap: wrap; }
  select, button { background: #22262c; color: inherit; border: 1px solid #3a4048; border-radius: 6px; padding: 6px 10px; font: inherit; }
  #meta { color: #8b93a0; }
  .maps { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 0 14px 14px; }
  .pane { background: #1b1e23; border-radius: 8px; overflow: hidden; }
  .pane h3 { margin: 0; padding: 8px 12px; font-size: 12px; font-weight: 600; color: #8b93a0; text-transform: uppercase; letter-spacing: .05em; }
  .map { height: calc(100vh - 130px); background: #10225a; }
  .leaflet-container { background: #182036; }
</style>
</head><body>
<header>
  <select id="country"></select>
  <button id="prev">&larr;</button>
  <button id="next">&rarr;</button>
  <span id="meta"></span>
</header>
<div class="maps">
  <div class="pane"><h3>Raw Natural Earth (normalized)</h3><div id="raw" class="map"></div></div>
  <div class="pane"><h3>Built (composed + simplified)</h3><div id="built" class="map"></div></div>
</div>
<script>
const style = { color: '#7f8ea8', weight: 1, fillColor: '#3d6fb0', fillOpacity: 0.55 };
const frameStyle = { color: '#e0a848', weight: 1.5, fill: false, dashArray: '4 3' };
const maps = {};
for (const id of ['raw', 'built']) {
  maps[id] = L.map(id, { attributionControl: false, zoomControl: false });
  maps[id].createPane('labels');
}
let manifest, order = [], idx = 0;

async function show(code) {
  const entry = manifest.countries.find(c => c.code === code);
  document.getElementById('meta').textContent =
    code + ' - ' + Math.round(entry.bytes / 1024) + ' KB @ ' + entry.simplifyPct + '%'
    + ' - x' + entry.inflationBefore + ' -> x' + entry.inflationAfter
    + (entry.insets.length ? ' - insets: ' + entry.insets.join(', ') : '')
    + (entry.cropped.length ? ' - cropped: ' + entry.cropped.join(', ') : '')
    + (entry.warnings.length ? ' - WARN: ' + entry.warnings.join('; ') : '');
  for (const [pane, url] of [['raw', '/raw/' + code], ['built', '/built/' + code]]) {
    const geojson = await (await fetch(url)).json();
    const map = maps[pane];
    map.eachLayer(l => map.removeLayer(l));
    const layer = L.geoJSON(geojson, { style, onEachFeature: (f, l) => l.bindTooltip((f.id || '?') + ' ' + (f.properties.name || '')) }).addTo(map);
    let bounds = layer.getBounds();
    for (const frame of geojson.insets || []) {
      const rect = L.rectangle([[frame.bbox[1], frame.bbox[0]], [frame.bbox[3], frame.bbox[2]]], frameStyle).addTo(map);
      if (frame.label) rect.bindTooltip(frame.label, { permanent: false });
      bounds = bounds.extend(rect.getBounds());
    }
    const vb = geojson.viewBbox;
    const fitBounds = vb ? L.latLngBounds([[vb[1], vb[0]], [vb[3], vb[2]]]) : bounds;
    map.fitBounds(fitBounds.pad(0.03));
  }
}

function go(i) {
  idx = (i + order.length) % order.length;
  document.getElementById('country').value = order[idx];
  show(order[idx]);
}

(async () => {
  manifest = await (await fetch('/manifest.json')).json();
  const risk = c => (c.insets.length || c.cropped.length ? 1000 : 0) + c.inflationBefore;
  order = [...manifest.countries].sort((a, b) => risk(b) - risk(a)).map(c => c.code);
  const select = document.getElementById('country');
  for (const code of order) {
    const entry = manifest.countries.find(c => c.code === code);
    const opt = document.createElement('option');
    opt.value = code;
    opt.textContent = code + (entry.insets.length ? ' [insets]' : entry.cropped.length ? ' [crop]' : '');
    select.appendChild(opt);
  }
  select.onchange = () => go(order.indexOf(select.value));
  document.getElementById('prev').onclick = () => go(idx - 1);
  document.getElementById('next').onclick = () => go(idx + 1);
  addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') go(idx - 1);
    if (e.key === 'ArrowRight') go(idx + 1);
  });
  go(0);
})();
</script>
</body></html>`;

function serveJson(res, filePath) {
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': 'application/json' });
  fs.createReadStream(filePath).pipe(res);
}

http
  .createServer((req, res) => {
    const url = req.url ?? '/';
    const code = /^\/(raw|built)\/([A-Z]{2})$/.exec(url);
    if (url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(PAGE);
    } else if (url === '/manifest.json') {
      serveJson(res, MANIFEST_PATH);
    } else if (code) {
      const dir = code[1] === 'raw' ? cachePath('raw') : REGIONS_DIR;
      serveJson(res, path.join(dir, `${code[2]}.geo.json`));
    } else {
      res.writeHead(404);
      res.end('not found');
    }
  })
  .listen(PORT, () => console.log(`Region review: http://localhost:${PORT}`));
