import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getCaptureOrigin, getHeatmapBackground, getHeatmapClicksForPage } from './clickHeatmap.service';
import { getHeatmapClickPoints, getMostVisitedHost } from '@/repositories/clickhouse/clickHeatmap.repository';
import { findLatestReplaySnapshot } from '@/repositories/clickhouse/replaySnapshots.repository';
import { findDashboardById } from '@/repositories/postgres/dashboard.repository';
import type { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

vi.mock('@/repositories/clickhouse/clickHeatmap.repository', () => ({
  getHeatmapClickAnchors: vi.fn(),
  getHeatmapClickPoints: vi.fn(),
  getHeatmapPages: vi.fn(),
  getMostVisitedHost: vi.fn(),
  hasHeatmapClicks: vi.fn(),
}));

vi.mock('@/repositories/clickhouse/replaySnapshots.repository', () => ({
  findLatestReplaySnapshot: vi.fn(),
}));

vi.mock('@/repositories/postgres/dashboard.repository', () => ({
  findDashboardById: vi.fn(),
}));

const mockEnv = vi.hoisted(() => ({ IS_DEVELOPMENT: false, PUBLIC_BASE_URL: 'http://run-3.localhost:3020' }));
vi.mock('@/lib/env', () => ({ env: mockEnv }));

const siteQuery = { siteId: 'test-site' } as unknown as BASiteQuery;

beforeEach(() => {
  vi.resetAllMocks();
});

describe('getHeatmapClicksForPage', () => {
  it('draws at the device width and asks for points scaled to it', async () => {
    vi.mocked(getHeatmapClickPoints).mockResolvedValue([{ x: 180, y: 1800, count: 3 }]);

    const result = await getHeatmapClicksForPage(siteQuery, '/', 'mobile');

    expect(result).toEqual({ width: 390, points: [{ x: 180, y: 1800, count: 3 }] });
    expect(getHeatmapClickPoints).toHaveBeenCalledWith(siteQuery, '/', 'mobile', 390, 20000);
  });
});

describe('getHeatmapBackground', () => {
  it("uses a visitor's replay snapshot of the page on that device", async () => {
    const snapshot = {
      sessionId: '42',
      filename: '1755600020000-abc123-0001.json',
      snapshotMs: 1755600005000,
      viewportWidth: 1263,
      viewportHeight: 900,
      recordedAtMs: 1755600005000,
    };
    vi.mocked(findLatestReplaySnapshot).mockResolvedValue(snapshot);

    await expect(getHeatmapBackground(siteQuery, '/pricing', 'desktop')).resolves.toEqual({
      kind: 'replay',
      snapshot,
    });
    expect(findLatestReplaySnapshot).toHaveBeenCalledWith(siteQuery, '/pricing', 'desktop');
  });

  it('has no background without a snapshot', async () => {
    vi.mocked(findLatestReplaySnapshot).mockResolvedValue(null);

    await expect(getHeatmapBackground(siteQuery, '/pricing', 'mobile')).resolves.toEqual({ kind: 'none' });
  });
});

describe('getCaptureOrigin', () => {
  const dashboard = (domain: string) => ({ domain }) as Awaited<ReturnType<typeof findDashboardById>>;

  it('opens the host most visitors used, over https', async () => {
    vi.mocked(getMostVisitedHost).mockResolvedValue('www.example.com');
    vi.mocked(findDashboardById).mockResolvedValue(dashboard('example.com'));

    await expect(getCaptureOrigin(siteQuery, 'dash', '/pricing')).resolves.toEqual({
      origin: 'https://www.example.com',
      domain: 'example.com',
    });
    expect(getMostVisitedHost).toHaveBeenCalledWith(siteQuery, '/pricing', 'example.com', { anyHost: true });
  });

  it("opens a host off the dashboard's domain when the page is only visited there", async () => {
    vi.mocked(getMostVisitedHost).mockResolvedValue('shop.example.de');
    vi.mocked(findDashboardById).mockResolvedValue(dashboard('example.com'));

    await expect(getCaptureOrigin(siteQuery, 'dash', '/pricing')).resolves.toEqual({
      origin: 'https://shop.example.de',
      domain: 'example.com',
    });
  });

  it("falls back to the dashboard's domain, and uses http for local hosts", async () => {
    vi.mocked(getMostVisitedHost).mockResolvedValue(null);
    vi.mocked(findDashboardById).mockResolvedValue(dashboard('shop.localhost'));

    await expect(getCaptureOrigin(siteQuery, 'dash', '/pricing')).resolves.toEqual({
      origin: 'http://shop.localhost',
      domain: 'shop.localhost',
    });
  });

  describe('in development', () => {
    beforeEach(() => {
      mockEnv.IS_DEVELOPMENT = true;
    });
    afterEach(() => {
      mockEnv.IS_DEVELOPMENT = false;
    });

    it("opens the dashboard's own host on its port", async () => {
      vi.mocked(getMostVisitedHost).mockResolvedValue('run-3.localhost');
      vi.mocked(findDashboardById).mockResolvedValue(dashboard('localhost'));

      await expect(getCaptureOrigin(siteQuery, 'dash', '/pricing')).resolves.toEqual({
        origin: 'http://run-3.localhost:3020',
        domain: 'localhost',
      });
    });

    it("doesn't give the dashboard's port to another local host", async () => {
      vi.mocked(getMostVisitedHost).mockResolvedValue(null);
      vi.mocked(findDashboardById).mockResolvedValue(dashboard('localhost'));

      await expect(getCaptureOrigin(siteQuery, 'dash', '/pricing')).resolves.toEqual({
        origin: 'http://localhost',
        domain: 'localhost',
      });
    });

    it('leaves other hosts alone', async () => {
      vi.mocked(getMostVisitedHost).mockResolvedValue('www.example.com');
      vi.mocked(findDashboardById).mockResolvedValue(dashboard('example.com'));

      await expect(getCaptureOrigin(siteQuery, 'dash', '/pricing')).resolves.toEqual({
        origin: 'https://www.example.com',
        domain: 'example.com',
      });
    });
  });
});
