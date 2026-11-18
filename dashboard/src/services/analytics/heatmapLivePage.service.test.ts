import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getLivePageUrl } from './heatmapLivePage.service';
import { getCaptureOrigin } from '@/services/analytics/clickHeatmap.service';
import { fetchResponseHeadGuarded } from '@/lib/outbound-request';
import type { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/env', () => ({ env: { PUBLIC_BASE_URL: 'https://betterlytics.io' } }));
vi.mock('@/lib/feature-flags', () => ({ isFeatureEnabled: () => false }));
vi.mock('@/services/analytics/clickHeatmap.service', () => ({ getCaptureOrigin: vi.fn() }));
vi.mock('@/lib/outbound-request', () => ({ fetchResponseHeadGuarded: vi.fn() }));

const siteQuery = { siteId: 'site' } as unknown as BASiteQuery;
let page = 0;

function head(status: number, headers: Record<string, string> = {}) {
  return { status, headers, url: 'https://www.example.com/' };
}

beforeEach(() => {
  vi.resetAllMocks();
  // A fresh path per test keeps the framing cache out of the way
  page++;
  vi.mocked(getCaptureOrigin).mockResolvedValue({ origin: 'https://www.example.com', domain: 'example.com' });
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

  it('never requests wildcard pages or hosts off the dashboard domain', async () => {
    await expect(getLivePageUrl(siteQuery, 'dash', '/profile/*/posts')).resolves.toBeNull();
    vi.mocked(getCaptureOrigin).mockResolvedValue({ origin: 'https://evil.test', domain: 'example.com' });
    await expect(getLivePageUrl(siteQuery, 'dash', `/page-${page}`)).resolves.toBeNull();
    expect(fetchResponseHeadGuarded).not.toHaveBeenCalled();
  });

  it('remembers the answer for a while', async () => {
    vi.mocked(fetchResponseHeadGuarded).mockResolvedValue(head(200));
    await getLivePageUrl(siteQuery, 'dash', `/page-${page}`);
    await getLivePageUrl(siteQuery, 'dash', `/page-${page}`);
    expect(fetchResponseHeadGuarded).toHaveBeenCalledTimes(1);
  });
});
