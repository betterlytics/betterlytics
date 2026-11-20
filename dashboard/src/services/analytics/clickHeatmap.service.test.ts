import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getCaptureOrigin,
  getHeatmapBackground,
  getHeatmapClicksForPage,
  getHeatmapDeviceSharesForPage,
  getHeatmapPageHeightSince,
} from './clickHeatmap.service';
import {
  getHeatmapClickPoints,
  getHeatmapDeviceShares,
  getHeatmapPageStats,
  getHeatmapSessionHeights,
  getMostVisitedHost,
} from '@/repositories/clickhouse/clickHeatmap.repository';
import { findLatestReplaySnapshot } from '@/repositories/clickhouse/replaySnapshots.repository';
import { findDashboardById } from '@/repositories/postgres/dashboard.repository';
import type { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

vi.mock('@/repositories/clickhouse/clickHeatmap.repository', () => ({
  getHeatmapClickAnchors: vi.fn(),
  getHeatmapClickPoints: vi.fn(),
  getHeatmapDeviceShares: vi.fn(),
  getHeatmapPageStats: vi.fn(),
  getHeatmapPages: vi.fn(),
  getHeatmapSessionHeights: vi.fn(),
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

describe('getHeatmapDeviceSharesForPage', () => {
  it('lists every device in tab order, with zero for devices without clicks', async () => {
    vi.mocked(getHeatmapDeviceShares).mockResolvedValue([
      { device: 'mobile', clicks: 30 },
      { device: 'desktop', clicks: 65 },
    ]);

    await expect(getHeatmapDeviceSharesForPage(siteQuery, '/')).resolves.toEqual([
      { device: 'desktop', clicks: 65 },
      { device: 'tablet', clicks: 0 },
      { device: 'mobile', clicks: 30 },
    ]);
  });
});

describe('getHeatmapClicksForPage', () => {
  it('draws at the device width and asks for points scaled to it', async () => {
    vi.mocked(getHeatmapClickPoints).mockResolvedValue([{ x: 180, y: 1800, count: 3 }]);
    vi.mocked(getHeatmapPageStats).mockResolvedValue({ documentHeight: 4800, fixedClicks: 0 });

    const result = await getHeatmapClicksForPage(siteQuery, '/', 'mobile');

    expect(result).toEqual({ width: 390, height: 4800, points: [{ x: 180, y: 1800, count: 3 }], fixedClicks: 0 });
    expect(getHeatmapClickPoints).toHaveBeenCalledWith(siteQuery, '/', 'mobile', 390, 20000);
  });

  it('grows the page to fit clicks below the typical document height', async () => {
    vi.mocked(getHeatmapClickPoints).mockResolvedValue([{ x: 10, y: 3000, count: 1 }]);
    vi.mocked(getHeatmapPageStats).mockResolvedValue({ documentHeight: 2400, fixedClicks: 0 });

    const { height } = await getHeatmapClicksForPage(siteQuery, '/', 'desktop');

    expect(height).toBe(3044);
  });

  it('keeps the page height and reports fixed clicks when every click is on a fixed element', async () => {
    vi.mocked(getHeatmapClickPoints).mockResolvedValue([]);
    vi.mocked(getHeatmapPageStats).mockResolvedValue({ documentHeight: 1600, fixedClicks: 8 });

    const { height, points, fixedClicks } = await getHeatmapClicksForPage(siteQuery, '/', 'tablet');

    expect(height).toBe(1600);
    expect(points).toEqual([]);
    expect(fixedClicks).toBe(8);
  });

  it('caps very tall pages', async () => {
    vi.mocked(getHeatmapClickPoints).mockResolvedValue([]);
    vi.mocked(getHeatmapPageStats).mockResolvedValue({ documentHeight: 90000, fixedClicks: 0 });

    const { height } = await getHeatmapClicksForPage(siteQuery, '/', 'desktop');

    expect(height).toBe(20000);
  });
});

describe('getHeatmapPageHeightSince', () => {
  const period = {
    siteId: 'test-site',
    startDateTime: '2026-11-01 00:00:00',
    endDateTime: '2026-11-30 23:59:59',
  } as unknown as BASiteQuery;

  it('counts sessions near the capture width from the later of the period start and the capture', async () => {
    vi.mocked(getHeatmapSessionHeights).mockResolvedValue({ documentHeight: 3200, sessions: 12 });

    await expect(
      getHeatmapPageHeightSince(period, '/pricing', 'desktop', 1280, new Date('2026-11-10T08:30:00Z')),
    ).resolves.toBe(3200);
    expect(getHeatmapSessionHeights).toHaveBeenCalledWith(
      period,
      '/pricing',
      'desktop',
      { min: 1152, max: 1408 },
      '2026-11-10 08:30:00',
    );

    await getHeatmapPageHeightSince(period, '/pricing', 'desktop', 1280, new Date('2026-10-01T00:00:00Z'));
    expect(getHeatmapSessionHeights).toHaveBeenLastCalledWith(
      period,
      '/pricing',
      'desktop',
      { min: 1152, max: 1408 },
      '2026-11-01 00:00:00',
    );
  });

  it('gives no height for a period before the capture or with too few sessions', async () => {
    await expect(
      getHeatmapPageHeightSince(period, '/pricing', 'desktop', 1280, new Date('2026-12-05T00:00:00Z')),
    ).resolves.toBeNull();
    expect(getHeatmapSessionHeights).not.toHaveBeenCalled();

    vi.mocked(getHeatmapSessionHeights).mockResolvedValue({ documentHeight: 3200, sessions: 4 });
    await expect(
      getHeatmapPageHeightSince(period, '/pricing', 'desktop', 1280, new Date('2026-11-10T00:00:00Z')),
    ).resolves.toBeNull();
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
    });
    expect(getMostVisitedHost).toHaveBeenCalledWith(siteQuery, '/pricing', 'example.com', { anyHost: true });
  });

  it("opens a host off the dashboard's domain when the page is only visited there", async () => {
    vi.mocked(getMostVisitedHost).mockResolvedValue('shop.example.de');
    vi.mocked(findDashboardById).mockResolvedValue(dashboard('example.com'));

    await expect(getCaptureOrigin(siteQuery, 'dash', '/pricing')).resolves.toEqual({
      origin: 'https://shop.example.de',
    });
  });

  it("falls back to the dashboard's domain, and uses http for local hosts", async () => {
    vi.mocked(getMostVisitedHost).mockResolvedValue(null);
    vi.mocked(findDashboardById).mockResolvedValue(dashboard('shop.localhost'));

    await expect(getCaptureOrigin(siteQuery, 'dash', '/pricing')).resolves.toEqual({
      origin: 'http://shop.localhost',
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
      });
    });

    it("doesn't give the dashboard's port to another local host", async () => {
      vi.mocked(getMostVisitedHost).mockResolvedValue(null);
      vi.mocked(findDashboardById).mockResolvedValue(dashboard('localhost'));

      await expect(getCaptureOrigin(siteQuery, 'dash', '/pricing')).resolves.toEqual({
        origin: 'http://localhost',
      });
    });

    it('leaves other hosts alone', async () => {
      vi.mocked(getMostVisitedHost).mockResolvedValue('www.example.com');
      vi.mocked(findDashboardById).mockResolvedValue(dashboard('example.com'));

      await expect(getCaptureOrigin(siteQuery, 'dash', '/pricing')).resolves.toEqual({
        origin: 'https://www.example.com',
      });
    });
  });
});
