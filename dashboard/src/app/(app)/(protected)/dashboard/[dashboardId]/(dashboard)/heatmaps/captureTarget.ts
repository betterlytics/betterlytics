import {
  HEATMAP_DEVICE_VIEWPORT_HEIGHTS,
  HEATMAP_DEVICE_WIDTHS,
  type HeatmapDevice,
} from '@/entities/analytics/clickHeatmap.entities';
import type { HeatmapCapture } from '@/entities/analytics/heatmapCaptures.entities';
import { matchesPagePath, pathnameOf } from '@/utils/heatmapPagePath';
import { isUrlOnDomain } from '@/utils/domainValidation';

export type CaptureTarget = { origin: string; capturePath: string };
export type CaptureTargetError = 'empty' | 'wildcard' | 'mismatch' | 'invalidUrl' | 'otherHost';

type ResolveInput = {
  pagePath: string;
  defaultOrigin: string;
  dashboardDomain: string;
  address: string;
};

/**
 * The real page a capture opens: a path on the default origin (query string allowed), or a full
 * address on the dashboard's domain. It has to be one of the pages grouped under the page path.
 */
export function resolveCaptureTarget(input: ResolveInput): CaptureTarget | { error: CaptureTargetError } {
  const { pagePath, defaultOrigin, dashboardDomain } = input;
  const address = input.address.trim();
  if (address === '') return { error: 'empty' };

  let origin = defaultOrigin;
  let capturePath: string;
  if (address.startsWith('/') && !address.startsWith('//')) {
    if (!isUrlOnDomain(defaultOrigin, dashboardDomain)) return { error: 'otherHost' };
    capturePath = address;
  } else {
    let url: URL;
    try {
      url = new URL(address);
    } catch {
      return { error: 'invalidUrl' };
    }
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return { error: 'invalidUrl' };
    if (!isUrlOnDomain(url.href, dashboardDomain)) return { error: 'otherHost' };
    origin = url.origin;
    capturePath = url.pathname + url.search;
  }

  capturePath = capturePath.split('#')[0];
  if (capturePath.includes('*')) return { error: 'wildcard' };
  if (!matchesPagePath(pagePath, pathnameOf(capturePath))) return { error: 'mismatch' };
  return { origin, capturePath };
}

/** The page the capture dialog starts from: the real page captured last time, else the page path itself */
export function initialCaptureAddress(pagePath: string, pageCaptures: HeatmapCapture[]): string {
  return pageCaptures[0]?.capturedFromPath ?? pagePath;
}

export function captureUrl(target: CaptureTarget, token: string, hideText: boolean): string {
  return `${target.origin}${target.capturePath}#bl-capture=${encodeURIComponent(token)}${hideText ? '&bl-hide-text=1' : ''}`;
}

// Tablet and phone layouts need a window of that width; desktop uses the editor's own window
export const CAPTURE_WINDOW: Record<HeatmapDevice, { width: number; height: number } | null> = {
  desktop: null,
  tablet: { width: HEATMAP_DEVICE_WIDTHS.tablet, height: HEATMAP_DEVICE_VIEWPORT_HEIGHTS.tablet },
  mobile: { width: HEATMAP_DEVICE_WIDTHS.mobile, height: HEATMAP_DEVICE_VIEWPORT_HEIGHTS.mobile },
};
