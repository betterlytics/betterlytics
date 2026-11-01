import { describe, it, expect, vi, beforeEach } from 'vitest';

const query = vi.hoisted(() => vi.fn());

vi.mock('@/lib/clickhouse', () => ({
  clickhouse: { query },
}));

vi.mock('@/lib/ba-query', () => ({
  BAQuery: { getSampling: vi.fn() },
}));

import { getDailyReferralSummaryMetrics, getReferralRangeMetrics } from './referrers.repository';
import type { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

const siteQuery = {
  siteId: 'test-site',
  queryFilters: [],
  granularity: 'hour',
  timezone: 'Etc/UTC',
  startDateTime: '2026-01-01 00:00:00',
  endDateTime: '2026-01-01 23:59:59',
} as unknown as BASiteQuery;

function normalizedSql() {
  return (query.mock.calls[0][0] as string).replace(/\s+/g, ' ');
}

describe('referral summary queries', () => {
  beforeEach(() => {
    query.mockReset();
  });

  it('counts a session spanning several buckets once over the range', async () => {
    query.mockReturnValue({
      toPromise: () => Promise.resolve([{ referralSessions: 1, totalSessions: 3, avgSessionDuration: 4800 }]),
    });

    const metrics = await getReferralRangeMetrics(siteQuery);

    const sql = normalizedSql();
    expect(sql).toContain('FROM analytics.sessions FINAL');
    expect(sql).toContain("countIf(referrer_source_effective NOT IN ('direct', 'internal')) AS referralSessions");
    expect(sql).not.toContain('analytics.events');
    expect(sql).not.toContain('GROUP BY');
    expect(metrics).toEqual({ referralSessions: 1, totalSessions: 3, avgSessionDuration: 4800 });
  });

  it('builds the duration like the Overview, dividing by multi-pageview sessions', async () => {
    query.mockReturnValue({
      toPromise: () => Promise.resolve([{ referralSessions: 0, totalSessions: 0, avgSessionDuration: 0 }]),
    });

    await getReferralRangeMetrics(siteQuery);

    expect(normalizedSql()).toContain(
      "sumIf(dateDiff('second', session_start, session_end), referrer_source_effective NOT IN ('direct', 'internal')) / countIf(referrer_source_effective NOT IN ('direct', 'internal') AND pageview_count > 1)",
    );
  });

  it('places a session spanning several buckets only in the bucket it started in', async () => {
    query.mockReturnValue({ toPromise: () => Promise.resolve([]) });

    await getDailyReferralSummaryMetrics(siteQuery);

    const sql = normalizedSql();
    expect(sql).toContain('FROM analytics.sessions FINAL');
    expect(sql).toMatch(/toStartOfInterval\(session_created_at, INTERVAL 1 HOUR, .*\) AS date/);
    expect(sql).toContain('GROUP BY date');
    expect(sql).not.toContain('analytics.events');
    expect(sql).not.toMatch(/GROUP BY date, session_id/);
  });

  it('computes the bucket percentage as referral sessions over all sessions in that bucket', async () => {
    query.mockReturnValue({ toPromise: () => Promise.resolve([]) });

    await getDailyReferralSummaryMetrics(siteQuery);

    expect(normalizedSql()).toContain(
      'if(count() > 0, round(100 * referralSessions / count(), 1), 0) AS referralPercentage',
    );
  });
});
