import { clickhouse } from '@/lib/clickhouse';
import { safeSql, SQL } from '@/lib/safe-sql';
import { DateTimeString } from '@/types/dates';
import { BAQuery } from '@/lib/ba-query';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import {
  CoreWebVitalRow,
  CoreWebVitalRowSchema,
  CoreWebVitalsSummary,
  CoreWebVitalsSummarySchema,
  CORE_WEB_VITAL_NAMES,
  CoreWebVitalNamedPercentilesRowSchema,
  CoreWebVitalNamedPercentilesRow,
  CWVDimension,
  CoreWebVitalsAllPercentilesPerDimensionRow,
  CoreWebVitalsAllPercentilesPerDimensionRowSchema,
} from '@/entities/webVitals';

export async function getCoreWebVitalsP75(
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
  queryFilters: any[],
): Promise<CoreWebVitalsSummary> {
  const filters = BAQuery.getFilterQuery(queryFilters || []);

  const query = safeSql`
    WITH metrics AS (
      SELECT
        pair.1 AS name,
        toFloat32(pair.2) AS value
      FROM analytics.events
      ARRAY JOIN arrayZip(['CLS','LCP','INP','FCP','TTFB'], [cwv_cls, cwv_lcp, cwv_inp, cwv_fcp, cwv_ttfb]) AS pair
      WHERE site_id = {site_id:String}
        AND event_type = 'cwv'
        AND timestamp BETWEEN {start_date:DateTime} AND {end_date:DateTime}
        AND ${SQL.AND(filters)}
        AND pair.2 IS NOT NULL
    )
    SELECT
      name,
      quantileTDigest(0.75)(value) AS p75
    FROM metrics
    WHERE name IN {metric_names:Array(String)}
    GROUP BY name
  `;

  const rows = (await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        start_date: startDate,
        end_date: endDate,
        metric_names: CORE_WEB_VITAL_NAMES,
      },
    })
    .toPromise()) as Array<{ name: string; p75: number | null }>;

  const parsed: CoreWebVitalRow[] = rows.map((r) => CoreWebVitalRowSchema.parse(r));

  const summary: CoreWebVitalsSummary = {
    clsP75: parsed.find((r) => r.name === 'CLS')?.p75 ?? null,
    lcpP75: parsed.find((r) => r.name === 'LCP')?.p75 ?? null,
    inpP75: parsed.find((r) => r.name === 'INP')?.p75 ?? null,
    fcpP75: parsed.find((r) => r.name === 'FCP')?.p75 ?? null,
    ttfbP75: parsed.find((r) => r.name === 'TTFB')?.p75 ?? null,
  };

  return CoreWebVitalsSummarySchema.parse(summary);
}

export async function getAllCoreWebVitalPercentilesSeries(
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
  granularity: GranularityRangeValues,
  queryFilters: any[],
  timezone: string,
): Promise<CoreWebVitalNamedPercentilesRow[]> {
  const filters = BAQuery.getFilterQuery(queryFilters || []);
  const { range, fill, timeWrapper, granularityFunc } = BAQuery.getTimestampRange(
    granularity,
    timezone,
    startDate,
    endDate,
  );

  const query = timeWrapper(
    safeSql`
      WITH metrics AS (
        SELECT
          ${granularityFunc('timestamp')} as date,
          pair.1 AS name,
          toFloat32(pair.2) AS value
        FROM analytics.events
        ARRAY JOIN arrayZip(['CLS','LCP','INP','FCP','TTFB'], [cwv_cls, cwv_lcp, cwv_inp, cwv_fcp, cwv_ttfb]) AS pair
        WHERE site_id = {site_id:String}
          AND event_type = 'cwv'
          AND ${range}
          AND ${SQL.AND(filters)}
          AND pair.2 IS NOT NULL
      )
      SELECT
        date,
        name,
        quantileTDigest(0.50)(value) AS p50,
        quantileTDigest(0.75)(value) AS p75,
        quantileTDigest(0.90)(value) AS p90,
        quantileTDigest(0.99)(value) AS p99
      FROM metrics
      WHERE name IN {metric_names:Array(String)}
      GROUP BY date, name
      ORDER BY date ASC WITH ${fill}
      LIMIT 10080
    `,
  );

  const rows = (await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        start_date: startDate,
        end_date: endDate,
        metric_names: CORE_WEB_VITAL_NAMES,
      },
    })
    .toPromise()) as Array<{ date: string; name: string; p50: number; p75: number; p90: number; p99: number }>;

  return rows.map((r) => CoreWebVitalNamedPercentilesRowSchema.parse(r));
}

export async function getCoreWebVitalsAllPercentilesByDimension(
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
  queryFilters: any[],
  dimension: CWVDimension,
): Promise<CoreWebVitalsAllPercentilesPerDimensionRow[]> {
  const filters = BAQuery.getFilterQuery(queryFilters || []);

  const query = safeSql`
    WITH metrics AS (
      SELECT
        CASE 
          WHEN {dim:String} = 'device_type' THEN device_type 
          WHEN {dim:String} = 'country_code' THEN country_code 
          WHEN {dim:String} = 'browser' THEN browser 
          WHEN {dim:String} = 'os' THEN os 
          ELSE url 
        END AS key,
        pair.1 AS name,
        toFloat32(pair.2) AS value
      FROM analytics.events
      ARRAY JOIN arrayZip(['CLS','LCP','INP','FCP','TTFB'], [cwv_cls, cwv_lcp, cwv_inp, cwv_fcp, cwv_ttfb]) AS pair
      WHERE site_id = {site_id:String}
        AND event_type = 'cwv'
        AND timestamp BETWEEN {start_date:DateTime} AND {end_date:DateTime}
        AND ${SQL.AND(filters)}
        AND pair.2 IS NOT NULL
    )
    SELECT
      key,
      name,
      quantileTDigest(0.50)(value) AS p50,
      quantileTDigest(0.75)(value) AS p75,
      quantileTDigest(0.90)(value) AS p90,
      quantileTDigest(0.99)(value) AS p99,
      count() AS samples
    FROM metrics
    WHERE name IN {metric_names:Array(String)}
    GROUP BY key, name
    ORDER BY key ASC
    LIMIT 100000
  `;

  const rows = (await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        start_date: startDate,
        end_date: endDate,
        dim: dimension,
        metric_names: CORE_WEB_VITAL_NAMES,
      },
    })
    .toPromise()) as Array<CoreWebVitalsAllPercentilesPerDimensionRow>;

  return rows.map((r) => CoreWebVitalsAllPercentilesPerDimensionRowSchema.parse(r));
}

export async function hasCoreWebVitalsData(siteId: string): Promise<boolean> {
  const query = safeSql`
    SELECT 1
    FROM analytics.events 
    WHERE site_id = {site_id:String} AND event_type = 'cwv'
    LIMIT 1
  `;

  const result = await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
      },
    })
    .toPromise();

  return result.length > 0;
}
