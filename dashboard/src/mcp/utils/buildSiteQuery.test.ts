import { describe, it, expect } from 'vitest';
import { buildSiteQuery } from '@/mcp/utils/buildSiteQuery';
import type { ResolvedTimeRange } from '@/mcp/utils/resolveTimeRange';
import type { QueryFilter } from '@/entities/analytics/filter.entities';

const timeRange: ResolvedTimeRange = {
  start: new Date('2026-01-01T00:00:00Z'),
  end: new Date('2026-01-31T23:59:59Z'),
  startDateTime: '2026-01-01 00:00:00',
  endDateTime: '2026-01-31 23:59:59',
};

describe('buildSiteQuery', () => {
  it('maps site id and resolved time range onto the query', () => {
    const query = buildSiteQuery({ siteId: 'site-1', timeRange, timezone: 'Europe/Berlin' });

    expect(query).toMatchObject({
      siteId: 'site-1',
      startDate: timeRange.start,
      endDate: timeRange.end,
      startDateTime: '2026-01-01 00:00:00',
      endDateTime: '2026-01-31 23:59:59',
      timezone: 'Europe/Berlin',
    });
  });

  it('defaults granularity, filters and user journey', () => {
    const query = buildSiteQuery({ siteId: 'site-1', timeRange, timezone: 'UTC' });

    expect(query.granularity).toBe('day');
    expect(query.queryFilters).toEqual([]);
    expect(query.userJourney).toEqual({ numberOfSteps: 3, numberOfJourneys: 50 });
  });

  it('defaults timezone to UTC when omitted', () => {
    expect(buildSiteQuery({ siteId: 'site-1', timeRange }).timezone).toBe('UTC');
  });

  it('applies overrides for fields the caller genuinely uses', () => {
    const queryFilters: QueryFilter[] = [
      { id: 'mcp_filter_0', column: 'url', operator: '=', values: ['/pricing'] },
    ];

    const query = buildSiteQuery({
      siteId: 'site-1',
      timeRange,
      timezone: 'UTC',
      granularity: 'hour',
      queryFilters,
      userJourney: { numberOfSteps: 5, numberOfJourneys: 100 },
    });

    expect(query.granularity).toBe('hour');
    expect(query.queryFilters).toEqual(queryFilters);
    expect(query.userJourney).toEqual({ numberOfSteps: 5, numberOfJourneys: 100 });
  });

  it('does not share the default user journey object between queries', () => {
    const first = buildSiteQuery({ siteId: 'site-1', timeRange });
    const second = buildSiteQuery({ siteId: 'site-2', timeRange });

    expect(first.userJourney).not.toBe(second.userJourney);
  });
});
