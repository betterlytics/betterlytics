import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { demoCampaignDataSource } from '@/services/analytics/demoCampaigns.service';
import { DEMO_CAMPAIGNS } from '@/constants/demoCampaigns';
import { UTM_DIMENSIONS } from '@/entities/analytics/campaign.entities';
import { getResolvedRanges } from '@/lib/ba-timerange';
import { toDateTimeString } from '@/utils/dateFormatters';
import type { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';
import type { GranularityRangeValues } from '@/utils/granularityRanges';

const NOW = new Date('2026-10-23T14:23:00Z');

function siteQueryFor(
  interval: '24h' | '7d',
  granularity: GranularityRangeValues,
  timezone = 'Europe/Copenhagen',
) {
  const range = getResolvedRanges(interval, 'off', timezone, NOW, NOW, granularity);
  return {
    siteId: 'demo-site',
    startDate: range.main.start,
    endDate: range.main.end,
    startDateTime: toDateTimeString(range.main.start),
    endDateTime: toDateTimeString(range.main.end),
    granularity: range.granularity,
    queryFilters: [],
    timezone,
    userJourney: { numberOfSteps: 3, numberOfJourneys: 5 },
  } satisfies BASiteQuery;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('demoCampaignDataSource', () => {
  it('lists all eight campaigns with different numbers for 24h and 7d', async () => {
    const day = await demoCampaignDataSource.getCampaignPerformancePageData(siteQueryFor('24h', 'hour'), 10, 0);
    const week = await demoCampaignDataSource.getCampaignPerformancePageData(siteQueryFor('7d', 'day'), 10, 0);

    expect(await demoCampaignDataSource.getCampaignCount(siteQueryFor('24h', 'hour'))).toBe(8);
    expect(day).toHaveLength(8);
    expect(week).toHaveLength(8);
    const dayTotal = day.reduce((sum, row) => sum + row.total_visitors, 0);
    const weekTotal = week.reduce((sum, row) => sum + row.total_visitors, 0);
    expect(dayTotal).toBeGreaterThan(0);
    expect(dayTotal).toBeLessThan(weekTotal / 4);
    expect(day.map((row) => row.utm_campaign_name)).not.toEqual(week.map((row) => row.utm_campaign_name));
  });

  it('returns the same numbers for the same window', async () => {
    const query = siteQueryFor('24h', 'minute_15');
    const names = DEMO_CAMPAIGNS.map((campaign) => campaign.name);
    const first = await demoCampaignDataSource.getCampaignVisitorTrendData(query, names);
    const second = await demoCampaignDataSource.getCampaignVisitorTrendData(query, names);
    expect(second).toEqual(first);
  });

  it.each([
    ['24h', 'minute_15', 96, 15],
    ['24h', 'minute_30', 48, 30],
    ['24h', 'hour', 24, 60],
    ['7d', 'hour', 168, 60],
    ['7d', 'day', 7, 24 * 60],
  ] as const)(
    'ends every %s %s sparkline in the last bucket of the range',
    async (interval, granularity, buckets, bucketMinutes) => {
      const query = siteQueryFor(interval, granularity);
      for (const campaign of DEMO_CAMPAIGNS) {
        const rows = await demoCampaignDataSource.getCampaignVisitorTrendData(query, [campaign.name]);

        expect(rows.length).toBeGreaterThan(0);
        expect(rows.length).toBeLessThanOrEqual(buckets);
        expect(rows.every((row) => row.visitors > 0)).toBe(true);
        expect(rows[0].date >= query.startDateTime).toBe(true);
        const lastBucketStart = new Date(`${rows.at(-1)!.date}Z`).getTime();
        expect(lastBucketStart).toBeLessThanOrEqual(query.endDate.getTime());
        expect(query.endDate.getTime() - lastBucketStart).toBeLessThan(bucketMinutes * 60 * 1000);
      }
    },
  );

  it('ends the 24h sparkline in the bucket that holds the current time', async () => {
    const rows = await demoCampaignDataSource.getCampaignVisitorTrendData(siteQueryFor('24h', 'hour'), [
      DEMO_CAMPAIGNS[0].name,
    ]);
    expect(rows.at(-1)!.date).toBe('2026-10-23 14:00:00');
  });

  it('populates every breakdown and audience dimension for every campaign on 24h', async () => {
    const query = siteQueryFor('24h', 'hour');
    for (const campaign of DEMO_CAMPAIGNS) {
      for (const dimension of UTM_DIMENSIONS) {
        const rows = await demoCampaignDataSource.getCampaignUTMBreakdownData(query, dimension, campaign.name);
        expect(rows.length, `${campaign.name} ${dimension}`).toBeGreaterThan(0);
      }
      const pages = await demoCampaignDataSource.getCampaignLandingPagePerformanceData(query, campaign.name);
      expect(pages.length).toBeGreaterThan(0);

      const audience = await demoCampaignDataSource.getCampaignAudienceProfileData(query, campaign.name, 3);
      expect(new Set(audience.map((row) => row.dimension))).toEqual(
        new Set(['device', 'country', 'browser', 'os']),
      );
    }
  });

  it('keeps every row internally consistent', async () => {
    const rows = await demoCampaignDataSource.getCampaignUTMBreakdownData(siteQueryFor('7d', 'day'), 'source');
    for (const row of rows) {
      expect(row.bounced_sessions).toBeLessThanOrEqual(row.total_sessions);
      expect(row.total_sessions).toBeGreaterThanOrEqual(row.total_visitors);
      expect(row.total_pageviews).toBeGreaterThanOrEqual(row.total_sessions);
    }
  });
});
