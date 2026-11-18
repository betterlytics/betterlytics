import 'server-only';

import { env } from '@/lib/env';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { fetchResponseHeadGuarded } from '@/lib/outbound-request';
import { allowsFraming } from '@/utils/framing';
import { isUrlOnDomain } from '@/utils/domainValidation';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';
import { getCaptureOrigin } from '@/services/analytics/clickHeatmap.service';

const CHECK_TIMEOUT_MS = 5000;
const CACHE_TTL_MS = 10 * 60_000;
const MAX_CACHED_PAGES = 1000;

const framingChecks = new Map<string, { frameable: boolean; checkedAt: number }>();

/**
 * The live page to show behind a heatmap when the page lets the dashboard frame it. A refused
 * frame fails silently in the browser, so the page's headers are checked here first. Only hosts
 * on the dashboard's domain are requested, and wildcard page paths have no real page to open.
 */
export async function getLivePageUrl(
  siteQuery: BASiteQuery,
  dashboardId: string,
  pagePath: string,
): Promise<string | null> {
  if (pagePath.includes('*')) return null;
  const { origin, domain } = await getCaptureOrigin(siteQuery, dashboardId, pagePath);
  const pageUrl = origin + pagePath;
  if (!isUrlOnDomain(pageUrl, domain)) return null;
  return (await isFrameable(pageUrl)) ? pageUrl : null;
}

async function isFrameable(pageUrl: string): Promise<boolean> {
  const cached = framingChecks.get(pageUrl);
  if (cached && Date.now() - cached.checkedAt < CACHE_TTL_MS) return cached.frameable;

  let frameable = false;
  try {
    const head = await fetchResponseHeadGuarded(pageUrl, isFeatureEnabled('allowPrivateTargets'), CHECK_TIMEOUT_MS);
    frameable =
      head.status >= 200 && head.status < 300 && allowsFraming(head.headers, new URL(env.PUBLIC_BASE_URL).origin);
  } catch {
    frameable = false;
  }

  if (framingChecks.size >= MAX_CACHED_PAGES) {
    const oldest = framingChecks.keys().next().value;
    if (oldest !== undefined) framingChecks.delete(oldest);
  }
  framingChecks.set(pageUrl, { frameable, checkedAt: Date.now() });
  return frameable;
}
