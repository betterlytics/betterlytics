import { clickhouse } from '@/lib/clickhouse';
import { JourneyTransition, JourneyTransitionSchema } from '@/entities/analytics/userJourney.entities';
import { safeSql, SQL, type SQLTaggedExpression } from '@/lib/safe-sql';
import { BAQuery } from '@/lib/ba-query';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';
import {
  isUsableFilter,
  parseFilterColumn,
  type FilterColumn,
  type QueryFilter,
  type ScopeFilter,
  type TableFilterColumn,
} from '@/entities/analytics/filter.entities';
import {
  classifyStepFilter,
  pruneStepFilters,
  stripInfeasibleStepFilters,
} from '@/entities/analytics/stepFilters.entities';
import { filterColumnSql } from '@/lib/filter-sql';
import { PROPERTY_SQL } from '@/lib/property-source-sql';

type JourneyCarry = {
  entryColumn?: TableFilterColumn;
  exit?: boolean;
  fullTs?: boolean;
  sessionId?: boolean;
};

type JourneyQueryArgs = {
  queryFilters: QueryFilter[];
  stepFilters: Record<string, ScopeFilter[]>;
  numberOfSteps: number;
  sample: SQLTaggedExpression;
  carry?: JourneyCarry;
};

function buildJourneyPipeline({ queryFilters, stepFilters, numberOfSteps, sample, carry = {} }: JourneyQueryArgs) {
  const entryFilters: ScopeFilter[] = [];
  const exitFilters: ScopeFilter[] = [];
  const positionalFilters: Array<{ slot: number; filter: ScopeFilter }> = [];
  const stepEventFilters: Array<{ slot: number; filter: ScopeFilter }> = [];

  for (const [slotKey, slotFilters] of Object.entries(stepFilters)) {
    const slot = Number(slotKey);
    for (const filter of slotFilters.filter((filter) => isUsableFilter(filter) && filter.values.length > 0)) {
      switch (classifyStepFilter(filter.column, slot, numberOfSteps - 1)) {
        case 'entry':
          entryFilters.push(filter);
          break;
        case 'exit':
          exitFilters.push(filter);
          break;
        case 'positional':
          positionalFilters.push({ slot, filter });
          break;
        case 'stepEvent':
          stepEventFilters.push({ slot, filter });
          break;
        case 'infeasible':
          break;
      }
    }
  }

  const filters = BAQuery.getFilterQuery(queryFilters);

  const entryPredicates = entryFilters.map((filter, index) => BAQuery.buildEntryPredicate(filter, index));
  const hasEntry = entryPredicates.length > 0;
  const entryHaving = hasEntry ? safeSql` HAVING ${SQL.AND(entryPredicates)}` : safeSql``;

  const hasExit = exitFilters.length > 0;
  const wantExitColumns = hasExit || carry.exit === true;
  const exitOrderedColumns = wantExitColumns ? safeSql`, max(timestamp) AS last_pageview_ts` : safeSql``;
  const exitSessionColumns = wantExitColumns
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

  const exitCarry = safeSql`${hasExit ? safeSql`, last_matching_click` : safeSql``}${wantExitColumns ? safeSql`, last_pageview_ts` : safeSql``}`;

  const entrySuggestColumn = carry.entryColumn
    ? safeSql`, argMin(${filterColumnSql(carry.entryColumn)}, timestamp) AS entry_value`
    : safeSql``;
  const entryCarry = carry.entryColumn ? safeSql`, entry_value` : safeSql``;

  const stepEventGroups: Array<{ alias: string; column: number; negate: boolean; predicate: SQLTaggedExpression }> = [];
  {
    let paramIndex = 0;
    const bySlot = new Map<number, { positives: ScopeFilter[]; negatives: ScopeFilter[] }>();
    for (const { slot, filter } of stepEventFilters) {
      const entry = bySlot.get(slot) ?? { positives: [], negatives: [] };
      (filter.operator === '!=' ? entry.negatives : entry.positives).push(filter);
      bySlot.set(slot, entry);
    }
    for (const [slot, { positives, negatives }] of [...bySlot.entries()].sort(([a], [b]) => a - b)) {
      if (positives.length > 0) {
        const predicate = SQL.AND(
          positives.map((filter) => BAQuery.buildStepEventRowPredicate(filter, paramIndex++)),
        );
        stepEventGroups.push({ alias: `stepevt_ts_${stepEventGroups.length}`, column: slot + 1, negate: false, predicate });
      }
      for (const filter of negatives) {
        stepEventGroups.push({
          alias: `stepevt_ts_${stepEventGroups.length}`,
          column: slot + 1,
          negate: true,
          predicate: BAQuery.buildStepEventRowPredicate(filter, paramIndex++),
        });
      }
    }
  }
  const hasStepEvents = stepEventGroups.length > 0;
  const stepEventRowFilter = hasStepEvents
    ? safeSql` AND (${SQL.OR(stepEventGroups.map((group) => group.predicate))})`
    : safeSql``;

  const stepEventColumns = stepEventGroups.reduce(
    (acc, group) => safeSql`${acc}, groupArrayIf(timestamp, ${group.predicate}) AS ${SQL.Unsafe(group.alias)}`,
    safeSql``,
  );
  const stepEventCte = hasStepEvents
    ? safeSql`,
    step_events AS (
      SELECT session_id${stepEventColumns}
      FROM analytics.events ${sample}
      WHERE
        site_id = {site_id:String}
        AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
        AND event_type = 'custom'${stepEventRowFilter}
      GROUP BY session_id
    )`
    : safeSql``;
  const stepEventJoin = hasStepEvents ? safeSql` ANY LEFT JOIN step_events USING (session_id)` : safeSql``;
  const wantFullTs = hasStepEvents || carry.fullTs === true;
  const fullTsColumn = wantFullTs
    ? safeSql`,
        arrayMap(
          x -> x.1,
          arrayFilter(
            (x, idx) -> idx = 1 OR x.2 != sorted_tuples[idx - 1].2,
            sorted_tuples,
            arrayEnumerate(sorted_tuples)
          )
        ) AS full_ts`
    : safeSql``;
  const stepEventCarry = stepEventGroups.reduce((acc, group) => safeSql`${acc}, ${SQL.Unsafe(group.alias)}`, safeSql``);

  const gates = new Map<number, SQLTaggedExpression[]>();
  const addGate = (column: number, expr: SQLTaggedExpression) => {
    if (!Number.isInteger(column) || column < 1 || column > 32) {
      throw new Error(`Invalid journey gate column: ${column}`);
    }
    gates.set(column, [...(gates.get(column) ?? []), expr]);
  };
  positionalFilters.forEach(({ slot, filter }, index) =>
    addGate(slot + 1, BAQuery.buildPositionalUrlPredicate(filter, slot, index)),
  );
  if (hasExit) {
    addGate(numberOfSteps, safeSql`full_path_length = {max_length:UInt8} AND last_matching_click > last_pageview_ts`);
  }
  for (const group of stepEventGroups) {
    const c = SQL.Unsafe(String(group.column));
    const next = SQL.Unsafe(String(group.column + 1));
    const lower = group.column === 1 ? safeSql`` : safeSql`t >= full_ts[${c}] AND `;
    const membership = safeSql`arrayExists(t -> ${lower}(${c} = length(full_ts) OR t < full_ts[${next}]), ${SQL.Unsafe(group.alias)})`;
    addGate(group.column, group.negate ? safeSql`NOT ${membership}` : membership);
  }

  const gateColumns = [...gates.keys()].sort((a, b) => a - b);
  const gateExprs = gateColumns.map((column) =>
    safeSql`(length(path) >= ${SQL.Unsafe(String(column))} AND (${SQL.AND(gates.get(column)!)}))`,
  );

  const sessionIdColumn = carry.sessionId
    ? safeSql`session_id,
        `
    : safeSql``;

  const prefix = safeSql`
    WITH ordered_events AS (
      SELECT
        session_id,
        arraySort(x -> x.1, groupArray((timestamp, url))) AS sorted_tuples,
        any(_sample_factor) as _sample_factor${exitOrderedColumns}${entrySuggestColumn}
      FROM analytics.events ${sample}
      WHERE
        site_id = {site_id:String}
        AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
        AND url != ''
        AND event_type = 'pageview'
        AND ${SQL.AND(filters)}
      GROUP BY session_id${entryHaving}
    )${exitCte}${stepEventCte},
    session_paths AS (
      SELECT
        ${sessionIdColumn}/* Collapse consecutive duplicate URLs per session, keep order, then trim to max_length */
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
        ) AS path${fullTsColumn},
        _sample_factor${exitSessionColumns}${exitCarry}${stepEventCarry}${entryCarry}
      FROM ordered_events${exitJoin}${stepEventJoin}
    )`;

  return { prefix, gateExprs };
}

export function buildJourneyQuery(args: JourneyQueryArgs) {
  const { prefix, gateExprs } = buildJourneyPipeline(args);
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

export type JourneySuggestionArgs = {
  queryFilters: QueryFilter[];
  stepFilters: Record<string, ScopeFilter[]>;
  numberOfSteps: number;
  sample: SQLTaggedExpression;
  column: FilterColumn;
  slot: number;
  search?: string;
};

export function buildJourneySuggestionQuery(args: JourneySuggestionArgs) {
  const { queryFilters, numberOfSteps, sample, column, slot, search } = args;
  const lastSlot = numberOfSteps - 1;
  if (!Number.isInteger(slot) || slot < 0 || slot > lastSlot) {
    throw new Error(`Invalid suggestion slot: ${slot}`);
  }
  const kind = classifyStepFilter(column, slot, lastSlot);
  if (kind === 'infeasible') {
    throw new Error(`Column is not suggestible at this step: ${column}`);
  }
  const scoped = stripInfeasibleStepFilters(pruneStepFilters(args.stepFilters, slot - 1), lastSlot);
  const parsed = parseFilterColumn(column);
  const carry: JourneyCarry = {};
  if (kind === 'entry') {
    if (parsed.kind !== 'standard') {
      throw new Error(`Entry suggestions require a standard column: ${column}`);
    }
    carry.entryColumn = parsed.col;
  }
  if (kind === 'exit') {
    carry.exit = true;
    carry.sessionId = true;
  }
  if (kind === 'stepEvent') {
    carry.fullTs = true;
    carry.sessionId = true;
  }

  const { prefix, gateExprs } = buildJourneyPipeline({
    queryFilters,
    stepFilters: scoped,
    numberOfSteps,
    sample,
    carry,
  });
  const gateWhere = gateExprs.reduce((acc, gate) => safeSql`${acc} AND ${gate}`, safeSql``);
  const searchClause = search?.trim()
    ? safeSql` AND value ILIKE ${SQL.String({ suggest_search: `%${search.trim()}%` })}`
    : safeSql``;
  const c = SQL.Unsafe(String(slot + 1));

  if (kind === 'positional') {
    return safeSql`${prefix}
    SELECT DISTINCT path[${c}] AS value
    FROM session_paths
    WHERE length(path) > 1 AND length(path) >= ${c}${gateWhere} AND value != ''${searchClause}
    LIMIT {limit:UInt32}
  `;
  }

  if (kind === 'entry') {
    return safeSql`${prefix}
    SELECT DISTINCT entry_value AS value
    FROM session_paths
    WHERE length(path) > 1${gateWhere} AND value != ''${searchClause}
    LIMIT {limit:UInt32}
  `;
  }

  if (kind === 'exit') {
    return safeSql`${prefix},
    exit_candidates AS (
      SELECT session_id, timestamp AS click_ts, ${filterColumnSql('outbound_link_url')} AS exit_value
      FROM analytics.events ${sample}
      WHERE
        site_id = {site_id:String}
        AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
        AND event_type = 'outbound_link'
    )
    SELECT DISTINCT exit_value AS value
    FROM session_paths INNER JOIN exit_candidates USING (session_id)
    WHERE length(path) > 1 AND full_path_length = {max_length:UInt8} AND click_ts > last_pageview_ts${gateWhere} AND value != ''${searchClause}
    LIMIT {limit:UInt32}
  `;
  }

  const valueExpr =
    parsed.kind === 'property'
      ? PROPERTY_SQL.cep.sql.extractValue(SQL.String({ suggest_cep_key: parsed.key }))
      : filterColumnSql('custom_event_name');
  const next = SQL.Unsafe(String(slot + 2));
  const lower = slot === 0 ? safeSql`` : safeSql`evt_ts >= full_ts[${c}] AND `;
  return safeSql`${prefix},
    event_candidates AS (
      SELECT session_id, timestamp AS evt_ts, ${valueExpr} AS evt_value
      FROM analytics.events ${sample}
      WHERE
        site_id = {site_id:String}
        AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
        AND event_type = 'custom'
    )
    SELECT DISTINCT evt_value AS value
    FROM session_paths INNER JOIN event_candidates USING (session_id)
    WHERE length(path) > 1 AND length(path) >= ${c} AND ${lower}(${c} = length(full_ts) OR evt_ts < full_ts[${next}])${gateWhere} AND value != ''${searchClause}
    LIMIT {limit:UInt32}
  `;
}

export async function getJourneyStepFilterValues(
  siteQuery: BASiteQuery,
  input: { column: FilterColumn; slot: number; stepFilters: Record<string, ScopeFilter[]>; search?: string; limit: number },
): Promise<string[]> {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;
  const { sample } = await BAQuery.getSampling(siteId, startDateTime, endDateTime);

  const query = buildJourneySuggestionQuery({
    queryFilters,
    stepFilters: input.stepFilters,
    numberOfSteps: siteQuery.userJourney.numberOfSteps,
    sample,
    column: input.column,
    slot: input.slot,
    search: input.search,
  });

  const rows = (await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        start: startDateTime,
        end: endDateTime,
        max_length: siteQuery.userJourney.numberOfSteps,
        limit: input.limit,
      },
    })
    .toPromise()) as Array<{ value: string }>;

  return rows.map((row) => row.value);
}

export type JourneyPropertyKeysArgs = {
  queryFilters: QueryFilter[];
  stepFilters: Record<string, ScopeFilter[]>;
  numberOfSteps: number;
  sample: SQLTaggedExpression;
  slot: number;
  search?: string;
};

export function buildJourneyPropertyKeysQuery(args: JourneyPropertyKeysArgs) {
  const { queryFilters, numberOfSteps, sample, slot, search } = args;
  const lastSlot = numberOfSteps - 1;
  if (!Number.isInteger(slot) || slot < 0 || slot > lastSlot) {
    throw new Error(`Invalid suggestion slot: ${slot}`);
  }
  const scoped = stripInfeasibleStepFilters(pruneStepFilters(args.stepFilters, slot - 1), lastSlot);
  const { prefix, gateExprs } = buildJourneyPipeline({
    queryFilters,
    stepFilters: scoped,
    numberOfSteps,
    sample,
    carry: { fullTs: true, sessionId: true },
  });
  const gateWhere = gateExprs.reduce((acc, gate) => safeSql`${acc} AND ${gate}`, safeSql``);
  const searchClause = search?.trim()
    ? safeSql`HAVING key ILIKE ${SQL.String({ suggest_search: `%${search.trim()}%` })}`
    : safeSql``;
  const c = SQL.Unsafe(String(slot + 1));
  const next = SQL.Unsafe(String(slot + 2));
  const lower = slot === 0 ? safeSql`` : safeSql`evt_ts >= full_ts[${c}] AND `;
  return safeSql`${prefix},
    event_candidates AS (
      SELECT session_id, timestamp AS evt_ts, custom_event_json
      FROM analytics.events ${sample}
      WHERE
        site_id = {site_id:String}
        AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
        AND event_type = 'custom'
        AND custom_event_json != '{}'
    )
    SELECT arrayJoin(JSONExtractKeys(custom_event_json)) AS key
    FROM session_paths INNER JOIN event_candidates USING (session_id)
    WHERE length(path) > 1 AND length(path) >= ${c} AND ${lower}(${c} = length(full_ts) OR evt_ts < full_ts[${next}])${gateWhere}
    GROUP BY key
    ${searchClause}
    ORDER BY key
    LIMIT {limit:UInt32}
  `;
}

export async function getJourneyStepPropertyKeys(
  siteQuery: BASiteQuery,
  input: { slot: number; stepFilters: Record<string, ScopeFilter[]>; search?: string; limit: number },
): Promise<string[]> {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;
  const { sample } = await BAQuery.getSampling(siteId, startDateTime, endDateTime);

  const query = buildJourneyPropertyKeysQuery({
    queryFilters,
    stepFilters: input.stepFilters,
    numberOfSteps: siteQuery.userJourney.numberOfSteps,
    sample,
    slot: input.slot,
    search: input.search,
  });

  const rows = (await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        start: startDateTime,
        end: endDateTime,
        max_length: siteQuery.userJourney.numberOfSteps,
        limit: input.limit,
      },
    })
    .toPromise()) as Array<{ key: string }>;

  return rows.map((row) => row.key);
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
