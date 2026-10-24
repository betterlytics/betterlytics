import { clickhouse } from '@/lib/clickhouse';
import { safeSql, SQL } from '@/lib/safe-sql';
import {
  DailySiteUsageSchema,
  EventCountResultSchema,
  RecordedSessionCountResultSchema,
  UsageBreakdownRowSchema,
  type DailySiteUsage,
  type UsageBreakdownRow,
} from '@/entities/billing/billing.entities';
import { DateString, DateTimeString } from '@/types/dates';
import { cache } from 'react';
import { env } from '@/lib/env';

async function _getSiteEventCountForRange(
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
): Promise<number> {
  const query = safeSql`
    SELECT sum(event_count) as total
    FROM analytics.usage_daily
    WHERE site_id = {site_id:String}
      AND date >= toDate({start_date:String})
      AND date <= toDate({end_date:String})
  `;

  try {
    const result = await clickhouse
      .query(query.taggedSql, {
        params: { ...query.taggedParams, site_id: siteId, start_date: startDate, end_date: endDate },
      })
      .toPromise();

    const parsed = result as Array<{ total: number }>;
    return parsed[0]?.total || 0;
  } catch (error) {
    console.error('Failed to get site event count for range:', error);
    return 0;
  }
}

export const getSiteEventCountForRange = cache(_getSiteEventCountForRange);

export async function isHighTrafficSite(
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
): Promise<boolean> {
  const count = await getSiteEventCountForRange(siteId, startDate, endDate);
  return count > env.SAMPLING_TRAFFIC_THRESHOLD;
}

export async function getDailyEventCountsForSites(
  siteIds: string[],
  earliestStart: DateString,
): Promise<DailySiteUsage[]> {
  if (siteIds.length === 0) return [];

  const query = safeSql`
    SELECT usage.site_id, toString(usage.date) AS date, sum(usage.event_count) AS total
    FROM analytics.usage_daily AS usage
    WHERE usage.site_id IN ${SQL.StringArray({ site_ids: siteIds })}
      AND usage.date >= toDate({earliest_start:String})
      AND usage.date <= toDate(now())
    GROUP BY usage.site_id, usage.date
  `;

  try {
    const result = await clickhouse
      .query(query.taggedSql, {
        params: { ...query.taggedParams, earliest_start: earliestStart },
      })
      .toPromise();

    return DailySiteUsageSchema.array().parse(result);
  } catch (error) {
    console.error('Failed to get daily event counts for sites:', error);
    throw error;
  }
}

/**
 * Billable events for the period grouped by both site and event type. 
 * One row per site/type pair
 */
export async function getUsageBreakdownForPeriod(
  siteIds: string[],
  startDate: DateString,
): Promise<UsageBreakdownRow[]> {
  if (siteIds.length === 0) return [];

  const query = safeSql`
    SELECT usage.site_id, usage.event_type, sum(usage.event_count) AS total
    FROM analytics.usage_daily AS usage
    WHERE usage.site_id IN ${SQL.StringArray({ site_ids: siteIds })}
      AND usage.date >= toDate({start_date:String})
      AND usage.date <= toDate(now())
    GROUP BY usage.site_id, usage.event_type
  `;

  try {
    const result = await clickhouse
      .query(query.taggedSql, {
        params: { ...query.taggedParams, start_date: startDate },
      })
      .toPromise();

    return UsageBreakdownRowSchema.array().parse(result);
  } catch (error) {
    console.error('Failed to get usage breakdown for period:', error);
    throw error;
  }
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
    FROM analytics.usage_daily
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

/**
 * Recorded replay sessions per site per day. session_replays gets one upsert per uploaded segment,
 * so sessions are counted distinctly; `date` is the session's creation day, so each session lands on one day.
 */
export async function getDailyRecordedSessionCountsForSites(
  siteIds: string[],
  earliestStart: DateString,
): Promise<DailySiteUsage[]> {
  if (siteIds.length === 0) return [];

  const query = safeSql`
    SELECT replays.site_id, toString(replays.date) AS date, uniqExact(replays.session_id) AS total
    FROM analytics.session_replays AS replays
    WHERE replays.site_id IN ${SQL.StringArray({ site_ids: siteIds })}
      AND replays.date >= toDate({earliest_start:String})
      AND replays.date <= toDate(now())
    GROUP BY replays.site_id, replays.date
  `;

  try {
    const result = await clickhouse
      .query(query.taggedSql, {
        params: { ...query.taggedParams, earliest_start: earliestStart },
      })
      .toPromise();

    return DailySiteUsageSchema.array().parse(result);
  } catch (error) {
    console.error('Failed to get daily recorded session counts for sites:', error);
    throw error;
  }
}

/**
 * Get total recorded replay sessions for user's sites within billing period
 */
export async function getUserRecordedSessionCountForPeriod(
  siteIds: string[],
  startDate: DateString,
): Promise<number> {
  if (siteIds.length === 0) return 0;

  const query = safeSql`
    SELECT uniqExact(replays.site_id, replays.session_id) AS total
    FROM analytics.session_replays AS replays
    WHERE replays.site_id IN ${SQL.StringArray({ site_ids: siteIds })}
      AND replays.date >= toDate({start_date:String})
      AND replays.date <= toDate(now())
  `;

  try {
    const result = await clickhouse
      .query(query.taggedSql, {
        params: { ...query.taggedParams, start_date: startDate },
      })
      .toPromise();

    const parsed = RecordedSessionCountResultSchema.array().parse(result);
    return parsed[0]?.total || 0;
  } catch (error) {
    console.error('Failed to get user recorded session count:', error);
    return 0;
  }
}
