import { describe, it, expect, vi, beforeEach } from 'vitest';

const query = vi.hoisted(() => vi.fn());

vi.mock('@/lib/clickhouse', () => ({
  clickhouse: { query },
}));

vi.mock('@/lib/ba-query', () => ({
  BAQuery: {},
}));

import { getReferrerTableData } from './referrers.repository';
import { getEntryPageAnalytics, getExitPageAnalytics } from './pages.repository';
import { getWeeklyHeatmap } from './weeklyHeatmap.repository';
import type { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

const siteQuery = {
  siteId: 'test-site',
  queryFilters: [],
  startDateTime: '2026-01-01 00:00:00',
  endDateTime: '2026-01-31 23:59:59',
  timezone: 'UTC',
} as unknown as BASiteQuery;

// The Overview's formula: the time of every session, bounces included, over every session
const AVG_VISIT_DURATION = "if(count() > 0, sum(dateDiff('second', session_start, session_end)) / count(), 0)";

function sql() {
  return query.mock.calls[0][0] as string;
}

describe('average visit duration outside the Overview', () => {
  beforeEach(() => {
    query.mockReset();
    query.mockReturnValue({ toPromise: () => Promise.resolve([]) });
  });

  it('builds the Referrers table from sessions with the Overview formulas', async () => {
    await getReferrerTableData(siteQuery);

    expect(sql()).toContain('FROM analytics.sessions FINAL');
    expect(sql()).not.toContain('analytics.events');
    expect(sql()).toContain('count() AS visits');
    expect(sql()).toContain(
      'round(if(count() > 0, 100 * (count() - countIf(pageview_count > 1)) / count(), 0), 1) AS bounce_rate',
    );
    expect(sql()).toContain(`round(${AVG_VISIT_DURATION}) AS avg_visit_duration`);
    expect(sql()).toContain("referrer_source_effective != 'internal'");
    expect(sql()).toContain('GROUP BY source_type, source_name, source_url');
  });

  it('averages entry and exit pages over all their sessions', async () => {
    await getEntryPageAnalytics(siteQuery);
    await getExitPageAnalytics(siteQuery);

    for (const [entrySql] of query.mock.calls) {
      expect(entrySql).toContain(`round(${AVG_VISIT_DURATION}) AS avg_session_time`);
    }
  });

  it('uses the Overview formula for the heatmap session duration', async () => {
    await getWeeklyHeatmap(siteQuery, 'session_duration');

    expect(sql()).toContain(`round(${AVG_VISIT_DURATION}) as value`);
    expect(sql()).not.toContain('avgIf');
  });
});
