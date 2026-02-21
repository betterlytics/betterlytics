import { clickhouse } from '@/lib/clickhouse';
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
} from '@/entities/analytics/devices.entities';
import { BAQuery } from '@/lib/ba-query';
import { safeSql, SQL } from '@/lib/safe-sql';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';
import { toDateTimeString } from '@/utils/dateFormatters';

export async function getDeviceTypeBreakdown(siteQuery: BASiteQuery): Promise<DeviceType[]> {
  const { siteId, queryFilters } = siteQuery;
  const startDate = toDateTimeString(siteQuery.startDate);
  const endDate = toDateTimeString(siteQuery.endDate);
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

export async function getBrowserBreakdown(siteQuery: BASiteQuery): Promise<BrowserInfo[]> {
  const { siteId, queryFilters } = siteQuery;
  const startDate = toDateTimeString(siteQuery.startDate);
  const endDate = toDateTimeString(siteQuery.endDate);
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

export async function getBrowserRollup(siteQuery: BASiteQuery): Promise<BrowserRollupRow[]> {
  const { siteId, queryFilters } = siteQuery;
  const startDate = toDateTimeString(siteQuery.startDate);
  const endDate = toDateTimeString(siteQuery.endDate);
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

export async function getOperatingSystemBreakdown(siteQuery: BASiteQuery): Promise<OperatingSystemInfo[]> {
  const { siteId, queryFilters } = siteQuery;
  const startDate = toDateTimeString(siteQuery.startDate);
  const endDate = toDateTimeString(siteQuery.endDate);
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

export async function getOperatingSystemRollup(siteQuery: BASiteQuery): Promise<OperatingSystemRollupRow[]> {
  const { siteId, queryFilters } = siteQuery;
  const startDate = toDateTimeString(siteQuery.startDate);
  const endDate = toDateTimeString(siteQuery.endDate);
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

export async function getDeviceUsageTrend(siteQuery: BASiteQuery): Promise<DeviceUsageTrendRow[]> {
  const { siteId, queryFilters, granularity, timezone } = siteQuery;
  const startDate = toDateTimeString(siteQuery.startDate);
  const endDate = toDateTimeString(siteQuery.endDate);
  const filters = BAQuery.getFilterQuery(queryFilters);
  const { range, fill, timeWrapper, granularityFunc } = BAQuery.getTimestampRange(
    granularity,
    timezone,
    startDate,
    endDate,
  );

  const query = timeWrapper(
    safeSql`
      SELECT
        ${granularityFunc('timestamp')} as date,
        device_type,
        uniq(visitor_id) as count
      FROM analytics.events
      WHERE site_id = {site_id:String}
        AND ${range}
        AND ${SQL.AND(filters)}
      GROUP BY date, device_type
      ORDER BY date ASC ${fill}, count DESC
    `,
  );

  const result = (await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, site_id: siteId },
    })
    .toPromise()) as any[];

  const mappedResults = result.map((row) => ({
    date: row.date,
    device_type: row.device_type,
    count: row.count,
  }));

  return DeviceUsageTrendRowSchema.array().parse(mappedResults);
}
