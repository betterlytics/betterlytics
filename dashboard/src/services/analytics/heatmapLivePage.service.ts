import 'server-only';

import { env } from '@/lib/env';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { ExpiringSet } from '@/lib/expiring-set';
import { fetchResponseHeadGuarded } from '@/lib/outbound-request';
import { createSlidingWindowLimiter } from '@/lib/rate-limit';
import { allowsFraming } from '@/utils/framing';
import { isUrlOnDomain } from '@/utils/domainValidation';
import { pathnameOf } from '@/utils/heatmapPagePath';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';
import { getVisitedOrigin } from '@/services/analytics/clickHeatmap.service';

const CHECK_DEADLINE_MS = 5000;
const CACHE_TTL_MS = 10 * 60_000;
const MAX_CACHED_PAGES = 1000;
const CHECKS_PER_DASHBOARD_PER_MINUTE = 30;

const frameablePages = new ExpiringSet(CACHE_TTL_MS, MAX_CACHED_PAGES);
const unframeablePages = new ExpiringSet(CACHE_TTL_MS, MAX_CACHED_PAGES);
// One check per page at a time, and a limit per dashboard, so nobody can make the server fetch pages in a loop
const inflight = new Map<string, Promise<boolean>>();
const checkDashboardLimit = createSlidingWindowLimiter(60_000, CHECKS_PER_DASHBOARD_PER_MINUTE);

/**
 * The live page to show behind a heatmap when the page lets the dashboard frame it. A refused
 * frame fails silently in the browser, so the page's headers are checked here first. Only pages
 * visitors opened are requested, on the host they used on the dashboard's domain, and wildcard
 * page paths have no real page to open.
 */
export async function getLivePageUrl(
  siteQuery: BASiteQuery,
  dashboardId: string,
  pagePath: string,
): Promise<string | null> {
  // A bare path, so no port, query string or host comes in with it
  if (pagePath.includes('*') || !pagePath.startsWith('/') || pathnameOf(pagePath) !== pagePath) return null;
  const { origin, domain } = await getVisitedOrigin(siteQuery, dashboardId, pagePath);
  if (!origin) return null;
  const pageUrl = origin + pagePath;
  return (await isFrameable(pageUrl, domain, dashboardId)) ? pageUrl : null;
}

function isFrameable(pageUrl: string, domain: string, dashboardId: string): Promise<boolean> {
  if (frameablePages.has(pageUrl)) return Promise.resolve(true);
  if (unframeablePages.has(pageUrl)) return Promise.resolve(false);
  const pending = inflight.get(pageUrl);
  if (pending) return pending;
  if (!checkDashboardLimit(dashboardId).allowed) return Promise.resolve(false);

  const allowPrivateTargets = isFeatureEnabled('allowPrivateTargets');
  const check = fetchResponseHeadGuarded(pageUrl, {
    allowPrivateTargets,
    deadlineMs: CHECK_DEADLINE_MS,
    // Redirects too stay on the dashboard's domain, and on the default ports unless private targets are allowed
    allowUrl: (url) => isUrlOnDomain(url.href, domain) && (allowPrivateTargets || url.port === ''),
  })
    .then(
      (head) =>
        head.status >= 200 &&
        head.status < 300 &&
        allowsFraming(head.headers, new URL(env.PUBLIC_BASE_URL).origin),
    )
    .catch(() => false)
    .then((frameable) => {
      (frameable ? frameablePages : unframeablePages).add(pageUrl);
      (frameable ? unframeablePages : frameablePages).delete(pageUrl);
      return frameable;
    })
    .finally(() => inflight.delete(pageUrl));
  inflight.set(pageUrl, check);
  return check;
}
