import { describe, it, expect } from 'vitest';
import { McpQueryInputSchema, McpQuerySessionsInputSchema } from '@/mcp/entities/mcp.entities';

describe('McpQuerySessionsInputSchema', () => {
  it('accepts valid input with all fields', () => {
    const result = McpQuerySessionsInputSchema.safeParse({
      metrics: ['sessions', 'visitors', 'pageviews', 'bounce_rate', 'avg_visit_duration', 'pages_per_session'],
      dimensions: ['entry_page', 'utm_campaign'],
      filters: [{ column: 'device_type', operator: '=', values: ['mobile'] }],
      timeRange: '28d',
      timezone: 'Europe/Berlin',
      granularity: 'day',
      orderBy: 'date',
      order: 'asc',
      limit: 500,
    });
    expect(result.success).toBe(true);
  });

  it('applies the same defaults as query', () => {
    const result = McpQuerySessionsInputSchema.safeParse({ metrics: ['sessions'], timeRange: '7d' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(100);
      expect(result.data.order).toBe('desc');
      expect(result.data.timezone).toBe('UTC');
    }
  });

  it('rejects empty metrics and event-only metrics', () => {
    expect(McpQuerySessionsInputSchema.safeParse({ metrics: [], timeRange: '7d' }).success).toBe(false);
    expect(McpQuerySessionsInputSchema.safeParse({ metrics: ['custom_events'], timeRange: '7d' }).success).toBe(
      false,
    );
  });

  it.each(['url', 'custom_event_name', 'domain'])('rejects the %s dimension', (dimension) => {
    const result = McpQuerySessionsInputSchema.safeParse({
      metrics: ['sessions'],
      dimensions: [dimension],
      timeRange: '7d',
    });
    expect(result.success).toBe(false);
  });

  it.each(['entry_page', 'exit_page', 'url', 'utm_source', 'event_type', 'gp.plan', 'cep.currency'])(
    'accepts the %s filter column',
    (column) => {
      const result = McpQuerySessionsInputSchema.safeParse({
        metrics: ['sessions'],
        timeRange: '7d',
        filters: [{ column, operator: '=', values: ['x'] }],
      });
      expect(result.success).toBe(true);
    },
  );

  it('keeps entry_page and exit_page out of the query tool filters', () => {
    const result = McpQueryInputSchema.safeParse({
      metrics: ['visitors'],
      timeRange: '7d',
      filters: [{ column: 'entry_page', operator: '=', values: ['/'] }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects unknown filter columns, operators and empty values', () => {
    const parse = (filter: object) =>
      McpQuerySessionsInputSchema.safeParse({ metrics: ['sessions'], timeRange: '7d', filters: [filter] }).success;

    expect(parse({ column: 'landing_page', operator: '=', values: ['/'] })).toBe(false);
    expect(parse({ column: 'entry_page', operator: 'LIKE', values: ['/'] })).toBe(false);
    expect(parse({ column: 'entry_page', operator: '=', values: [] })).toBe(false);
  });

  it('only sorts by a requested metric or dimension', () => {
    const parse = (fields: object) =>
      McpQuerySessionsInputSchema.safeParse({ metrics: ['sessions'], timeRange: '7d', ...fields });

    expect(parse({ orderBy: 'sessions' }).success).toBe(true);
    expect(parse({ dimensions: ['exit_page'], orderBy: 'exit_page' }).success).toBe(true);

    const notRequested = parse({ orderBy: 'bounce_rate' });
    expect(notRequested.success).toBe(false);
    expect(notRequested.error?.issues[0].message).toContain('requested metrics or dimensions');

    expect(parse({ orderBy: 'url' }).success).toBe(false);
  });

  it('only sorts by date in a time series', () => {
    const parse = (fields: object) =>
      McpQuerySessionsInputSchema.safeParse({
        metrics: ['sessions'],
        timeRange: '7d',
        orderBy: 'date',
        ...fields,
      });

    expect(parse({ granularity: 'hour' }).success).toBe(true);

    const aggregate = parse({});
    expect(aggregate.success).toBe(false);
    expect(aggregate.error?.issues[0].message).toContain('needs a granularity');
  });

  it('applies the shared custom date range rules', () => {
    const parse = (fields: object) =>
      McpQuerySessionsInputSchema.safeParse({ metrics: ['sessions'], timeRange: 'custom', ...fields }).success;

    expect(parse({})).toBe(false);
    expect(parse({ startDate: '2026-01-01' })).toBe(false);
    expect(parse({ startDate: '2026-02-01', endDate: '2026-01-01' })).toBe(false);
    expect(parse({ startDate: '2026-01-01', endDate: '2026-01-31' })).toBe(true);
  });

  it('rejects limits outside 1 to 10000 and unsupported granularities', () => {
    const parse = (fields: object) =>
      McpQuerySessionsInputSchema.safeParse({ metrics: ['sessions'], timeRange: '7d', ...fields }).success;

    expect(parse({ limit: 0 })).toBe(false);
    expect(parse({ limit: 10001 })).toBe(false);
    expect(parse({ limit: 10000 })).toBe(true);
    expect(parse({ granularity: 'week' })).toBe(false);
  });
});
