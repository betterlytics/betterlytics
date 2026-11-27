import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/env', () => ({
  env: {
    SAMPLING_TRAFFIC_THRESHOLD: 100_000,
    SAMPLING_FACTOR: 0.25,
    HIGH_TRAFFIC_CONCURRENCY_LIMIT: 20,
  },
}));

vi.mock('@/repositories/clickhouse/usage.repository', () => ({
  isHighTrafficSite: vi.fn().mockResolvedValue(false),
}));

vi.mock('@/observability/clickhouse-concurrency', () => ({
  setSiteConcurrencyLimit: vi.fn(),
}));

import { buildQuery } from '@/lib/analytics-query/query-builder/builder';
import type { EventQueryInput } from '@/lib/analytics-query/query.entities';

describe('buildQuery', () => {
  const siteId = 'test-site-id';

  it('builds an aggregate query with a single metric and no dimensions', () => {
    const input: EventQueryInput = {
      metrics: ['visitors'],
      timeRange: '7d',
      timezone: 'UTC',
      order: 'desc',
      limit: 100,
    };

    const result = buildQuery(input, siteId);

    expect(result.taggedSql).toContain('uniq(visitor_id)');
    expect(result.taggedSql).toContain('site_id');
    expect(result.taggedSql).not.toContain('GROUP BY');
    expect(result.taggedParams.site_id).toBe(siteId);
  });

  it('builds an aggregate query with metrics and dimensions', () => {
    const input: EventQueryInput = {
      metrics: ['visitors', 'pageviews'],
      dimensions: ['device_type'],
      timeRange: '28d',
      timezone: 'UTC',
      order: 'desc',
      limit: 50,
    };

    const result = buildQuery(input, siteId);

    expect(result.taggedSql).toContain('uniq(visitor_id)');
    expect(result.taggedSql).toContain("countIf(event_type = 'pageview')");
    expect(result.taggedSql).toContain('device_type');
    expect(result.taggedSql).toContain('GROUP BY');
    expect(result.taggedParams.limit).toBe(50);
  });

  it('builds a time-series query when granularity is provided', () => {
    const input: EventQueryInput = {
      metrics: ['visitors'],
      dimensions: ['country_code'],
      timeRange: '28d',
      granularity: 'day',
      timezone: 'UTC',
      order: 'desc',
      limit: 100,
    };

    const result = buildQuery(input, siteId);

    expect(result.taggedSql).toContain('date');
    expect(result.taggedSql).toContain('country_code');
    expect(result.taggedSql).toContain('uniq(visitor_id)');
  });

  it('includes filters in the query', () => {
    const input: EventQueryInput = {
      metrics: ['pageviews'],
      filters: [{ column: 'url', operator: '=', values: ['/landing'] }],
      timeRange: '7d',
      timezone: 'UTC',
      order: 'desc',
      limit: 100,
    };

    const result = buildQuery(input, siteId);

    expect(result.taggedSql).toContain('ILIKE');
  });

  it('throws on unknown metric', () => {
    const input: EventQueryInput = {
      metrics: ['nonexistent_metric'] as any,
      timeRange: '7d',
      timezone: 'UTC',
      order: 'desc',
      limit: 100,
    };

    expect(() => buildQuery(input, siteId)).toThrow('Unknown metric');
  });

  it('throws on unknown dimension', () => {
    const input: EventQueryInput = {
      metrics: ['visitors'],
      dimensions: ['nonexistent_dimension'] as any,
      timeRange: '7d',
      timezone: 'UTC',
      order: 'desc',
      limit: 100,
    };

    expect(() => buildQuery(input, siteId)).toThrow('Unknown dimension');
  });

  it('defaults orderBy to first metric', () => {
    const input: EventQueryInput = {
      metrics: ['sessions', 'visitors'],
      dimensions: ['browser'],
      timeRange: '7d',
      timezone: 'UTC',
      order: 'desc',
      limit: 100,
    };

    const result = buildQuery(input, siteId);

    expect(result.taggedSql).toContain('ORDER BY sessions DESC');
  });

  it('supports referrer_source dimension', () => {
    const input: EventQueryInput = {
      metrics: ['visitors'],
      dimensions: ['referrer_source'],
      timeRange: '7d',
      timezone: 'UTC',
      order: 'desc',
      limit: 100,
    };

    const result = buildQuery(input, siteId);

    expect(result.taggedSql).toContain('referrer_source_effective AS referrer_source');
    expect(result.taggedSql).toMatch(/GROUP BY\s+referrer_source_effective\s/);
  });

  it('keys referrer_source rows by the dimension key and sorts by it', () => {
    const input: EventQueryInput = {
      metrics: ['visitors'],
      dimensions: ['referrer_source'],
      orderBy: 'referrer_source',
      timeRange: '7d',
      timezone: 'UTC',
      order: 'asc',
      limit: 100,
    };

    const result = buildQuery(input, siteId);

    expect(result.taggedSql).toContain('referrer_source_effective AS referrer_source');
    expect(result.taggedSql).toContain('ORDER BY referrer_source ASC');
  });

  it('keys referrer_source rows by the dimension key in a time series', () => {
    const input: EventQueryInput = {
      metrics: ['visitors'],
      dimensions: ['referrer_source'],
      granularity: 'day',
      timeRange: '7d',
      timezone: 'UTC',
      order: 'desc',
      limit: 100,
    };

    const result = buildQuery(input, siteId);

    expect(result.taggedSql).toContain('referrer_source_effective AS referrer_source');
    expect(result.taggedSql).toMatch(/GROUP BY\s+date,\s*referrer_source_effective\s/);
  });

  it('supports referrer_source_name dimension', () => {
    const input: EventQueryInput = {
      metrics: ['visitors'],
      dimensions: ['referrer_source_name'],
      timeRange: '7d',
      timezone: 'UTC',
      order: 'desc',
      limit: 100,
    };

    const result = buildQuery(input, siteId);

    expect(result.taggedSql).toContain('referrer_source_name');
    expect(result.taggedSql).toContain('GROUP BY');
  });

  it('builds a query with custom date range', () => {
    const input: EventQueryInput = {
      metrics: ['visitors'],
      timeRange: 'custom',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      timezone: 'UTC',
      order: 'desc',
      limit: 100,
    };

    const result = buildQuery(input, siteId);

    expect(result.taggedSql).toContain('uniq(visitor_id)');
    expect(result.taggedParams.site_id).toBe(siteId);
  });

  it.each([
    ['America/Los_Angeles', '2026-09-20 07:00:00', '2026-09-23 06:59:59'],
    ['Asia/Tokyo', '2026-09-19 15:00:00', '2026-09-22 14:59:59'],
    ['UTC', '2026-09-20 00:00:00', '2026-09-22 23:59:59'],
  ])('reads custom dates as whole days in %s', (timezone, startDateTime, endDateTime) => {
    const input: EventQueryInput = {
      metrics: ['visitors'],
      timeRange: 'custom',
      startDate: '2026-09-20',
      endDate: '2026-09-22',
      timezone,
      order: 'desc',
      limit: 100,
    };

    const result = buildQuery(input, siteId);

    expect(result.taggedParams.start_date).toBe(startDateTime);
    expect(result.taggedParams.end_date).toBe(endDateTime);
  });

  it.each(['visitors; DROP TABLE analytics.events', 'referrer_source_effective', 'date'])(
    'rejects the aggregate sort key %s even when the input skipped schema validation',
    (orderBy) => {
      const input: EventQueryInput = {
        metrics: ['visitors'],
        dimensions: ['referrer_source'],
        orderBy,
        timeRange: '7d',
        timezone: 'UTC',
        order: 'desc',
        limit: 100,
      };

      expect(() => buildQuery(input, siteId)).toThrow();
    },
  );

  it('ignores the sort key in a time series', () => {
    const input: EventQueryInput = {
      metrics: ['visitors'],
      granularity: 'day',
      orderBy: 'date',
      timeRange: '7d',
      timezone: 'UTC',
      order: 'desc',
      limit: 100,
    };

    const result = buildQuery(input, siteId);

    expect(result.taggedSql).toContain('ORDER BY date ASC');
  });
});
