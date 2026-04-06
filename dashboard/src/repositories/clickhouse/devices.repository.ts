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
import { BASessionQuery } from '@/lib/ba-session-query';

export async function getDeviceTypeBreakdown(siteQuery: BASiteQuery): Promise<DeviceType[]> {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;

  if (!BASessionQuery.canUseHourlyMV(siteQuery)) {
    const sessionSubQuery = BASessionQuery.getSessionTableSubQuery(
      ['visitor_id', 'device_type'],
      queryFilters,
      siteId,
      startDateTime,
      endDateTime,
    );

    const query = safeSql`
      SELECT device_type, uniq(visitor_id) as visitors
      FROM ${sessionSubQuery}
      GROUP BY device_type
      ORDER BY visitors DESC
    `;

    const result = (await clickhouse.query(query.taggedSql, { params: query.taggedParams }).toPromise()) as any[];
    return DeviceTypeSchema.array().parse(
      result.map((row) => ({ device_type: row.device_type, visitors: Number(row.visitors) })),
    );
  }

  const query = safeSql`
    SELECT device_type, uniqMerge(visitors) as visitors
    FROM analytics.overview_hourly
    WHERE site_id = ${SQL.String({ siteId })}
      AND hour BETWEEN ${SQL.DateTime({ startDate: startDateTime })} AND ${SQL.DateTime({ endDate: endDateTime })}
    GROUP BY device_type
    ORDER BY visitors DESC
  `;

  const result = (await clickhouse.query(query.taggedSql, { params: query.taggedParams }).toPromise()) as any[];
  return DeviceTypeSchema.array().parse(
    result.map((row) => ({ device_type: row.device_type, visitors: Number(row.visitors) })),
  );
}

export async function getBrowserBreakdown(siteQuery: BASiteQuery): Promise<BrowserInfo[]> {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;

  if (!BASessionQuery.canUseHourlyMV(siteQuery)) {
    const filters = BAQuery.getFilterQuery(queryFilters);
    const { sample } = await BAQuery.getSampling(siteId, startDateTime, endDateTime);
    const query = safeSql`
      SELECT browser, uniq(visitor_id) * any(_sample_factor) as visitors
      FROM analytics.events ${sample}
      WHERE site_id = {site_id:String}
        AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
        AND ${SQL.AND(filters)}
      GROUP BY browser
      ORDER BY visitors DESC
    `;
    const result = (await clickhouse
      .query(query.taggedSql, {
        params: { ...query.taggedParams, site_id: siteId, start: startDateTime, end: endDateTime },
      })
      .toPromise()) as any[];

    return BrowserInfoSchema.array().parse(
      result.map((row) => ({ browser: row.browser, visitors: Number(row.visitors) })),
    );
  }

  const query = safeSql`
    SELECT browser, uniqMerge(visitors) as visitors
    FROM analytics.overview_hourly
    WHERE site_id = ${SQL.String({ siteId })}
      AND hour BETWEEN ${SQL.DateTime({ startDate: startDateTime })} AND ${SQL.DateTime({ endDate: endDateTime })}
      AND browser != ''
    GROUP BY browser
    ORDER BY visitors DESC
  `;

  const result = (await clickhouse.query(query.taggedSql, { params: query.taggedParams }).toPromise()) as any[];
  return BrowserInfoSchema.array().parse(
    result.map((row) => ({ browser: row.browser, visitors: Number(row.visitors) })),
  );
}

export async function getBrowserRollup(siteQuery: BASiteQuery): Promise<BrowserRollupRow[]> {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;

  const sessionSubQuery = BASessionQuery.getSessionTableSubQuery(
    ['browser', 'browser_version', 'visitor_id'],
    queryFilters,
    siteId,
    startDateTime,
    endDateTime,
    false,
  );

  const query = safeSql`
    SELECT browser, browser_version as version, uniq(visitor_id) as visitors, grouping(browser_version) as is_rollup
    FROM ${sessionSubQuery}
    WHERE browser != ''
    GROUP BY GROUPING SETS ((browser, browser_version), (browser))
    HAVING (is_rollup = 0 AND version != '') OR is_rollup = 1
    ORDER BY browser ASC, is_rollup DESC, visitors DESC
  `;

  const result = await clickhouse
    .query(query.taggedSql, { params: query.taggedParams })
    .toPromise();

  return BrowserRollupRowSchema.array().parse(result);
}

export async function getOperatingSystemBreakdown(siteQuery: BASiteQuery): Promise<OperatingSystemInfo[]> {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;

  if (!BASessionQuery.canUseHourlyMV(siteQuery)) {
    const filters = BAQuery.getFilterQuery(queryFilters);
    const { sample } = await BAQuery.getSampling(siteId, startDateTime, endDateTime);
    const query = safeSql`
      SELECT os, uniq(visitor_id) * any(_sample_factor) as visitors
      FROM analytics.events ${sample}
      WHERE site_id = {site_id:String}
        AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
        AND ${SQL.AND(filters)}
      GROUP BY os
      ORDER BY visitors DESC
    `;

    const result = (await clickhouse
      .query(query.taggedSql, {
        params: { ...query.taggedParams, site_id: siteId, start: startDateTime, end: endDateTime },
      })
      .toPromise()) as any[];

    return OperatingSystemInfoSchema.array().parse(
      result.map((row) => ({ os: row.os, visitors: Number(row.visitors) })),
    );
  }

  const query = safeSql`
    SELECT os, uniqMerge(visitors) as visitors
    FROM analytics.overview_hourly
    WHERE site_id = ${SQL.String({ siteId })}
      AND hour BETWEEN ${SQL.DateTime({ startDate: startDateTime })} AND ${SQL.DateTime({ endDate: endDateTime })}
      AND os != ''
    GROUP BY os
    ORDER BY visitors DESC
  `;

  const result = (await clickhouse.query(query.taggedSql, { params: query.taggedParams }).toPromise()) as any[];
  return OperatingSystemInfoSchema.array().parse(
    result.map((row) => ({ os: row.os, visitors: Number(row.visitors) })),
  );
}

export async function getOperatingSystemRollup(siteQuery: BASiteQuery): Promise<OperatingSystemRollupRow[]> {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;

  const sessionSubQuery = BASessionQuery.getSessionTableSubQuery(
    ['os', 'os_version', 'visitor_id'],
    queryFilters,
    siteId,
    startDateTime,
    endDateTime,
    false,
  );

  const query = safeSql`
      SELECT os, os_version as version, uniq(visitor_id) as visitors, grouping(os_version) as is_rollup
      FROM ${sessionSubQuery}
      WHERE os != ''
      GROUP BY GROUPING SETS ((os, os_version), (os))
      HAVING (is_rollup = 0 AND version != '') OR is_rollup = 1
      ORDER BY os ASC, is_rollup DESC, visitors DESC
    `;

  const result = await clickhouse
    .query(query.taggedSql, { params: query.taggedParams })
    .toPromise();

  return OperatingSystemRollupRowSchema.array().parse(result);
}

export async function getDeviceUsageTrend(siteQuery: BASiteQuery): Promise<DeviceUsageTrendRow[]> {
  const { siteId, queryFilters, granularity, timezone, startDateTime, endDateTime } = siteQuery;
  const filters = BAQuery.getFilterQuery(queryFilters);
  const { range, fill, timeWrapper, granularityFunc } = BAQuery.getTimestampRange(
    granularity,
    timezone,
    startDateTime,
    endDateTime,
  );
  const { sample } = await BAQuery.getSampling(siteQuery.siteId, startDateTime, endDateTime);

  const query = timeWrapper(
    safeSql`
      SELECT
        ${granularityFunc('timestamp')} as date,
        device_type,
        uniq(visitor_id) * any(_sample_factor) as count
      FROM analytics.events ${sample}
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
