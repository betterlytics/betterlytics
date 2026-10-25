import { clickhouse } from '@/lib/clickhouse';
import { safeSql } from '@/lib/safe-sql';

export async function getLastEventAt(siteId: string): Promise<Date | null> {
  // usage_daily's last active day bounds the events scan to that day onwards
  const query = safeSql`
    WITH (
      SELECT max(date)
      FROM analytics.usage_daily
      WHERE site_id = {site_id:String}
    ) AS last_active_day
    SELECT toUnixTimestamp(max(timestamp)) AS lastEventAt
    FROM analytics.events
    WHERE site_id = {site_id:String}
      AND toDate(timestamp) >= last_active_day
  `;

  const result = (await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
      },
    })
    .toPromise()) as Array<{ lastEventAt: number | string }>;

  const seconds = Number(result[0]?.lastEventAt ?? 0);
  return seconds > 0 ? new Date(seconds * 1000) : null;
}
