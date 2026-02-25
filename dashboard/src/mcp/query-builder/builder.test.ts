import { describe, it, expect } from 'vitest';
import { buildQuery } from '@/mcp/query-builder/builder';
import { McpQueryInput } from '@/mcp/query-builder/validation';

describe('buildQuery', () => {
  const siteId = 'test-site-id';
  const timezone = 'UTC';

  it('builds an aggregate query with a single metric and no dimensions', () => {
    const input: McpQueryInput = {
      metrics: ['visitors'],
      timeRange: '7d',
      order: 'desc',
      limit: 100,
    };

    const result = buildQuery(input, siteId, timezone);

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
      order: 'desc',
      limit: 50,
    };

    const result = buildQuery(input, siteId, timezone);

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
      order: 'desc',
      limit: 100,
    };

    const result = buildQuery(input, siteId, timezone);

    expect(result.taggedSql).toContain('date');
    expect(result.taggedSql).toContain('country_code');
    expect(result.taggedSql).toContain('uniq(visitor_id)');
  });

  it('includes filters in the query', () => {
    const input: McpQueryInput = {
      metrics: ['pageviews'],
      filters: [{ column: 'url', operator: '=', values: ['/landing'] }],
      timeRange: '7d',
      order: 'desc',
      limit: 100,
    };

    const result = buildQuery(input, siteId, timezone);

    expect(result.taggedSql).toContain('ILIKE');
  });

  it('throws on unknown metric', () => {
    const input: McpQueryInput = {
      metrics: ['nonexistent_metric'] as any,
      timeRange: '7d',
      order: 'desc',
      limit: 100,
    };

    expect(() => buildQuery(input, siteId, timezone)).toThrow('Unknown metric');
  });

  it('throws on unknown dimension', () => {
    const input: McpQueryInput = {
      metrics: ['visitors'],
      dimensions: ['nonexistent_dimension'] as any,
      timeRange: '7d',
      order: 'desc',
      limit: 100,
    };

    expect(() => buildQuery(input, siteId, timezone)).toThrow('Unknown dimension');
  });

  it('defaults orderBy to first metric', () => {
    const input: McpQueryInput = {
      metrics: ['sessions', 'visitors'],
      dimensions: ['browser'],
      timeRange: '7d',
      order: 'desc',
      limit: 100,
    };

    const result = buildQuery(input, siteId, timezone);

    expect(result.taggedSql).toContain('ORDER BY sessions DESC');
  });
});
