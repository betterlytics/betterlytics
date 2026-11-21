import {
  HEATMAP_DEVICE_VIEWPORT_HEIGHTS,
  HEATMAP_DEVICE_WIDTHS,
  type HeatmapDevice,
} from '@/entities/analytics/clickHeatmap.entities';
import type { HeatmapCapture } from '@/entities/analytics/heatmapCaptures.entities';
import { isUrlOnDomain } from '@/utils/domainValidation';

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

/**
 * The address the dialog starts from: the page captured last on the dashboard's domain, else the
 * page path on the suggested origin. Any link holder can upload a snapshot of any host, so an
 * address off the domain is never offered to the next editor along with a fresh link.
 */
export function initialCaptureAddress(
  pagePath: string,
  site: { origin: string; domain: string } | null | undefined,
  pageCaptures: HeatmapCapture[],
): string | null {
  if (!site) return null;
  const onDomain = pageCaptures.find((capture) => isUrlOnDomain(capture.capturedFromUrl, site.domain));
  return onDomain?.capturedFromUrl ?? `${site.origin}${pagePath}`;
}

// The page path lets the panel on the page tell the editor when a page isn't one the heatmap covers
export function captureUrl(url: string, token: string, pagePath: string, hideText: boolean): string {
  const params = new URLSearchParams({ 'bl-capture': token, 'bl-page': pagePath });
  if (hideText) params.set('bl-hide-text', '1');
  return `${url}#${params}`;
}

// The most common desktop screen. Desktop windows fill the editor's screen up to this size, so
// captures on large monitors stay at a width most visitors have.
const DESKTOP_MAX_WINDOW = { width: 1920, height: 1080 };

type CaptureScreen = Pick<Screen, 'availWidth' | 'availHeight'> & { availLeft?: number; availTop?: number };

export function captureWindowFeatures(device: HeatmapDevice, screen: CaptureScreen): string {
  if (device !== 'desktop') {
    return `popup,width=${HEATMAP_DEVICE_WIDTHS[device]},height=${HEATMAP_DEVICE_VIEWPORT_HEIGHTS[device]}`;
  }
  const width = Math.min(screen.availWidth, DESKTOP_MAX_WINDOW.width);
  const height = Math.min(screen.availHeight, DESKTOP_MAX_WINDOW.height);
  return `popup,width=${width},height=${height},left=${screen.availLeft ?? 0},top=${screen.availTop ?? 0}`;
}
