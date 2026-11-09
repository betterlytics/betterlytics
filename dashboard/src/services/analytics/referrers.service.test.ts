import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getReferrerSummaryWithChartsForSite } from './referrers.service';
import { getSessionMetrics, getSessionRangeMetrics } from '@/repositories/clickhouse/index.repository';
import type { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';
import type { QueryFilter } from '@/entities/analytics/filter.entities';

vi.mock('@/repositories/clickhouse/index.repository', () => ({
  getSessionRangeMetrics: vi.fn(),
  getSessionMetrics: vi.fn(),
  getTopReferrerSource: vi.fn(async () => 'search'),
}));

const userFilter: QueryFilter = { id: 'f1', column: 'device_type', operator: '=', values: ['desktop'] };
const siteQuery = { siteId: 'test-site', queryFilters: [userFilter] } as unknown as BASiteQuery;

const isReferralQuery = (query: BASiteQuery) =>
  query.queryFilters.some((filter) => filter.column === 'referrer_source');

const metrics = (sessions: number, avgVisitDuration: number) => ({
  sessions,
  avg_visit_duration: avgVisitDuration,
  bounce_rate: 0,
  pages_per_session: 1,
});

// One referral session from 10:50 to 12:10 spans three hourly buckets; the Overview's session
// rows place it only in the 10:00 bucket, where it started
beforeEach(() => {
  vi.mocked(getSessionRangeMetrics).mockImplementation(async (query) =>
    isReferralQuery(query) ? metrics(1, 4800) : metrics(4, 1200),
  );
  vi.mocked(getSessionMetrics).mockImplementation(async (query) =>
    isReferralQuery(query)
      ? [
          { date: '2026-01-01 10:00:00', ...metrics(1, 4800) },
          { date: '2026-01-01 11:00:00', ...metrics(0, 0) },
          { date: '2026-01-01 12:00:00', ...metrics(0, 0) },
        ]
      : [
          { date: '2026-01-01 12:00:00', ...metrics(1, 0) },
          { date: '2026-01-01 10:00:00', ...metrics(3, 1600) },
          { date: '2026-01-01 11:00:00', ...metrics(0, 0) },
        ],
  );
});

describe('getReferrerSummaryWithChartsForSite', () => {
  it('limits the referral queries to non-direct, non-internal sources on top of the user filters', async () => {
    await getReferrerSummaryWithChartsForSite(siteQuery);

    const referralFilter = {
      id: 'referral-sessions',
      column: 'referrer_source',
      operator: '!=',
      values: ['direct', 'internal'],
    };
    for (const mock of [getSessionRangeMetrics, getSessionMetrics]) {
      const filterSets = vi.mocked(mock).mock.calls.map(([query]) => query.queryFilters);
      expect(filterSets).toContainEqual([userFilter]);
      expect(filterSets).toContainEqual([userFilter, referralFilter]);
    }
  });

  it('counts a session spanning several buckets once, in the KPI and in the sparkline', async () => {
    const summary = await getReferrerSummaryWithChartsForSite(siteQuery);

    expect(summary.referralSessions).toBe(1);
    expect(summary.chartData.map((bucket) => bucket.referralSessions)).toEqual([1, 0, 0]);
  });

  it('takes total sessions and duration from the Overview metrics over the whole range', async () => {
    const summary = await getReferrerSummaryWithChartsForSite(siteQuery);

    expect(summary.totalSessions).toBe(4);
    expect(summary.avgSessionDuration).toBe(4800);
    expect(summary.topReferrerSource).toBe('search');
  });

  it('divides each bucket by all sessions in the bucket with the same date', async () => {
    const summary = await getReferrerSummaryWithChartsForSite(siteQuery);

    expect(summary.chartData.map((bucket) => bucket.referralPercentage)).toEqual([33.3, 0, 0]);
  });
});
