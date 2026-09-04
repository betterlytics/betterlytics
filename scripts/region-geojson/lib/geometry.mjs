const KM_PER_DEG_LAT = 110.574;
const KM_PER_DEG_LON_EQ = 111.32;

export function extractParts(feature) {
  const geom = feature.geometry;
  if (!geom) return [];
  const polygons =
    geom.type === 'Polygon' ? [geom.coordinates] : geom.type === 'MultiPolygon' ? geom.coordinates : [];
  return polygons.map((rings) => makePart(feature, rings));
}

function makePart(feature, rings) {
  const outer = rings[0];
  let minLon = Infinity,
    minLat = Infinity,
    maxLon = -Infinity,
    maxLat = -Infinity;
  let lonSum = 0,
    latSum = 0;
  for (const [lon, lat] of outer) {
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    lonSum += lon;
    latSum += lat;
  }
  const centroid = { lon: lonSum / outer.length, lat: latSum / outer.length };
  return {
    feature,
    rings,
    bbox: { minLon, minLat, maxLon, maxLat },
    centroid,
    areaKm2: ringAreaKm2(outer, centroid.lat),
  };
}

function ringAreaKm2(ring, refLat) {
  const kx = KM_PER_DEG_LON_EQ * Math.cos((refLat * Math.PI) / 180);
  let sum = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    sum += x1 * kx * y2 * KM_PER_DEG_LAT - x2 * kx * y1 * KM_PER_DEG_LAT;
  }
  return Math.abs(sum / 2);
}

export function bboxGapKm(a, b) {
  const meanLat = (mid(a.minLat, a.maxLat) + mid(b.minLat, b.maxLat)) / 2;
  const kx = KM_PER_DEG_LON_EQ * Math.cos((meanLat * Math.PI) / 180);
  const gapLon = Math.max(0, Math.max(a.minLon, b.minLon) - Math.min(a.maxLon, b.maxLon));
  const gapLat = Math.max(0, Math.max(a.minLat, b.minLat) - Math.min(a.maxLat, b.maxLat));
  return Math.hypot(gapLon * kx, gapLat * KM_PER_DEG_LAT);
}

function mid(min, max) {
  return (min + max) / 2;
}

export function mergeBboxes(bboxes) {
  const out = { minLon: Infinity, minLat: Infinity, maxLon: -Infinity, maxLat: -Infinity };
  for (const b of bboxes) {
    out.minLon = Math.min(out.minLon, b.minLon);
    out.minLat = Math.min(out.minLat, b.minLat);
    out.maxLon = Math.max(out.maxLon, b.maxLon);
    out.maxLat = Math.max(out.maxLat, b.maxLat);
  }
  return out;
}

export function bboxDiagonalKm(b) {
  const meanLat = (b.minLat + b.maxLat) / 2;
  const kx = KM_PER_DEG_LON_EQ * Math.cos((meanLat * Math.PI) / 180);
  return Math.hypot((b.maxLon - b.minLon) * kx, (b.maxLat - b.minLat) * KM_PER_DEG_LAT);
}

export function shiftPart(part, deltaLon) {
  for (const ring of part.rings) {
    for (const coord of ring) coord[0] += deltaLon;
  }
  part.bbox.minLon += deltaLon;
  part.bbox.maxLon += deltaLon;
  part.centroid.lon += deltaLon;
}
