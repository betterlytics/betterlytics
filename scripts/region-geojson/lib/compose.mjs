import { bboxGapKm, mergeBboxes } from './geometry.mjs';

const DEFAULT_SCALE_FRAC = 0.24;
const MARGIN_FRAC = 0.03;
const GAP_FRAC = 0.025;
const PAD_FRAC = 0.03;

export function composeCountry(parts, clusters, config) {
  const warnings = [];
  const mainlandParts = new Set(clusters[0].parts);
  const claimed = new Set();

  const selectParts = (featureIds, wholeFeature) =>
    parts.filter(
      (p) =>
        (wholeFeature || !mainlandParts.has(p)) &&
        !claimed.has(p) &&
        featureIds.includes(p.feature.properties.iso_3166_2),
    );

  const insetGroups = [];
  for (const rule of config?.insets ?? []) {
    let selected = selectParts(rule.features, rule.wholeFeature);
    if (selected.length === 0) {
      warnings.push(`inset rule matched nothing: ${rule.features.join(',')}`);
      continue;
    }
    let overflow = [];
    if (rule.maxGapKm) {
      const anchor = selected.reduce((a, b) => (b.areaKm2 > a.areaKm2 ? b : a));
      overflow = selected.filter((p) => bboxGapKm(p.bbox, anchor.bbox) > rule.maxGapKm);
      selected = selected.filter((p) => !overflow.includes(p));
    }
    for (const p of [...selected, ...overflow]) claimed.add(p);
    insetGroups.push({ rule, parts: selected, croppedOverflow: overflow });
  }

  const cropped = [];
  for (const rule of config?.crop ?? []) {
    const selected = selectParts(rule.features, false);
    if (selected.length === 0) {
      warnings.push(`crop rule matched nothing: ${rule.features.join(',')}`);
      continue;
    }
    for (const p of selected) claimed.add(p);
    cropped.push(...selected);
  }
  for (const group of insetGroups) cropped.push(...group.croppedOverflow);

  const keptParts = parts.filter((p) => !claimed.has(p));
  const anchorBbox = mergeBboxes(keptParts.map((p) => p.bbox));
  const frames = placeInsets(insetGroups, anchorBbox);

  return {
    keptParts,
    insetParts: insetGroups.flatMap((g) => g.parts),
    frames,
    cropped: summarizeCropped(cropped),
    warnings,
  };
}

function placeInsets(insetGroups, anchor) {
  const spanLon = anchor.maxLon - anchor.minLon;
  const spanLat = anchor.maxLat - anchor.minLat;
  const diag = Math.hypot(spanLon, spanLat);
  const margin = MARGIN_FRAC * diag;
  const gap = GAP_FRAC * diag;

  const cursors = {};
  const frames = [];

  for (const group of insetGroups) {
    const side = group.rule.side ?? 'left';
    const align = group.rule.align ?? 'start';
    const content = mergeBboxes(group.parts.map((p) => p.bbox));
    const contentDiag = Math.max(1e-9, Math.hypot(content.maxLon - content.minLon, content.maxLat - content.minLat));
    const scale = ((group.rule.scaleFrac ?? DEFAULT_SCALE_FRAC) * diag) / contentDiag;
    const contentW = (content.maxLon - content.minLon) * scale;
    const contentH = (content.maxLat - content.minLat) * scale;
    const pad = PAD_FRAC * Math.max(contentW, contentH);
    const frameW = contentW + 2 * pad;
    const frameH = contentH + 2 * pad;

    let frameMinX, frameMinY;
    if (side === 'left' || side === 'right') {
      frameMinX = side === 'left' ? anchor.minLon - margin - frameW : anchor.maxLon + margin;
      const key = `${side}:${align}`;
      cursors[key] ??= align === 'start' ? anchor.maxLat : anchor.minLat;
      if (align === 'start') {
        frameMinY = cursors[key] - frameH;
        cursors[key] = frameMinY - gap;
      } else {
        frameMinY = cursors[key];
        cursors[key] = frameMinY + frameH + gap;
      }
    } else {
      frameMinY = side === 'bottom' ? anchor.minLat - margin - frameH : anchor.maxLat + margin;
      const key = `${side}:${align}`;
      cursors[key] ??= align === 'start' ? anchor.minLon : anchor.maxLon;
      if (align === 'start') {
        frameMinX = cursors[key];
        cursors[key] = frameMinX + frameW + gap;
      } else {
        frameMinX = cursors[key] - frameW;
        cursors[key] = frameMinX - gap;
      }
    }

    transformParts(group.parts, content, scale, frameMinX + pad, frameMinY + pad);
    frames.push({
      bbox: [round5(frameMinX), round5(frameMinY), round5(frameMinX + frameW), round5(frameMinY + frameH)],
      label: group.rule.label,
      scale: +scale.toFixed(3),
    });
  }
  return frames;
}

function transformParts(parts, content, scale, originX, originY) {
  for (const part of parts) {
    for (const ring of part.rings) {
      for (const coord of ring) {
        coord[0] = originX + (coord[0] - content.minLon) * scale;
        coord[1] = originY + (coord[1] - content.minLat) * scale;
      }
    }
    part.bbox = {
      minLon: originX + (part.bbox.minLon - content.minLon) * scale,
      maxLon: originX + (part.bbox.maxLon - content.minLon) * scale,
      minLat: originY + (part.bbox.minLat - content.minLat) * scale,
      maxLat: originY + (part.bbox.maxLat - content.minLat) * scale,
    };
  }
}

function summarizeCropped(croppedParts) {
  const byFeature = new Map();
  for (const part of croppedParts) {
    const id = part.feature.properties.iso_3166_2;
    if (!byFeature.has(id)) byFeature.set(id, { id, name: part.feature.properties.name, partCount: 0 });
    byFeature.get(id).partCount++;
  }
  return [...byFeature.values()];
}

function round5(n) {
  return +n.toFixed(5);
}
