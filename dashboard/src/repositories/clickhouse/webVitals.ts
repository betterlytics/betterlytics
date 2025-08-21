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
  CoreWebVitalPercentilesRow,
  CoreWebVitalPercentilesRowSchema,
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
        JSONExtractString(metric, 'name') AS name,
        JSONExtractFloat(metric, 'value') AS value
      FROM analytics.events
      ARRAY JOIN JSONExtractArrayRaw(custom_event_json, 'metrics') AS metric
      WHERE site_id = {site_id:String}
        AND event_type = 'cwv'
        AND timestamp BETWEEN {start_date:DateTime} AND {end_date:DateTime}
        AND custom_event_json != ''
        AND custom_event_json != '{}'
        AND ${SQL.AND(filters)}
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

export async function getCoreWebVitalPercentilesSeries(
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
  granularity: GranularityRangeValues,
  queryFilters: any[],
  metricName: string,
): Promise<CoreWebVitalPercentilesRow[]> {
  const filters = BAQuery.getFilterQuery(queryFilters || []);
  const granularitySql = BAQuery.getGranularitySQLFunctionFromGranularityRange(granularity);

  const query = safeSql`
    WITH metrics AS (
      SELECT
        ${granularitySql('timestamp', startDate)} as date,
        JSONExtractString(metric, 'name') AS name,
        JSONExtractFloat(metric, 'value') AS value
      FROM analytics.events
      ARRAY JOIN JSONExtractArrayRaw(custom_event_json, 'metrics') AS metric
      WHERE site_id = {site_id:String}
        AND event_type = 'cwv'
        AND timestamp BETWEEN {start_date:DateTime} AND {end_date:DateTime}
        AND custom_event_json != ''
        AND custom_event_json != '{}'
        AND ${SQL.AND(filters)}
    )
    SELECT
      date,
      quantileTDigest(0.50)(value) AS p50,
      quantileTDigest(0.75)(value) AS p75,
      quantileTDigest(0.90)(value) AS p90,
      quantileTDigest(0.99)(value) AS p99
    FROM metrics
    WHERE name = {metric:String}
    GROUP BY date
    ORDER BY date ASC
    LIMIT 10080
  `;

  const rows = (await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        start_date: startDate,
        end_date: endDate,
        metric: metricName,
      },
    })
    .toPromise()) as Array<{ date: string; p50: number; p75: number; p90: number; p99: number }>;

  return rows.map((r) => CoreWebVitalPercentilesRowSchema.parse(r));
}
