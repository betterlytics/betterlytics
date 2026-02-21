import { clickhouse } from '@/lib/clickhouse';
import { JourneyTransition, JourneyTransitionSchema } from '@/entities/analytics/userJourney.entities';
import { safeSql, SQL } from '@/lib/safe-sql';
import { BAQuery } from '@/lib/ba-query';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

/**
 * Gets aggregated link transitions suitable for Sankey without client-side path expansion.
 * Each row represents a transition between consecutive steps (depth preserved).
 */
export async function getUserJourneyTransitions(
  siteQuery: BASiteQuery,
  maxPathLength: number = 3,
  limit: number = 50,
): Promise<JourneyTransition[]> {
  const { siteId, queryFilters } = siteQuery;
  const { startDateTime: startDate, endDateTime: endDate } = siteQuery;
  const filters = BAQuery.getFilterQuery(queryFilters);
  const query = safeSql`
    WITH ordered_events AS (
      SELECT
        session_id,
        arraySort(x -> x.1, groupArray((timestamp, url))) AS sorted_tuples
      FROM analytics.events
      WHERE
        site_id = {site_id:String}
        AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
        AND url != ''
        AND event_type = 'pageview'
        AND ${SQL.AND(filters)}
      GROUP BY session_id
    ),
    session_paths AS (
      SELECT
        /* Collapse consecutive duplicate URLs per session, keep order, then trim to max_length */
        arrayMap(
          x -> x.2,
          arraySlice(
            arrayFilter(
              (x, idx) -> idx = 1 OR x.2 != sorted_tuples[idx - 1].2,
              sorted_tuples,
              arrayEnumerate(sorted_tuples)
            ),
            1,
            {max_length:UInt8}
          )
        ) AS path
      FROM ordered_events
    ),
    filtered_paths AS (
      SELECT path
      FROM session_paths
      WHERE length(path) > 1
    ),
    /* Group by distinct path and count occurrences, then take top N paths */
    top_paths AS (
      SELECT
        path,
        COUNT(*) AS path_count
      FROM filtered_paths
      GROUP BY path
      ORDER BY path_count DESC
      LIMIT {limit:UInt32}
    )
    /* Expand top paths into transitions */
    SELECT
      path[i]     AS source,
      path[i + 1] AS target,
      (i - 1)     AS source_depth,
      i           AS target_depth,
      SUM(path_count) AS value
    FROM top_paths
    ARRAY JOIN arrayEnumerate(path) AS i
    WHERE i < length(path)
    GROUP BY source, target, source_depth, target_depth
    ORDER BY value DESC
  `;

  const result = (await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        start: startDate,
        end: endDate,
        max_length: maxPathLength,
        limit,
      },
    })
    .toPromise()) as JourneyTransition[];

  return result.map((row) => JourneyTransitionSchema.parse(row));
}
