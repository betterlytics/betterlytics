import { clickhouse } from '@/lib/clickhouse';
import { safeSql, SQL } from '@/lib/safe-sql';
import { EventCountResultSchema } from '@/entities/billing/billing';
import { DateString } from '@/types/dates';

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
