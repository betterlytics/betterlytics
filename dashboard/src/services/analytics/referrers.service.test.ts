import { describe, it, expect, vi } from 'vitest';
import { getReferrerSummaryWithChartsForSite } from './referrers.service';
import type { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

// One referral session from 10:50 to 12:10 spans three hourly buckets, but started in the 10:00 one
vi.mock('@/repositories/clickhouse/index.repository', () => ({
  getReferralRangeMetrics: vi.fn(async () => ({
    referralSessions: 1,
    totalSessions: 4,
    avgSessionDuration: 4800,
  })),
  getDailyReferralSummaryMetrics: vi.fn(async () => [
    { date: '2026-01-01 10:00:00', referralSessions: 1, referralPercentage: 50, avgSessionDuration: 4800 },
    { date: '2026-01-01 11:00:00', referralSessions: 0, referralPercentage: 0, avgSessionDuration: 0 },
    { date: '2026-01-01 12:00:00', referralSessions: 0, referralPercentage: 0, avgSessionDuration: 0 },
  ]),
  getTopReferrerSource: vi.fn(async () => 'search'),
}));

describe('getReferrerSummaryWithChartsForSite', () => {
  it('takes the KPIs from the range instead of adding up the buckets', async () => {
    const summary = await getReferrerSummaryWithChartsForSite({} as BASiteQuery);

    expect(summary.referralSessions).toBe(1);
    expect(summary.totalSessions).toBe(4);
    expect(summary.avgSessionDuration).toBe(4800);
    expect(summary.topReferrerSource).toBe('search');
  });

  it('splits the bucket rows into a sparkline that adds up to the KPI', async () => {
    const summary = await getReferrerSummaryWithChartsForSite({} as BASiteQuery);

    const sparklineTotal = summary.referralSessionsChartData.reduce((sum, row) => sum + row.referralSessions, 0);
    expect(sparklineTotal).toBe(summary.referralSessions);
    expect(summary.referralPercentageChartData[0]).toEqual({
      date: '2026-01-01 10:00:00',
      referralPercentage: 50,
    });
    expect(summary.avgSessionDurationChartData[0]).toEqual({
      date: '2026-01-01 10:00:00',
      avgSessionDuration: 4800,
    });
  });
});
