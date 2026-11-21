import { describe, it, expect, vi, beforeEach } from 'vitest';

const query = vi.hoisted(() => vi.fn());

vi.mock('@/lib/clickhouse', () => ({
  clickhouse: { query },
}));

import { getHeatmapPages } from './clickHeatmap.repository';
import type { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

const siteQuery = {
  siteId: 'test-site',
  startDateTime: '2026-01-01 00:00:00',
  endDateTime: '2026-01-31 23:59:59',
} as BASiteQuery;

describe('getHeatmapPages', () => {
  beforeEach(() => {
    query.mockReset();
    query.mockReturnValue({
      toPromise: () =>
        Promise.resolve([
          { url: '/pricing', devices: ['desktop', 'mobile'] },
          { url: '/blog', devices: [] },
        ]),
    });
  });

  it('lists pages visited in the period with the devices they have clicks from', async () => {
    await expect(getHeatmapPages(siteQuery, 5000)).resolves.toEqual([
      { url: '/pricing', devices: ['desktop', 'mobile'] },
      { url: '/blog', devices: [] },
    ]);

    const [sql, { params }] = query.mock.calls[0];
    expect(sql).toContain('analytics.events');
    expect(sql).toContain('analytics.heatmap_clicks');
    expect(params).toMatchObject({
      site_id: 'test-site',
      start_date: '2026-01-01 00:00:00',
      end_date: '2026-01-31 23:59:59',
      devices: ['desktop', 'tablet', 'mobile'],
      limit: 5000,
    });
  });
});
