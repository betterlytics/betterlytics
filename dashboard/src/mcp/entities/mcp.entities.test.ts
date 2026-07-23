import { describe, it, expect } from 'vitest';
import { McpQueryInputSchema } from '@/mcp/entities/mcp.entities';

describe('McpQueryInputSchema', () => {
  it('accepts valid input with all fields', () => {
    const input = {
      metrics: ['visitors', 'pageviews'],
      dimensions: ['device_type'],
      filters: [{ column: 'url', operator: '=', values: ['/'] }],
      timeRange: '28d',
      granularity: 'day',
      orderBy: 'visitors',
      order: 'desc',
      limit: 50,
    };
    const result = McpQueryInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('applies defaults for limit and order', () => {
    const input = { metrics: ['visitors'], timeRange: '7d' };
    const result = McpQueryInputSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(100);
      expect(result.data.order).toBe('desc');
    }
  });

  it('rejects empty metrics array', () => {
    const result = McpQueryInputSchema.safeParse({ metrics: [], timeRange: '7d' });
    expect(result.success).toBe(false);
  });

  it('rejects unknown metric keys', () => {
    const result = McpQueryInputSchema.safeParse({ metrics: ['fake_metric'], timeRange: '7d' });
    expect(result.success).toBe(false);
  });

  it('rejects unknown dimension keys', () => {
    const result = McpQueryInputSchema.safeParse({
      metrics: ['visitors'],
      dimensions: ['fake_dim'],
      timeRange: '7d',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid time range', () => {
    const result = McpQueryInputSchema.safeParse({ metrics: ['visitors'], timeRange: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('rejects limit above 10000', () => {
    const result = McpQueryInputSchema.safeParse({ metrics: ['visitors'], timeRange: '7d', limit: 50000 });
    expect(result.success).toBe(false);
  });

  it('rejects limit of 0', () => {
    const result = McpQueryInputSchema.safeParse({ metrics: ['visitors'], timeRange: '7d', limit: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects negative limit', () => {
    const result = McpQueryInputSchema.safeParse({ metrics: ['visitors'], timeRange: '7d', limit: -1 });
    expect(result.success).toBe(false);
  });

  it('accepts date as orderBy for time-series queries', () => {
    const result = McpQueryInputSchema.safeParse({
      metrics: ['visitors'],
      timeRange: '7d',
      granularity: 'day',
      orderBy: 'date',
    });
    expect(result.success).toBe(true);
  });

  it('accepts referrer dimensions', () => {
    const result = McpQueryInputSchema.safeParse({
      metrics: ['visitors'],
      dimensions: ['referrer_source'],
      timeRange: '7d',
    });
    expect(result.success).toBe(true);
  });

  it('accepts referrer_source_name dimension', () => {
    const result = McpQueryInputSchema.safeParse({
      metrics: ['visitors'],
      dimensions: ['referrer_source_name'],
      timeRange: '7d',
    });
    expect(result.success).toBe(true);
  });

  it('requires both dates for custom time range', () => {
    expect(McpQueryInputSchema.safeParse({ metrics: ['visitors'], timeRange: 'custom' }).success).toBe(false);
    expect(
      McpQueryInputSchema.safeParse({ metrics: ['visitors'], timeRange: 'custom', startDate: '2026-01-01' })
        .success,
    ).toBe(false);
    expect(
      McpQueryInputSchema.safeParse({
        metrics: ['visitors'],
        timeRange: 'custom',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      }).success,
    ).toBe(true);
  });

  it('rejects startDate after endDate', () => {
    const result = McpQueryInputSchema.safeParse({
      metrics: ['visitors'],
      timeRange: 'custom',
      startDate: '2026-02-01',
      endDate: '2026-01-01',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid date format', () => {
    const result = McpQueryInputSchema.safeParse({
      metrics: ['visitors'],
      timeRange: 'custom',
      startDate: '01/01/2026',
      endDate: '01/31/2026',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid filter operator', () => {
    const result = McpQueryInputSchema.safeParse({
      metrics: ['visitors'],
      timeRange: '7d',
      filters: [{ column: 'url', operator: 'LIKE', values: ['/'] }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects filter with empty values array', () => {
    const result = McpQueryInputSchema.safeParse({
      metrics: ['visitors'],
      timeRange: '7d',
      filters: [{ column: 'url', operator: '=', values: [] }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid granularity', () => {
    const result = McpQueryInputSchema.safeParse({
      metrics: ['visitors'],
      timeRange: '7d',
      granularity: 'yearly',
    });
    expect(result.success).toBe(false);
  });
});
