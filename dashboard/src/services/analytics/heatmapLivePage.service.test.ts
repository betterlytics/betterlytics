import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getLivePageUrl } from './heatmapLivePage.service';
import { getVisitedOrigin } from '@/services/analytics/clickHeatmap.service';
import { fetchResponseHeadGuarded } from '@/lib/outbound-request';
import type { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/env', () => ({ env: { PUBLIC_BASE_URL: 'https://betterlytics.io' } }));
vi.mock('@/lib/feature-flags', () => ({ isFeatureEnabled: () => false }));
vi.mock('@/services/analytics/clickHeatmap.service', () => ({ getVisitedOrigin: vi.fn() }));
vi.mock('@/lib/outbound-request', () => ({ fetchResponseHeadGuarded: vi.fn() }));

const siteQuery = { siteId: 'site' } as unknown as BASiteQuery;
let page = 0;

function head(status: number, headers: Record<string, string> = {}) {
  return { status, headers };
}

beforeEach(() => {
  vi.resetAllMocks();
  // A fresh path per test keeps the framing cache out of the way
  page++;
  vi.mocked(getVisitedOrigin).mockResolvedValue({ origin: 'https://www.example.com', domain: 'example.com' });
});

describe('getLivePageUrl', () => {
  it('frames a page that allows it', async () => {
    vi.mocked(fetchResponseHeadGuarded).mockResolvedValue(head(200));
    await expect(getLivePageUrl(siteQuery, 'dash', `/page-${page}`)).resolves.toBe(`https://www.example.com/page-${page}`);
  });

  it('skips pages that refuse framing or fail to load', async () => {
    vi.mocked(fetchResponseHeadGuarded).mockResolvedValueOnce(head(200, { 'x-frame-options': 'DENY' }));
    await expect(getLivePageUrl(siteQuery, 'dash', `/page-${page}-a`)).resolves.toBeNull();
    vi.mocked(fetchResponseHeadGuarded).mockResolvedValueOnce(head(404));
    await expect(getLivePageUrl(siteQuery, 'dash', `/page-${page}-b`)).resolves.toBeNull();
    vi.mocked(fetchResponseHeadGuarded).mockRejectedValueOnce(new Error('Blocked target'));
    await expect(getLivePageUrl(siteQuery, 'dash', `/page-${page}-c`)).resolves.toBeNull();
  });

  it('only requests bare paths of pages visitors opened', async () => {
    for (const path of ['/profile/*/posts', ':8443/', '/pricing?plan=pro', '//evil.test/', '/a/../admin']) {
      await expect(getLivePageUrl(siteQuery, 'dash', path)).resolves.toBeNull();
    }
    vi.mocked(getVisitedOrigin).mockResolvedValue({ origin: null, domain: 'example.com' });
    await expect(getLivePageUrl(siteQuery, 'dash', `/page-${page}`)).resolves.toBeNull();
    expect(fetchResponseHeadGuarded).not.toHaveBeenCalled();
  });

  it('keeps redirects on the dashboard domain and the default ports', async () => {
    vi.mocked(fetchResponseHeadGuarded).mockResolvedValue(head(200));
    await getLivePageUrl(siteQuery, 'dash', `/page-${page}`);

    const { allowUrl } = vi.mocked(fetchResponseHeadGuarded).mock.calls[0][1];
    expect(allowUrl(new URL('https://shop.example.com/pricing'))).toBe(true);
    expect(allowUrl(new URL('https://evil.test/'))).toBe(false);
    expect(allowUrl(new URL('https://www.example.com:8443/'))).toBe(false);
  });

  it('checks a page once at a time and remembers the answer for a while', async () => {
    vi.mocked(fetchResponseHeadGuarded).mockResolvedValue(head(200));
    await Promise.all([
      getLivePageUrl(siteQuery, 'dash', `/page-${page}`),
      getLivePageUrl(siteQuery, 'dash', `/page-${page}`),
    ]);
    await getLivePageUrl(siteQuery, 'dash', `/page-${page}`);
    expect(fetchResponseHeadGuarded).toHaveBeenCalledTimes(1);
  });
});
