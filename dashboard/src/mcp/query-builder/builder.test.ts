import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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

import { buildQuery } from '@/mcp/query-builder/builder';
import { McpQueryInput, McpQueryInputSchema } from '@/mcp/entities/mcp.entities';

describe('buildQuery', () => {
  const siteId = 'test-site-id';

  it('builds an aggregate query with a single metric and no dimensions', () => {
    const input: McpQueryInput = {
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
    const input: McpQueryInput = {
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
    const input: McpQueryInput = {
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
    const input: McpQueryInput = {
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
    const input: McpQueryInput = {
      metrics: ['nonexistent_metric'] as any,
      timeRange: '7d',
      timezone: 'UTC',
      order: 'desc',
      limit: 100,
    };

    expect(() => buildQuery(input, siteId)).toThrow('Unknown metric');
  });

  it('throws on unknown dimension', () => {
    const input: McpQueryInput = {
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
    const input: McpQueryInput = {
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
    const input: McpQueryInput = {
      metrics: ['visitors'],
      dimensions: ['referrer_source'],
      timeRange: '7d',
      timezone: 'UTC',
      order: 'desc',
      limit: 100,
    };

    const result = buildQuery(input, siteId);

    expect(result.taggedSql).toContain('referrer_source');
    expect(result.taggedSql).toContain('GROUP BY');
  });

  it('supports referrer_source_name dimension', () => {
    const input: McpQueryInput = {
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
    const input: McpQueryInput = {
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
});

describe('buildQuery timezone handling', () => {
  const siteId = 'test-site-id';
  const customRange = { timeRange: 'custom', startDate: '2026-01-05', endDate: '2026-01-18' } as const;
  const shortCustomRange = { timeRange: 'custom', startDate: '2026-01-10', endDate: '2026-01-11' } as const;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-03-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function build(timezone: string, overrides: Partial<McpQueryInput> = {}) {
    return buildQuery(
      { metrics: ['pageviews'], timeRange: '7d', timezone, order: 'desc', limit: 100, ...overrides },
      siteId,
    );
  }

  function bounds(result: ReturnType<typeof buildQuery>) {
    return { start: result.taggedParams.start_date, end: result.taggedParams.end_date };
  }

  describe.each(['Foo/Bar', 'Etc/Unknown', '', '   '])('invalid timezone %j', (timezone) => {
    it('uses UTC bounds for a preset aggregate query', () => {
      expect(bounds(build(timezone))).toEqual(bounds(build('Etc/UTC')));
    });

    it('uses UTC bounds and binds the fallback zone for a custom daily time series', () => {
      const result = build(timezone, { ...customRange, granularity: 'day' });

      expect(bounds(result)).toEqual(bounds(build('Etc/UTC', { ...customRange, granularity: 'day' })));
      expect(result.taggedParams.timezone).toBe('Etc/UTC');
      expect(result.taggedParams.site_id).toBe(siteId);
      expect(result.taggedSql).toContain('{timezone:String}');
    });
  });

  it('uses UTC for an hourly time series with an invalid timezone', () => {
    const result = build('Foo/Bar', { ...shortCustomRange, granularity: 'hour' });

    expect(result).toEqual(build('Etc/UTC', { ...shortCustomRange, granularity: 'hour' }));
    expect(result.taggedParams.timezone).toBe('Etc/UTC');
  });

  it('keeps a recognized non-UTC zone for bounds and parameters', () => {
    const result = build('America/New_York', { ...customRange, granularity: 'day' });

    expect(result.taggedParams.timezone).toBe('America/New_York');
    expect(bounds(result)).not.toEqual(bounds(build('UTC', { ...customRange, granularity: 'day' })));
  });

  it('normalizes the letter case of a recognized zone', () => {
    expect(build('europe/berlin', { ...customRange, granularity: 'day' })).toEqual(
      build('Europe/Berlin', { ...customRange, granularity: 'day' }),
    );
    expect(build('europe/berlin')).toEqual(build('Europe/Berlin'));
    expect(build('europe/berlin', { granularity: 'day' }).taggedParams.timezone).toBe('Europe/Berlin');
  });

  it('accepts UTC and Etc/UTC', () => {
    const utc = build('UTC', { ...customRange, granularity: 'day' });
    const etcUtc = build('Etc/UTC', { ...customRange, granularity: 'day' });

    expect(utc.taggedParams.timezone).toBe('UTC');
    expect(etcUtc.taggedParams.timezone).toBe('Etc/UTC');
    expect(bounds(utc)).toEqual(bounds(etcUtc));
  });

  it('defaults an omitted timezone to UTC', () => {
    const parsed = McpQueryInputSchema.parse({ metrics: ['pageviews'], ...customRange, granularity: 'day' });
    const result = buildQuery(parsed, siteId);

    expect(result.taggedParams.timezone).toBe('UTC');
    expect(bounds(result)).toEqual(bounds(build('UTC', { ...customRange, granularity: 'day' })));
  });
});
