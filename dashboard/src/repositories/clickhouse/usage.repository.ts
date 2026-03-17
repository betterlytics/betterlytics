import { clickhouse } from '@/lib/clickhouse';
import { safeSql, SQL } from '@/lib/safe-sql';
import { EventCountResultSchema } from '@/entities/billing/billing.entities';
import { DateString } from '@/types/dates';
import { cache } from 'react';

const HIGH_TRAFFIC_THRESHOLD = 100_000;

async function _getSiteEventCountForWeek(siteId: string): Promise<number> {
  const query = safeSql`
    SELECT sum(event_count) as total
    FROM analytics.usage_by_site_daily
    WHERE site_id = {site_id:String}
      AND date >= toDate(now() - INTERVAL 7 DAY)
      AND date <= toDate(now())
  `;

  try {
    const result = await clickhouse
      .query(query.taggedSql, {
        params: { ...query.taggedParams, site_id: siteId },
      })
      .toPromise();

    const parsed = result as Array<{ total: number }>;
    return parsed[0]?.total || 0;
  } catch (error) {
    console.error('Failed to get site weekly event count:', error);
    return 0;
  }
}

export const getSiteEventCountForWeek = cache(_getSiteEventCountForWeek);

export async function isHighTrafficSite(siteId: string): Promise<boolean> {
  const count = await getSiteEventCountForWeek(siteId);
  return count > HIGH_TRAFFIC_THRESHOLD;
}

/**
 * Get total event count for user's sites within billing period
 */
export async function getUserEventCountForPeriod(siteIds: string[], startDate: DateString): Promise<number> {
  if (siteIds.length === 0) {
    return 0;
  }

  // Create individual String parameters for each site ID
  const siteIdChecks = siteIds
    .map((siteId, index) => SQL.String({ [`site_id_${index}`]: siteId }))
    .map((siteParam) => safeSql`site_id = ${siteParam}`);

  const query = safeSql`
    SELECT sum(event_count) as total
    FROM analytics.usage_by_site_daily
    WHERE (${SQL.OR(siteIdChecks)})
      AND date >= toDate({start_date:String})
      AND date <= toDate(now())
  `;

  try {
    const result = await clickhouse
      .query(query.taggedSql, {
        params: {
          ...query.taggedParams,
          start_date: startDate,
        },
      })
      .toPromise();

    const parsed = result.map((row) => EventCountResultSchema.parse(row));
    return parsed[0]?.total || 0;
  } catch (error) {
    console.error('Failed to get user event count:', error);
    return 0;
  }
}
