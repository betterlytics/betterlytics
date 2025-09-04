import { clickhouse } from '@/lib/clickhouse';
import { DateTimeString } from '@/types/dates';
import { HeatmapMetric, WeeklyHeatmapRow, WeeklyHeatmapRowSchema } from '@/entities/weeklyHeatmap';
import { BAQuery } from '@/lib/ba-query';
import { safeSql, SQL } from '@/lib/safe-sql';
import { QueryFilter } from '@/entities/filter';

function getBaseAggregation(metric: HeatmapMetric) {
  switch (metric) {
    case 'pageviews':
      return safeSql`count()`;
    case 'unique_visitors':
      return safeSql`uniq(visitor_id)`;
    case 'sessions':
      return safeSql`uniq(session_id)`;
    case 'bounce_rate':
      return null as unknown as ReturnType<typeof safeSql>;
    case 'pages_per_session':
      return null as unknown as ReturnType<typeof safeSql>;
    case 'session_duration':
      return null as unknown as ReturnType<typeof safeSql>;
  }
}

export async function getWeeklyHeatmap(
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
  metric: HeatmapMetric,
  queryFilters: QueryFilter[],
): Promise<WeeklyHeatmapRow[]> {
  const filters = BAQuery.getFilterQuery(queryFilters);

  if (metric === 'bounce_rate' || metric === 'pages_per_session' || metric === 'session_duration') {
    // Build from session_data per hour bucket then aggregate by weekday/hour across the range
    const query = safeSql`
      WITH session_data AS (
        SELECT
          session_id,
          toDayOfWeek(timestamp) as weekday,
          toHour(timestamp) as hour,
          count() as page_count,
          if(count() > 1, dateDiff('second', min(timestamp), max(timestamp)), 0) as duration_seconds
        FROM analytics.events
        WHERE site_id = {site_id:String}
          AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
          AND ${SQL.AND(filters)}
          AND event_type = 'pageview'
        GROUP BY session_id, weekday, hour
      )
      SELECT
        any(toDateTime64(0, 3)) as date,
        weekday,
        hour,
        ${SQL.Unsafe(
          metric === 'bounce_rate'
            ? 'if(count() > 0, round((count() - countIf(page_count > 1)) / count() * 100, 1), 0)'
            : metric === 'pages_per_session'
              ? 'if(count() > 0, round(sum(page_count) / count(), 1), 0)'
              : 'if(countIf(page_count > 1) > 0, round(avgIf(duration_seconds, page_count > 1), 0), 0)',
        )} as value
      FROM session_data
      GROUP BY weekday, hour
      ORDER BY weekday ASC, hour ASC
    `;

    const result = (await clickhouse
      .query(query.taggedSql, {
        params: {
          ...query.taggedParams,
          site_id: siteId,
          start: startDate,
          end: endDate,
        },
      })
      .toPromise()) as any[];

    return result.map((row) =>
      WeeklyHeatmapRowSchema.parse({
        date: new Date().toISOString(),
        weekday: Number(row.weekday),
        hour: Number(row.hour),
        value: Number(row.value),
      }),
    );
  }

  const aggregation = getBaseAggregation(metric);

  const query = safeSql`
    SELECT
      any(toStartOfHour(timestamp)) as date,
      toDayOfWeek(timestamp) as weekday,
      toHour(timestamp) as hour,
      ${aggregation} as value
    FROM analytics.events
    WHERE site_id = {site_id:String}
      AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
      AND ${SQL.AND(filters)}
      ${metric === 'pageviews' ? safeSql`AND event_type = 'pageview'` : safeSql``}
    GROUP BY weekday, hour
    ORDER BY weekday ASC, hour ASC
  `;

  const result = (await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        start: startDate,
        end: endDate,
      },
    })
    .toPromise()) as any[];

  return result.map((row) =>
    WeeklyHeatmapRowSchema.parse({
      date: String(row.date),
      weekday: Number(row.weekday),
      hour: Number(row.hour),
      value: Number(row.value),
    }),
  );
}
