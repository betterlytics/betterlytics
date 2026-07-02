import { clickhouse } from '@/lib/clickhouse';
import { JourneyTransition, JourneyTransitionSchema } from '@/entities/analytics/userJourney.entities';
import { safeSql, SQL, type SQLTaggedExpression } from '@/lib/safe-sql';
import { BAQuery } from '@/lib/ba-query';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';
import { splitStepFilters, type JourneyStepFilters } from '@/utils/journeyStepFilters';
import type { QueryFilter } from '@/entities/analytics/filter.entities';

type JourneyQueryArgs = {
  queryFilters: QueryFilter[];
  stepFilters: JourneyStepFilters;
  sample: SQLTaggedExpression;
};

export function buildJourneyQuery({ queryFilters, stepFilters, sample }: JourneyQueryArgs) {
  const { sessionFilters, positionalUrlFilters } = splitStepFilters(stepFilters);
  const eventFilters = BAQuery.getFilterQuery([...queryFilters, ...sessionFilters]);

  let predicateIndex = 0;
  const positionalPredicates = positionalUrlFilters.map(({ position, filters }) => {
    const conditions = [
      safeSql`length(path) > ${SQL.Unsafe(String(position))}`,
      ...filters.map((filter) => BAQuery.buildPositionalUrlPredicate(filter, position, predicateIndex++)),
    ];
    return safeSql`(${SQL.AND(conditions)})`;
  });
  const positionalWhere = positionalPredicates.length > 0 ? SQL.AND(positionalPredicates) : safeSql`1=1`;

  return safeSql`
    WITH ordered_events AS (
      SELECT
        session_id,
        arraySort(x -> x.1, groupArray((timestamp, url))) AS sorted_tuples,
        any(_sample_factor) as _sample_factor
      FROM analytics.events ${sample}
      WHERE
        site_id = {site_id:String}
        AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
        AND url != ''
        AND event_type = 'pageview'
        AND ${SQL.AND(eventFilters)}
      GROUP BY session_id
    ),
    session_paths AS (
      SELECT
        /* Collapse consecutive duplicate URLs per session, keep order */
        arrayMap(
          x -> x.2,
          arrayFilter(
            (x, idx) -> idx = 1 OR x.2 != sorted_tuples[idx - 1].2,
            sorted_tuples,
            arrayEnumerate(sorted_tuples)
          )
        ) AS path,
        _sample_factor
      FROM ordered_events
    ),
    /* Positional step filters run on the full path, then trim to max_length for display */
    filtered_paths AS (
      SELECT
        arraySlice(path, 1, {max_length:UInt8}) AS path,
        _sample_factor
      FROM session_paths
      WHERE length(path) > 1
        AND ${positionalWhere}
    ),
    /* Group by distinct path and count occurrences, then take top N paths */
    top_paths AS (
      SELECT
        path,
        COUNT(*) AS path_count,
        any(_sample_factor) as _sample_factor
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
      SUM(path_count) * any(_sample_factor) AS value
    FROM top_paths
    ARRAY JOIN arrayEnumerate(path) AS i
    WHERE i < length(path)
    GROUP BY source, target, source_depth, target_depth
    ORDER BY value DESC
  `;
}

/**
 * Gets aggregated link transitions suitable for Sankey without client-side path expansion.
 * Each row represents a transition between consecutive steps (depth preserved).
 */
export async function getUserJourneyTransitions(
  siteQuery: BASiteQuery,
  maxPathLength: number = 3,
  limit: number = 50,
): Promise<JourneyTransition[]> {
  const { siteId, queryFilters, startDateTime, endDateTime, userJourney } = siteQuery;
  const { sample } = await BAQuery.getSampling(siteId, startDateTime, endDateTime);
  const query = buildJourneyQuery({ queryFilters, stepFilters: userJourney.stepFilters, sample });

  const result = (await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        start: startDateTime,
        end: endDateTime,
        max_length: maxPathLength,
        limit,
      },
    })
    .toPromise()) as JourneyTransition[];

  return result.map((row) => JourneyTransitionSchema.parse(row));
}
