import { describe, it, expect } from 'vitest';
import { buildSessionsQuery } from '@/mcp/query-builder/sessionBuilder';
import { McpQuerySessionsInput } from '@/mcp/entities/mcp.entities';

const siteId = 'test-site-id';

function input(overrides: Partial<McpQuerySessionsInput>): McpQuerySessionsInput {
  return { metrics: ['sessions'], timeRange: '7d', timezone: 'UTC', order: 'desc', limit: 100, ...overrides };
}

describe('buildSessionsQuery', () => {
  it('builds an aggregate over finalized sessions scoped to the given site', () => {
    const result = buildSessionsQuery(input({ metrics: ['sessions'] }), siteId);

    expect(result.taggedSql).toContain('FROM analytics.sessions FINAL');
    expect(result.taggedSql).toContain('session_created_at BETWEEN');
    expect(result.taggedSql).toContain('count() AS sessions');
    expect(result.taggedSql).not.toContain('GROUP BY');
    expect(result.taggedParams.siteId).toBe(siteId);
  });

  it('uses the Overview session metric formulas with MCP rounding', () => {
    const result = buildSessionsQuery(
      input({ metrics: ['pageviews', 'bounce_rate', 'avg_visit_duration', 'pages_per_session'] }),
      siteId,
    );

    expect(result.taggedSql).toContain('sum(pageview_count) AS pageviews');
    expect(result.taggedSql).toContain(
      'round(if(count() > 0, 100 * (count() - countIf(pageview_count > 1)) / count(), 0), 1) AS bounce_rate',
    );
    expect(result.taggedSql).toContain(
      "round(if(countIf(pageview_count > 1) > 0, sum(dateDiff('second', session_start, session_end)) / countIf(pageview_count > 1), 0)) AS avg_visit_duration",
    );
    expect(result.taggedSql).toContain(
      'round(if(count() > 0, sum(pageview_count) / count(), 0), 1) AS pages_per_session',
    );
  });

  it('reads only the session columns the metrics need', () => {
    const result = buildSessionsQuery(input({ metrics: ['sessions'] }), siteId);

    expect(result.taggedSql).not.toContain('session_start');
    expect(result.taggedSql).not.toContain('visitor_id');
  });

  it('counts unique visitors directly in an aggregate', () => {
    const result = buildSessionsQuery(input({ metrics: ['visitors'] }), siteId);

    expect(result.taggedSql).toContain('uniq(visitor_id) AS visitors');
    expect(result.taggedSql).not.toContain('OVER');
  });

  it('groups by a dimension and leaves out empty values', () => {
    const result = buildSessionsQuery(input({ dimensions: ['entry_page'] }), siteId);

    expect(result.taggedSql).toContain('entry_page.2 as entry_page');
    expect(result.taggedSql).toContain("entry_page != ''");
    expect(result.taggedSql).toContain('GROUP BY entry_page');
  });

  it('breaks down referrer_source by the effective classification', () => {
    const result = buildSessionsQuery(input({ dimensions: ['referrer_source'] }), siteId);

    expect(result.taggedSql).toContain('referrer_source_effective AS referrer_source');
    expect(result.taggedSql).toContain('GROUP BY referrer_source_effective');
    expect(result.taggedSql).not.toContain('referrer_source.2');
  });

  it('defaults orderBy to the first metric and honours an explicit dimension sort', () => {
    const byMetric = buildSessionsQuery(input({ metrics: ['bounce_rate', 'sessions'] }), siteId);
    expect(byMetric.taggedSql).toContain('ORDER BY bounce_rate DESC');

    const byDimension = buildSessionsQuery(
      input({ dimensions: ['utm_campaign'], orderBy: 'utm_campaign', order: 'asc' }),
      siteId,
    );
    expect(byDimension.taggedSql).toContain('ORDER BY utm_campaign ASC');
  });

  it('passes the limit as a parameter', () => {
    const result = buildSessionsQuery(input({ limit: 25 }), siteId);

    expect(result.taggedSql).toContain('LIMIT {limit:UInt32}');
    expect(result.taggedParams.limit).toBe(25);
  });

  it('builds a zero-filled time series bucketed by session start', () => {
    const result = buildSessionsQuery(input({ granularity: 'day', timezone: 'Europe/Berlin' }), siteId);

    expect(result.taggedSql).toContain('toStartOfInterval(session_created_at, INTERVAL 1 DAY');
    expect(result.taggedSql).toContain('WITH FILL');
    expect(result.taggedSql).toContain("toTimezone(toDateTime64(date, 0, {timezone:String}), 'UTC') as date");
    expect(result.taggedSql).toContain('ORDER BY date ASC');
    expect(result.taggedParams.timezone).toBe('Europe/Berlin');
  });

  it('counts visitors in the bucket of their first session in a time series', () => {
    const result = buildSessionsQuery(
      input({ metrics: ['visitors'], dimensions: ['device_type'], granularity: 'day' }),
      siteId,
    );

    expect(result.taggedSql).toContain(
      'min(session_created_at) OVER (PARTITION BY visitor_id, device_type) AS first_session_created_at',
    );
    expect(result.taggedSql).toContain(
      'uniqIf(visitor_id, session_created_at = first_session_created_at) AS visitors',
    );
  });

  it('applies entry and exit page filters to the selected sessions', () => {
    const result = buildSessionsQuery(
      input({
        filters: [
          { column: 'entry_page', operator: '=', values: ['/blog*'] },
          { column: 'exit_page', operator: '!=', values: ['/pricing'] },
        ],
      }),
      siteId,
    );

    expect(result.taggedSql).toContain('entry_page.2 as entry_page');
    expect(result.taggedSql).toContain('exit_page.2 as exit_page');
    expect(result.taggedSql).toContain(
      'arrayExists(pattern -> entry_page ILIKE pattern, {mcp_page_filter_0:Array(String)})',
    );
    expect(result.taggedSql).toContain(
      'arrayAll(pattern -> exit_page NOT ILIKE pattern, {mcp_page_filter_1:Array(String)})',
    );
    expect(result.taggedParams.mcp_page_filter_0).toEqual(['/blog%']);
  });

  it('treats a bare wildcard page filter as a presence check', () => {
    const result = buildSessionsQuery(
      input({ filters: [{ column: 'entry_page', operator: '!=', values: ['*'] }] }),
      siteId,
    );

    expect(result.taggedSql).toContain("entry_page = ''");
  });

  it('skips incomplete page filters like the other filters', () => {
    const result = buildSessionsQuery(
      input({ filters: [{ column: 'entry_page', operator: '=', values: [''] }] }),
      siteId,
    );

    expect(result.taggedSql).not.toContain('entry_page');
  });

  it('bridges event filters through analytics.events like the dashboard', () => {
    const result = buildSessionsQuery(
      input({
        filters: [
          { column: 'url', operator: '=', values: ['/pricing'] },
          { column: 'custom_event_name', operator: '!=', values: ['signup'] },
        ],
      }),
      siteId,
    );

    expect(result.taggedSql).toContain('session_id IN ( SELECT session_id FROM analytics.events');
    expect(result.taggedSql).toContain('session_id NOT IN ( SELECT session_id FROM analytics.events');
  });

  it('matches session filter columns on the session values', () => {
    const result = buildSessionsQuery(
      input({ filters: [{ column: 'utm_campaign', operator: '=', values: ['spring'] }] }),
      siteId,
    );

    expect(result.taggedSql).toContain('utm_campaign.2 ILIKE pattern');
  });

  it('filters on the session column when the same column is a dimension', () => {
    const result = buildSessionsQuery(
      input({
        dimensions: ['utm_source', 'referrer_url'],
        filters: [
          { column: 'utm_source', operator: '=', values: ['*'] },
          { column: 'referrer_url', operator: '!=', values: ['*google*'] },
        ],
      }),
      siteId,
    );

    expect(result.taggedSql).toContain('utm_source.2 as utm_source');
    expect(result.taggedSql).toContain("sessions.utm_source.2 != ''");
    expect(result.taggedSql).toContain('sessions.referrer_url.2 NOT ILIKE pattern');
  });

  it('does not zero-fill a time series with dimensions', () => {
    const result = buildSessionsQuery(input({ dimensions: ['utm_campaign'], granularity: 'hour' }), siteId);

    expect(result.taggedSql).toContain('ORDER BY date ASC');
    expect(result.taggedSql).not.toContain('WITH FILL');
  });

  it('ignores duplicate metrics and dimensions', () => {
    const result = buildSessionsQuery(
      input({ metrics: ['sessions', 'sessions'], dimensions: ['os', 'os'] }),
      siteId,
    );

    expect(result.taggedSql.match(/AS sessions/g)).toHaveLength(1);
    expect(result.taggedSql).not.toContain('os, os');
  });

  it('throws on unknown metric', () => {
    expect(() =>
      buildSessionsQuery(
        input({ metrics: ['custom_events'] as unknown as McpQuerySessionsInput['metrics'] }),
        siteId,
      ),
    ).toThrow('Unknown metric');
  });

  it('throws on unknown dimension', () => {
    expect(() =>
      buildSessionsQuery(input({ dimensions: ['url'] as unknown as McpQuerySessionsInput['dimensions'] }), siteId),
    ).toThrow('Unknown dimension');
  });

  it('rejects a sort key outside the identifier list even when the input skipped schema validation', () => {
    expect(() =>
      buildSessionsQuery(
        input({
          orderBy: 'sessions; DROP TABLE analytics.sessions' as unknown as McpQuerySessionsInput['orderBy'],
        }),
        siteId,
      ),
    ).toThrow();
  });
});
