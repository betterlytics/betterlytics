import { z } from 'zod';
import { clickhouse } from '@/lib/clickhouse';
import { JourneyTransition, JourneyTransitionSchema } from '@/entities/analytics/userJourney.entities';
import { safeSql, SQL, type SQLTaggedExpression } from '@/lib/safe-sql';
import { BAQuery } from '@/lib/ba-query';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';
import { isUsableFilter, type QueryFilter } from '@/entities/analytics/filter.entities';
import { classifyStepFilter, type StepFiltersBySlot } from '@/entities/analytics/stepFilters.entities';

type JourneyQueryArgs = {
  queryFilters: QueryFilter[];
  stepFilters: StepFiltersBySlot;
  numberOfSteps: number;
  sample: SQLTaggedExpression;
};

function buildJourneyPipeline(
  { queryFilters, stepFilters, numberOfSteps, sample }: JourneyQueryArgs,
  mode: 'journey' | 'attribution',
) {
  const eventFilters: Array<{ slot: number; filter: QueryFilter }> = [];
  const entryFilters: QueryFilter[] = [];
  const exitFilters: QueryFilter[] = [];
  const positionalFilters: Array<{ slot: number; filter: QueryFilter }> = [];

  for (const [slotKey, slotFilters] of Object.entries(stepFilters)) {
    const slot = Number(slotKey);
    for (const filter of slotFilters.filter((filter) => isUsableFilter(filter) && filter.values.length > 0)) {
      switch (classifyStepFilter(filter.column, slot, numberOfSteps - 1)) {
        case 'event':
          eventFilters.push({ slot, filter });
          break;
        case 'entry':
          entryFilters.push(filter);
          break;
        case 'exit':
          exitFilters.push(filter);
          break;
        case 'positional':
          positionalFilters.push({ slot, filter });
          break;
        case 'infeasible':
          break;
      }
    }
  }

  const filters = BAQuery.getFilterQuery(queryFilters);

  const entryPredicates = entryFilters.map((filter, index) => BAQuery.buildEntryPredicate(filter, index));
  const hasEntry = entryPredicates.length > 0;
  const entryHaving = mode === 'journey' && hasEntry ? safeSql` HAVING ${SQL.AND(entryPredicates)}` : safeSql``;
  const entryOkColumn =
    mode === 'attribution' && hasEntry ? safeSql`, (${SQL.AND(entryPredicates)}) AS entry_ok` : safeSql``;

  const hasExit = exitFilters.length > 0;
  const exitOrderedColumns = hasExit ? safeSql`, max(timestamp) AS last_pageview_ts` : safeSql``;
  const exitSessionColumns = hasExit
    ? safeSql`, length(arrayFilter((x, idx) -> idx = 1 OR x.2 != sorted_tuples[idx - 1].2, sorted_tuples, arrayEnumerate(sorted_tuples))) AS full_path_length`
    : safeSql``;
  const exitCte = hasExit
    ? safeSql`,
    exit_clicks AS (
      SELECT session_id, max(timestamp) AS last_matching_click
      FROM analytics.events ${sample}
      WHERE
        site_id = {site_id:String}
        AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
        AND event_type = 'outbound_link'
        AND ${SQL.AND(exitFilters.map((filter, index) => BAQuery.buildExitPredicate(filter, index)))}
      GROUP BY session_id
    )`
    : safeSql``;
  const exitJoin = hasExit ? safeSql` ANY LEFT JOIN exit_clicks USING (session_id)` : safeSql``;

  const eventFlags = eventFilters.map(({ slot, filter }, index) => ({
    column: slot + 1,
    alias: `evt_ok_${index}`,
    predicate: BAQuery.buildEventPredicate(filter, index),
  }));
  const eventOkColumns = eventFlags.reduce(
    (acc, flag) => safeSql`${acc}, ${flag.predicate} AS ${SQL.Unsafe(flag.alias)}`,
    safeSql``,
  );

  const eventCarry = eventFlags.reduce((acc, flag) => safeSql`${acc}, ${SQL.Unsafe(flag.alias)}`, safeSql``);
  const exitCarry = hasExit ? safeSql`, last_matching_click, last_pageview_ts` : safeSql``;
  const entryCarry = mode === 'attribution' && hasEntry ? safeSql`, entry_ok` : safeSql``;

  const gates = new Map<number, SQLTaggedExpression[]>();
  const addGate = (column: number, expr: SQLTaggedExpression) => {
    if (!Number.isInteger(column) || column < 1 || column > 32) {
      throw new Error(`Invalid journey gate column: ${column}`);
    }
    gates.set(column, [...(gates.get(column) ?? []), expr]);
  };
  if (mode === 'attribution' && hasEntry) {
    addGate(1, safeSql`entry_ok`);
  }
  positionalFilters.forEach(({ slot, filter }, index) =>
    addGate(slot + 1, BAQuery.buildPositionalUrlPredicate(filter, slot, index)),
  );
  eventFlags.forEach((flag) => addGate(flag.column, safeSql`${SQL.Unsafe(flag.alias)} = 1`));
  if (hasExit) {
    addGate(numberOfSteps, safeSql`full_path_length = {max_length:UInt8} AND last_matching_click > last_pageview_ts`);
  }

  const gateColumns = [...gates.keys()].sort((a, b) => a - b);
  const gateExprs = gateColumns.map((column) =>
    safeSql`(length(path) >= ${SQL.Unsafe(String(column))} AND (${SQL.AND(gates.get(column)!)}))`,
  );

  const prefix = safeSql`
    WITH ordered_events AS (
      SELECT
        session_id,
        arraySort(x -> x.1, groupArray((timestamp, url))) AS sorted_tuples,
        any(_sample_factor) as _sample_factor${exitOrderedColumns}${eventOkColumns}${entryOkColumn}
      FROM analytics.events ${sample}
      WHERE
        site_id = {site_id:String}
        AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
        AND url != ''
        AND event_type = 'pageview'
        AND ${SQL.AND(filters)}
      GROUP BY session_id${entryHaving}
    )${exitCte},
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
        ) AS path,
        _sample_factor${exitSessionColumns}${exitCarry}${eventCarry}${entryCarry}
      FROM ordered_events${exitJoin}
    )`;

  return { prefix, gateExprs, gateColumns };
}

export function buildJourneyQuery(args: JourneyQueryArgs) {
  const { prefix, gateExprs } = buildJourneyPipeline(args, 'journey');
  const gateWhere = gateExprs.reduce((acc, gate) => safeSql`${acc} AND ${gate}`, safeSql``);
  return safeSql`${prefix},
    filtered_paths AS (
      SELECT path, _sample_factor
      FROM session_paths
      WHERE length(path) > 1${gateWhere}
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

export function buildJourneyAttributionQuery(args: JourneyQueryArgs) {
  const { prefix, gateExprs, gateColumns } = buildJourneyPipeline(args, 'attribution');
  if (gateExprs.length === 0) {
    throw new Error('Journey attribution requires at least one step filter gate');
  }
  let running = safeSql`length(path) > 1`;
  let survivors = safeSql`countIf(length(path) > 1)`;
  for (const gate of gateExprs) {
    running = safeSql`${running} AND ${gate}`;
    survivors = safeSql`${survivors}, countIf(${running})`;
  }
  const query = safeSql`${prefix}
    SELECT [${survivors}] AS survivors
    FROM session_paths`;
  return { query, gateColumns };
}

export function mapAttribution(
  survivors: number[],
  gateColumns: number[],
): { totalJourneys: number; failingSlot: number | null } {
  const totalJourneys = survivors[0] ?? 0;
  if (totalJourneys === 0) return { totalJourneys, failingSlot: null };
  const failingIndex = survivors.findIndex((count, index) => index > 0 && count === 0);
  if (failingIndex < 1) return { totalJourneys, failingSlot: null };
  return { totalJourneys, failingSlot: (gateColumns[failingIndex - 1] ?? 1) - 1 };
}

const AttributionRowSchema = z.object({ survivors: z.array(z.coerce.number()) });

export async function getUserJourneyStepAttribution(
  siteQuery: BASiteQuery,
): Promise<{ totalJourneys: number; failingSlot: number | null }> {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;
  const { sample } = await BAQuery.getSampling(siteId, startDateTime, endDateTime);

  const { query, gateColumns } = buildJourneyAttributionQuery({
    queryFilters,
    stepFilters: siteQuery.userJourney.stepFilters,
    numberOfSteps: siteQuery.userJourney.numberOfSteps,
    sample,
  });

  const result = (await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        start: startDateTime,
        end: endDateTime,
        max_length: siteQuery.userJourney.numberOfSteps,
      },
    })
    .toPromise()) as unknown[];

  const { survivors } = AttributionRowSchema.parse(result[0]);
  return mapAttribution(survivors, gateColumns);
}

/**
 * Gets aggregated link transitions suitable for Sankey without client-side path expansion.
 * Each row represents a transition between consecutive steps (depth preserved).
 */
export async function getUserJourneyTransitions(
  siteQuery: BASiteQuery,
  limit: number = 50,
): Promise<JourneyTransition[]> {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;
  const { sample } = await BAQuery.getSampling(siteQuery.siteId, startDateTime, endDateTime);

  const query = buildJourneyQuery({
    queryFilters,
    stepFilters: siteQuery.userJourney.stepFilters,
    numberOfSteps: siteQuery.userJourney.numberOfSteps,
    sample,
  });

  const result = (await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        start: startDateTime,
        end: endDateTime,
        max_length: siteQuery.userJourney.numberOfSteps,
        limit,
      },
    })
    .toPromise()) as JourneyTransition[];

  return result.map((row) => JourneyTransitionSchema.parse(row));
}
