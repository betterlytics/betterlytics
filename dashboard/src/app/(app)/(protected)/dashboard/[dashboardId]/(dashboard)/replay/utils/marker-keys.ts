import type { TimelineMarker } from '../ReplayTimeline';

const MARKER_KEYS = [
  'Mouse Interaction',
  'Selection',
  'Scroll',
  'Input',
  'Full snapshot',
  'Viewport Resize',
  'Media Interaction',
  'Pageview',
  'Blacklist',
  'client_error',
] as const;

export type MarkerKey = (typeof MARKER_KEYS)[number];

const MARKER_KEYS_SET = new Set<string>(MARKER_KEYS);

export function keyForMarker(marker: TimelineMarker): MarkerKey | string {
  if (marker.key !== 'Custom event' && MARKER_KEYS_SET.has(marker.key)) {
    return marker.key as MarkerKey;
  }

  if (marker.label !== undefined && MARKER_KEYS_SET.has(marker.label)) {
    return marker.label as MarkerKey;
  }

  return marker.label ?? marker.key;
}
