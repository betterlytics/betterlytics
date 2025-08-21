import { clickhouse } from '@/lib/clickhouse';
import { safeSql, SQL } from '@/lib/safe-sql';
import { DateTimeString } from '@/types/dates';
import { BAQuery } from '@/lib/ba-query';
import {
  CoreWebVitalRow,
  CoreWebVitalRowSchema,
  CoreWebVitalsSummary,
  CoreWebVitalsSummarySchema,
  CORE_WEB_VITAL_NAMES,
  CoreWebVitalSeriesRow,
  CoreWebVitalSeriesRowSchema,
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

export async function getCoreWebVitalSeries(
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
  granularitySql: (column: 'timestamp' | 'date' | 'custom_date', start: DateTimeString) => any,
  queryFilters: any[],
  metricName: string,
): Promise<CoreWebVitalSeriesRow[]> {
  const filters = BAQuery.getFilterQuery(queryFilters || []);

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
      name,
      max(value) AS value
    FROM metrics
    WHERE name = {metric:String}
    GROUP BY date, name
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
    .toPromise()) as Array<{ date: string; name: string; value: number }>;

  return rows.map((r) => CoreWebVitalSeriesRowSchema.parse(r));
}
