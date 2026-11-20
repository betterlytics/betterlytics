import {
  HEATMAP_DEVICE_VIEWPORT_HEIGHTS,
  HEATMAP_DEVICE_WIDTHS,
  type HeatmapDevice,
} from '@/entities/analytics/clickHeatmap.entities';
import type { HeatmapCapture } from '@/entities/analytics/heatmapCaptures.entities';

export type CaptureAddressError = 'empty' | 'invalidUrl' | 'wildcard';

/**
 * The address the capture window opens: a full http(s) address on any host, or a path on the
 * suggested origin. Any page will do as a start, since the editor can go on to other pages in
 * the window. Only a wildcard left in the path is refused; a `*` in the query string is a value.
 */
export function resolveCaptureAddress(
  address: string,
  defaultOrigin: string | undefined,
): { url: string } | { error: CaptureAddressError } {
  const trimmed = address.trim();
  if (trimmed === '') return { error: 'empty' };
  const isPath = trimmed.startsWith('/') && !trimmed.startsWith('//');
  if (isPath && !defaultOrigin) return { error: 'invalidUrl' };

  let url: URL;
  try {
    url = isPath ? new URL(trimmed, defaultOrigin) : new URL(trimmed);
  } catch {
    return { error: 'invalidUrl' };
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return { error: 'invalidUrl' };
  if (url.pathname.includes('*')) return { error: 'wildcard' };
  url.hash = '';
  return { url: url.href };
}

/** The address the dialog starts from: the page captured last, else the page path on the suggested origin */
export function initialCaptureAddress(
  pagePath: string,
  origin: string | undefined,
  pageCaptures: HeatmapCapture[],
): string | null {
  return pageCaptures[0]?.capturedFromUrl ?? (origin ? `${origin}${pagePath}` : null);
}

// The page path lets the panel on the page tell the editor when a page isn't one the heatmap covers
export function captureUrl(url: string, token: string, pagePath: string, hideText: boolean): string {
  const params = new URLSearchParams({ 'bl-capture': token, 'bl-page': pagePath });
  if (hideText) params.set('bl-hide-text', '1');
  return `${url}#${params}`;
}

export function captureWindowFeatures(device: HeatmapDevice): string {
  return `popup,width=${HEATMAP_DEVICE_WIDTHS[device]},height=${HEATMAP_DEVICE_VIEWPORT_HEIGHTS[device]}`;
}
