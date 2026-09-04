import { bboxGapKm, mergeBboxes, shiftPart } from './geometry.mjs';

const LINK_KM = 100;

export function normalizeAntimeridian(parts) {
  if (parts.length === 0) return false;
  const largest = parts.reduce((a, b) => (b.areaKm2 > a.areaKm2 ? b : a));
  const ref = largest.centroid.lon;
  let shifted = false;
  for (const part of parts) {
    let delta = 0;
    if (part.centroid.lon - ref > 180) delta = -360;
    else if (part.centroid.lon - ref < -180) delta = 360;
    if (delta !== 0) {
      shiftPart(part, delta);
      shifted = true;
    }
  }
  return shifted;
}

export function clusterParts(parts) {
  const parent = parts.map((_, i) => i);
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const union = (a, b) => {
    parent[find(a)] = find(b);
  };

  for (let i = 0; i < parts.length; i++) {
    for (let j = i + 1; j < parts.length; j++) {
      if (bboxGapKm(parts[i].bbox, parts[j].bbox) < LINK_KM) union(i, j);
    }
  }

  const byRoot = new Map();
  parts.forEach((part, i) => {
    const root = find(i);
    if (!byRoot.has(root)) byRoot.set(root, []);
    byRoot.get(root).push(part);
  });

  const clusters = [...byRoot.values()].map((members) => ({
    parts: members,
    bbox: mergeBboxes(members.map((p) => p.bbox)),
    areaKm2: members.reduce((sum, p) => sum + p.areaKm2, 0),
  }));
  clusters.sort((a, b) => b.areaKm2 - a.areaKm2);
  return clusters;
}

export function clusterGapKm(cluster, mainland) {
  let min = Infinity;
  for (const a of cluster.parts) {
    for (const b of mainland.parts) {
      const gap = bboxGapKm(a.bbox, b.bbox);
      if (gap < min) min = gap;
    }
  }
  return min;
}
