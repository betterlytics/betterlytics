import { clickhouse } from '@/lib/clickhouse';
import { DateTimeString } from '@/types/dates';
import {
  DeviceType,
  DeviceTypeSchema,
  BrowserInfoSchema,
  BrowserInfo,
  OperatingSystemInfoSchema,
  OperatingSystemInfo,
  DeviceUsageTrendRow,
  DeviceUsageTrendRowSchema,
  BrowserRollupRowSchema,
  BrowserRollupRow,
  OperatingSystemRollupRowSchema,
  OperatingSystemRollupRow,
} from '@/entities/devices';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { BAQuery } from '@/lib/ba-query';
import { QueryFilter } from '@/entities/filter';
import { safeSql, SQL } from '@/lib/safe-sql';

export async function getDeviceBreakdown(
  siteId: string,
  timezone: string,
  granularity: GranularityRangeValues,
  startDate: DateTimeString,
  endDate: DateTimeString,
) {
  console.log('Start/end date', startDate, endDate);
  const intervalFunc = BAQuery.getIntervalSQLFunctionFromTimeZone(granularity, timezone);

  const query = safeSql`
    SELECT 
      ${intervalFunc('timestamp')} as date,
      device_type,
      uniq(visitor_id) as count
    FROM analytics.events
    WHERE site_id = ${SQL.String({ site_id: siteId })}
      AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
    GROUP BY date, device_type
    ORDER BY date ASC, count DESC
  `;
  const result = (await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, start: startDate, end: endDate },
    })
    .toPromise()) as any[];

  return result;
}

export async function getDeviceTypeBreakdown(
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
  queryFilters: QueryFilter[],
): Promise<DeviceType[]> {
  const filters = BAQuery.getFilterQuery(queryFilters);

  const query = safeSql`
    SELECT device_type, uniq(visitor_id) as visitors
    FROM analytics.events
    WHERE site_id = {site_id:String}
      AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
      AND ${SQL.AND(filters)}
    GROUP BY device_type
    ORDER BY visitors DESC
  `;
  const result = (await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, site_id: siteId, start: startDate, end: endDate },
    })
    .toPromise()) as any[];

  const mappedResults = result.map((row) => ({
    device_type: row.device_type,
    visitors: Number(row.visitors),
  }));

  return DeviceTypeSchema.array().parse(mappedResults);
}

export async function getBrowserBreakdown(
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
  queryFilters: QueryFilter[],
): Promise<BrowserInfo[]> {
  const filters = BAQuery.getFilterQuery(queryFilters);
  const query = safeSql`
    SELECT browser, uniq(visitor_id) as visitors
    FROM analytics.events
    WHERE site_id = {site_id:String}
      AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
      AND ${SQL.AND(filters)}
    GROUP BY browser
    ORDER BY visitors DESC
  `;
  const result = (await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, site_id: siteId, start: startDate, end: endDate },
    })
    .toPromise()) as any[];

  const mappedResults = result.map((row) => ({
    browser: row.browser,
    visitors: Number(row.visitors),
  }));

  return BrowserInfoSchema.array().parse(mappedResults);
}

export async function getBrowserRollup(
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
  queryFilters: QueryFilter[],
): Promise<BrowserRollupRow[]> {
  const query = safeSql`
    SELECT browser, browser_version as version, uniq(visitor_id) as visitors, grouping(browser_version) as is_rollup
    FROM analytics.events
    WHERE site_id = {site_id:String}
      AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
      AND browser != ''
      AND ${SQL.AND(BAQuery.getFilterQuery(queryFilters))}
    GROUP BY GROUPING SETS ((browser, browser_version), (browser))
    HAVING (is_rollup = 0 AND version != '') OR is_rollup = 1
    ORDER BY browser ASC, is_rollup DESC, visitors DESC
  `;

  const result = await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, site_id: siteId, start: startDate, end: endDate },
    })
    .toPromise();

  return BrowserRollupRowSchema.array().parse(result);
}

export async function getOperatingSystemBreakdown(
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
  queryFilters: QueryFilter[],
): Promise<OperatingSystemInfo[]> {
  const filters = BAQuery.getFilterQuery(queryFilters);
  const query = safeSql`
    SELECT os, uniq(visitor_id) as visitors
    FROM analytics.events
    WHERE site_id = {site_id:String}
      AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
      AND ${SQL.AND(filters)}
    GROUP BY os
    ORDER BY visitors DESC
  `;

  const result = (await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, site_id: siteId, start: startDate, end: endDate },
    })
    .toPromise()) as any[];

  const mappedResults = result.map((row) => ({
    os: row.os,
    visitors: Number(row.visitors),
  }));

  return OperatingSystemInfoSchema.array().parse(mappedResults);
}

export async function getOperatingSystemRollup(
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
  queryFilters: QueryFilter[],
): Promise<OperatingSystemRollupRow[]> {
  const query = safeSql`
    SELECT os, os_version as version, uniq(visitor_id) as visitors, grouping(os_version) as is_rollup
    FROM analytics.events
    WHERE site_id = {site_id:String}
      AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
      AND os != ''
      AND ${SQL.AND(BAQuery.getFilterQuery(queryFilters))}
    GROUP BY GROUPING SETS ((os, os_version), (os))
    HAVING (is_rollup = 0 AND version != '') OR is_rollup = 1
    ORDER BY os ASC, is_rollup DESC, visitors DESC
  `;

  const result = await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, site_id: siteId, start: startDate, end: endDate },
    })
    .toPromise();

  return OperatingSystemRollupRowSchema.array().parse(result);
}

export async function getDeviceUsageTrend(
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
  granularity: GranularityRangeValues,
  queryFilters: QueryFilter[],
  timezone: string,
): Promise<DeviceUsageTrendRow[]> {
  const granularityFunc = BAQuery.getIntervalSQLFunctionFromTimeZone(granularity, timezone);
  const filters = BAQuery.getFilterQuery(queryFilters);

  const query = safeSql`
    SELECT 
      ${granularityFunc('timestamp')} as date,
      device_type,
      uniq(visitor_id) as count
    FROM analytics.events
    WHERE site_id = {site_id:String}
      AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
      AND ${SQL.AND(filters)}
    GROUP BY date, device_type
    ORDER BY date ASC, count DESC
  `;

  const result = (await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, site_id: siteId, start: startDate, end: endDate },
    })
    .toPromise()) as any[];

  const mappedResults = result.map((row) => ({
    date: row.date,
    device_type: row.device_type,
    count: row.count,
  }));

  return DeviceUsageTrendRowSchema.array().parse(mappedResults);
}
