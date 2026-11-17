import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getHeatmapClicksForPage, getHeatmapDeviceSharesForPage } from './clickHeatmap.service';
import {
  getHeatmapClickPoints,
  getHeatmapDeviceShares,
  getHeatmapPageStats,
} from '@/repositories/clickhouse/clickHeatmap.repository';
import type { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

vi.mock('@/repositories/clickhouse/clickHeatmap.repository', () => ({
  getHeatmapClickPoints: vi.fn(),
  getHeatmapDeviceShares: vi.fn(),
  getHeatmapPageStats: vi.fn(),
  getHeatmapPages: vi.fn(),
  hasHeatmapClicks: vi.fn(),
}));

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
