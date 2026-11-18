import { HEATMAP_DEVICE_WIDTHS, type HeatmapDevice } from '@/entities/analytics/clickHeatmap.entities';
import { matchPagePath, matchesPagePath, pathnameOf } from '@/utils/heatmapPagePath';
import { isUrlOnDomain } from '@/utils/domainValidation';

export type CaptureTarget = { origin: string; capturePath: string };
export type CaptureTargetError = 'empty' | 'mismatch' | 'invalidUrl' | 'otherHost';

/** The fixed parts of a page path around its `*` wildcards (grouped with data-dynamic-urls) */
export function wildcardParts(pagePath: string): string[] {
  return pagePath.split('*');
}

/** Values that fill a page path's wildcards to give a real page, for prefilling the inputs */
export function wildcardValues(pagePath: string, realPath: string): string[] {
  return matchPagePath(pagePath, realPath) ?? wildcardParts(pagePath).slice(1).map(() => '');
}

type ResolveInput = {
  pagePath: string;
  defaultOrigin: string;
  dashboardDomain: string;
  values: string[];
  customUrl: string | null;
};

/**
 * The real page a capture opens: the page path with its wildcards filled in, or a different URL
 * (a path with a query string, or a full address on the dashboard's domain) that still has to be
 * one of the pages grouped under the page path.
 */
export function resolveCaptureTarget(input: ResolveInput): CaptureTarget | { error: CaptureTargetError } {
  const { pagePath, defaultOrigin, dashboardDomain, values, customUrl } = input;

  let origin = defaultOrigin;
  let capturePath: string;
  if (customUrl !== null) {
    const trimmed = customUrl.trim();
    if (trimmed === '') return { error: 'empty' };
    if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
      capturePath = trimmed;
    } else {
      let url: URL;
      try {
        url = new URL(trimmed);
      } catch {
        return { error: 'invalidUrl' };
      }
      if (url.protocol !== 'https:' && url.protocol !== 'http:') return { error: 'invalidUrl' };
      if (!isUrlOnDomain(url.href, dashboardDomain)) return { error: 'otherHost' };
      origin = url.origin;
      capturePath = url.pathname + url.search;
    }
  } else {
    if (!isUrlOnDomain(defaultOrigin, dashboardDomain)) return { error: 'otherHost' };
    const parts = wildcardParts(pagePath);
    if (values.length < parts.length - 1 || values.some((value) => value.trim() === '')) return { error: 'empty' };
    capturePath = parts.reduce((path, part, index) => path + values[index - 1].trim() + part);
  }

  capturePath = capturePath.split('#')[0];
  if (capturePath.includes('*') || !matchesPagePath(pagePath, pathnameOf(capturePath))) return { error: 'mismatch' };
  return { origin, capturePath };
}

export function captureUrl(target: CaptureTarget, token: string, hideText: boolean): string {
  return `${target.origin}${target.capturePath}#bl-capture=${encodeURIComponent(token)}${hideText ? '&bl-hide-text=1' : ''}`;
}

// Tablet and phone layouts need a window of that width; desktop uses the editor's own window
export const CAPTURE_WINDOW: Record<HeatmapDevice, { width: number; height: number } | null> = {
  desktop: null,
  tablet: { width: HEATMAP_DEVICE_WIDTHS.tablet, height: 1024 },
  mobile: { width: HEATMAP_DEVICE_WIDTHS.mobile, height: 844 },
};
