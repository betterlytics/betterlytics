import { describe, it, expect } from 'vitest';
import { McpQueryInputSchema } from '@/mcp/query-builder/validation';

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

  it('accepts minimal input', () => {
    const input = {
      metrics: ['visitors'],
      timeRange: '7d',
    };

    const result = McpQueryInputSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(100);
      expect(result.data.order).toBe('desc');
    }
  });

  it('rejects empty metrics array', () => {
    const input = { metrics: [], timeRange: '7d' };
    const result = McpQueryInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('rejects unknown metric keys', () => {
    const input = { metrics: ['fake_metric'], timeRange: '7d' };
    const result = McpQueryInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('rejects unknown dimension keys', () => {
    const input = { metrics: ['visitors'], dimensions: ['fake_dim'], timeRange: '7d' };
    const result = McpQueryInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('rejects invalid time range', () => {
    const input = { metrics: ['visitors'], timeRange: 'invalid' };
    const result = McpQueryInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('rejects limit above 10000', () => {
    const input = { metrics: ['visitors'], timeRange: '7d', limit: 50000 };
    const result = McpQueryInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('accepts referrer dimensions', () => {
    const input = {
      metrics: ['visitors'],
      dimensions: ['referrer_source'],
      timeRange: '7d',
    };
    const result = McpQueryInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('accepts referrer_source_name dimension', () => {
    const input = {
      metrics: ['visitors'],
      dimensions: ['referrer_source_name'],
      timeRange: '7d',
    };
    const result = McpQueryInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('accepts custom time range with startDate and endDate', () => {
    const input = {
      metrics: ['visitors'],
      timeRange: 'custom',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
    };
    const result = McpQueryInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('rejects custom time range without dates', () => {
    const input = {
      metrics: ['visitors'],
      timeRange: 'custom',
    };
    const result = McpQueryInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('rejects custom time range with only startDate', () => {
    const input = {
      metrics: ['visitors'],
      timeRange: 'custom',
      startDate: '2026-01-01',
    };
    const result = McpQueryInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('rejects startDate after endDate', () => {
    const input = {
      metrics: ['visitors'],
      timeRange: 'custom',
      startDate: '2026-02-01',
      endDate: '2026-01-01',
    };
    const result = McpQueryInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('rejects invalid date format', () => {
    const input = {
      metrics: ['visitors'],
      timeRange: 'custom',
      startDate: '01/01/2026',
      endDate: '01/31/2026',
    };
    const result = McpQueryInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});
