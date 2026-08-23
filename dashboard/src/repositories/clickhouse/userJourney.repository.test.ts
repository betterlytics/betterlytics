import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/env', () => ({
  env: {
    SAMPLING_TRAFFIC_THRESHOLD: 100_000,
    SAMPLING_FACTOR: 0.25,
    HIGH_TRAFFIC_CONCURRENCY_LIMIT: 20,
  },
}));
vi.mock('@/repositories/clickhouse/usage.repository', () => ({
  isHighTrafficSite: vi.fn().mockResolvedValue(false),
}));
vi.mock('@/observability/clickhouse-concurrency', () => ({
  setSiteConcurrencyLimit: vi.fn(),
}));
vi.mock('@/lib/clickhouse', () => ({ clickhouse: {} }));

import { buildJourneyPropertyKeysQuery, buildJourneyQuery, buildJourneySuggestionQuery } from './userJourney.repository';
import { safeSql } from '@/lib/safe-sql';
import type { QueryFilter } from '@/entities/analytics/filter.entities';

const sample = safeSql`SAMPLE 1`;

const filter = (column: QueryFilter['column'], values: string[], operator: '=' | '!=' = '='): QueryFilter => ({
  id: 'f1',
  column,
  operator,
  values,
});

const build = (stepFilters: Record<string, QueryFilter[]>, queryFilters: QueryFilter[] = []) =>
  buildJourneyQuery({ queryFilters, stepFilters, numberOfSteps: 3, sample });

describe('buildJourneyQuery without step filters', () => {
  it('emits none of the step filter constructs', () => {
    const query = build({});
    expect(query.taggedSql).not.toContain('HAVING');
    expect(query.taggedSql).not.toContain('exit_clicks');
    expect(query.taggedSql).not.toContain('full_path_length');
    expect(query.taggedSql).not.toContain('last_pageview_ts');
    expect(query.taggedSql).not.toContain('path[1] ');
    expect(query.taggedSql).not.toContain('AS surv_');
    expect(query.taggedSql).not.toContain('evt_ok_');
    expect(query.taggedSql).not.toContain('entry_ok');
    expect(query.taggedSql).not.toContain('survivors');
    expect(query.taggedSql).not.toContain('full_ts');
  });

  it('matches the golden production query', () => {
    expect(build({}).taggedSql).toMatchInlineSnapshot(`
      "
          WITH ordered_events AS (
            SELECT
              session_id,
              arraySort(x -> x.1, groupArray((timestamp, url))) AS sorted_tuples,
              any(_sample_factor) as _sample_factor
            FROM analytics.events SAMPLE 1
            WHERE
              site_id = {site_id:String}
              AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
              AND url != ''
              AND event_type = 'pageview'
              AND 1=1
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
              ) AS path,
              _sample_factor
            FROM ordered_events
          ),
          filtered_paths AS (
            SELECT path, _sample_factor
            FROM session_paths
            WHERE length(path) > 1
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
        "
    `);
  });
});

describe('infeasible step filters', () => {
  it('drops session-constant columns as infeasible', () => {
    const query = build({ '2': [filter('device_type', ['Mobile'])] });
    expect(query.taggedSql).not.toContain('device_type');
  });
});

describe('entry step filters', () => {
  it('adds a HAVING with argMin on ordered_events for slot 0', () => {
    const query = build({ '0': [filter('utm_source', ['newsletter'])] });
    expect(query.taggedSql).toMatch(/GROUP BY session_id HAVING .*argMin\(utm_source, timestamp\)/);
    expect(query.taggedSql).not.toContain('entry_ok');
  });

  it('drops entry columns at non-zero slots as infeasible', () => {
    const query = build({ '1': [filter('utm_source', ['newsletter'])] });
    expect(query.taggedSql).not.toContain('argMin');
    expect(query.taggedSql).not.toContain('utm_source');
  });
});

describe('positional url step filters', () => {
  it('removes non-matching journeys instead of truncating', () => {
    const query = build({ '1': [filter('url', ['/signup'])] });
    expect(query.taggedSql).toContain('WHERE length(path) > 1 AND (length(path) >= 2 AND (');
    expect(query.taggedSql).toContain('path[2]');
    expect(query.taggedSql).not.toContain('AS surv_');
    expect(query.taggedSql).not.toContain('arraySlice(path, 1,');
  });

  it('chains multiple filtered columns ascending inside one WHERE', () => {
    const query = build({ '1': [filter('url', ['/a'])], '2': [filter('url', ['/b'])] });
    const first = query.taggedSql.indexOf('length(path) >= 2');
    const second = query.taggedSql.indexOf('length(path) >= 3');
    expect(first).toBeGreaterThan(-1);
    expect(second).toBeGreaterThan(first);
    expect((query.taggedSql.match(/WHERE length\(path\) > 1 AND/g) ?? []).length).toBe(1);
  });

  it('AND-combines multiple filters at one slot inside a single gate', () => {
    const query = build({ '1': [filter('url', ['/share/*']), filter('url', ['/share/private'], '!=')] });
    expect(query.taggedSql).toContain('arrayExists(pattern -> path[2] ILIKE pattern');
    expect(query.taggedSql).toContain('arrayAll(pattern -> path[2] NOT ILIKE pattern');
    expect((query.taggedSql.match(/length\(path\) >= 2/g) ?? []).length).toBe(1);
  });

  it('skips filters without values', () => {
    const query = build({ '1': [filter('url', [])] });
    expect(query.taggedSql).not.toContain('length(path) >=');
  });
});

describe('exit step filters', () => {
  it('left-joins the exit CTE and removes non-exiting journeys in the WHERE', () => {
    const query = build({ '2': [filter('outbound_link_url', ['https://example.com/*'])] });
    expect(query.taggedSql).toContain('exit_clicks AS (');
    expect(query.taggedSql).toContain(`event_type = 'outbound_link'`);
    expect(query.taggedSql).toContain('FROM ordered_events ANY LEFT JOIN exit_clicks USING (session_id)');
    expect(query.taggedSql).toContain(
      'WHERE length(path) > 1 AND (length(path) >= 3 AND (full_path_length = {max_length:UInt8} AND last_matching_click > last_pageview_ts))',
    );
    expect(query.taggedSql).not.toContain('ANY INNER JOIN');
    expect(query.taggedSql).not.toContain('AS surv_');
    const sessionPaths = query.taggedSql.slice(
      query.taggedSql.indexOf('session_paths'),
      query.taggedSql.indexOf('filtered_paths'),
    );
    expect(sessionPaths).toContain('last_matching_click');
  });

  it('does not apply global query filters inside exit_clicks', () => {
    const query = build({ '2': [filter('outbound_link_url', ['https://x.com'])] }, [filter('url', ['/pricing'])]);
    const exitCte = query.taggedSql.slice(
      query.taggedSql.indexOf('exit_clicks AS ('),
      query.taggedSql.indexOf('session_paths'),
    );
    expect(exitCte).not.toContain('query_filter_0');
  });

  it('drops outbound filters at non-last slots as infeasible', () => {
    const query = build({ '1': [filter('outbound_link_url', ['https://x.com'])] });
    expect(query.taggedSql).not.toContain('exit_clicks');
  });
});

describe('window-anchored step event filters', () => {
  it('collects matching event timestamps in a step_events CTE and gates the window', () => {
    const query = build({ '1': [filter('custom_event_name', ['signup'])] });
    expect(query.taggedSql).toContain('step_events AS (');
    expect(query.taggedSql).toContain(`event_type = 'custom'`);
    expect(query.taggedSql).toContain('groupArrayIf(timestamp');
    expect(query.taggedSql).toContain('AS full_ts');
    expect(query.taggedSql).toContain('ANY LEFT JOIN step_events USING (session_id)');
    expect(query.taggedSql).toContain(
      '(length(path) >= 2 AND (arrayExists(t -> t >= full_ts[2] AND (2 = length(full_ts) OR t < full_ts[3]), stepevt_ts_0)))',
    );
    expect(Object.keys(query.taggedParams)).toContain('stepevt_filter_0');
  });

  it('omits the lower bound for slot 0 windows', () => {
    const query = build({ '0': [filter('custom_event_name', ['signup'])] });
    expect(query.taggedSql).toContain('arrayExists(t -> (1 = length(full_ts) OR t < full_ts[2]), stepevt_ts_0)');
    expect(query.taggedSql).not.toContain('t >= full_ts[1]');
  });

  it('negates window existence for != while keeping the reach conjunct', () => {
    const query = build({ '1': [filter('custom_event_name', ['signup'], '!=')] });
    expect(query.taggedSql).toContain('(length(path) >= 2 AND (NOT arrayExists(');
  });

  it('combines same-slot = filters into one same-event predicate group', () => {
    const query = build({ '1': [filter('custom_event_name', ['signup']), filter('cep.plan', ['pro'])] });
    const groupArrayIfCount = (query.taggedSql.match(/groupArrayIf\(timestamp/g) ?? []).length;
    expect(groupArrayIfCount).toBe(1);
    expect(query.taggedSql).toContain('JSONExtractString');
  });

  it('gives each != filter its own absence array', () => {
    const query = build({
      '1': [filter('custom_event_name', ['signup']), filter('custom_event_name', ['cancel'], '!=')],
    });
    const groupArrayIfCount = (query.taggedSql.match(/groupArrayIf\(timestamp/g) ?? []).length;
    expect(groupArrayIfCount).toBe(2);
  });

  it('emits none of the step event constructs without step event filters', () => {
    const query = build({ '1': [filter('url', ['/a'])] });
    expect(query.taggedSql).not.toContain('step_events');
    expect(query.taggedSql).not.toContain('full_ts');
    expect(query.taggedSql).not.toContain('stepevt_');
  });

  it('does not apply global query filters inside step_events', () => {
    const query = build({ '1': [filter('custom_event_name', ['signup'])] }, [filter('device_type', ['Mobile'])]);
    const cte = query.taggedSql.slice(query.taggedSql.indexOf('step_events AS ('), query.taggedSql.indexOf('session_paths'));
    expect(cte).not.toContain('query_filter_0');
  });

  it('keeps params and aliases distinct across step-event slots', () => {
    const query = build({
      '0': [filter('custom_event_name', ['signup'])],
      '1': [filter('custom_event_name', ['purchase'])],
    });
    expect(Object.keys(query.taggedParams)).toContain('stepevt_filter_0');
    expect(Object.keys(query.taggedParams)).toContain('stepevt_filter_1');
    expect(query.taggedSql).toContain('stepevt_ts_0');
    expect(query.taggedSql).toContain('stepevt_ts_1');
  });
});

const suggest = (
  column: QueryFilter['column'],
  slot: number,
  stepFilters: Record<string, QueryFilter[]> = {},
  extras: { search?: string; numberOfSteps?: number } = {},
) =>
  buildJourneySuggestionQuery({
    queryFilters: [],
    stepFilters,
    numberOfSteps: extras.numberOfSteps ?? 3,
    sample,
    column,
    slot,
    search: extras.search,
  });

describe('journey suggestion queries', () => {
  it('keeps the chart query untouched by suggestion machinery', () => {
    const query = build({});
    expect(query.taggedSql).not.toContain('entry_value');
    expect(query.taggedSql).not.toContain('exit_candidates');
    expect(query.taggedSql).not.toContain('event_candidates');
  });

  it('strips infeasible filters from the wire map server-side', () => {
    const query = suggest('url', 1, { '0': [filter('device_type', ['Mobile'])] });
    expect(Object.keys(query.taggedParams).some((key) => key.startsWith('pos_filter_'))).toBe(false);
    expect(Object.keys(query.taggedParams).some((key) => key.startsWith('query_filter_'))).toBe(false);
    expect(query.taggedSql).not.toContain('device_type');
  });

  it('selects distinct positional urls with reach at the suggested column', () => {
    const query = suggest('url', 2);
    expect(query.taggedSql).toContain('SELECT DISTINCT path[3] AS value');
    expect(query.taggedSql).toContain('length(path) >= 3');
    expect(query.taggedSql).toContain('LIMIT {limit:UInt32}');
    expect(query.taggedSql.match(/session_id,/g)).toHaveLength(1);
  });

  it('scopes by earlier-step gates and drops forward slots', () => {
    const query = suggest('url', 1, {
      '0': [filter('url', ['/home'])],
      '2': [filter('url', ['/pricing'])],
    });
    expect(query.taggedSql).toContain('SELECT DISTINCT path[2] AS value');
    expect(query.taggedSql).not.toContain('path[3]');
    expect(Object.keys(query.taggedParams).filter((key) => key.startsWith('pos_filter_'))).toHaveLength(1);
  });

  it('drops same-slot entries from the wire map', () => {
    const query = suggest('url', 1, { '1': [filter('url', ['/docs*'])] });
    expect(Object.keys(query.taggedParams).some((key) => key.startsWith('pos_filter_'))).toBe(false);
  });

  it('carries the entry value through session_paths for entry suggestions', () => {
    const query = suggest('referrer_source', 0);
    expect(query.taggedSql).toContain('argMin(referrer_source_effective, timestamp) AS entry_value');
    expect(query.taggedSql).toContain('SELECT DISTINCT entry_value AS value');
    expect(query.taggedSql.match(/session_id,/g)).toHaveLength(1);
  });

  it('drops same-slot entry filters', () => {
    const query = suggest('referrer_source_name', 0, { '0': [filter('referrer_source', ['google.com'])] });
    expect(query.taggedSql).not.toContain('HAVING');
    expect(Object.keys(query.taggedParams).some((key) => key.startsWith('entry_filter_'))).toBe(false);
  });

  it('lists exit candidates unfiltered by exit values', () => {
    const query = suggest('outbound_link_url', 2);
    expect(query.taggedSql).toContain('exit_candidates');
    expect(query.taggedSql).toContain('full_path_length = {max_length:UInt8}');
    expect(query.taggedSql).toContain('click_ts > last_pageview_ts');
    expect(query.taggedSql).not.toContain('exit_clicks');
    expect(Object.keys(query.taggedParams).some((key) => key.startsWith('exit_filter_'))).toBe(false);
    expect(query.taggedSql.match(/session_id,/g)).toHaveLength(3);
  });

  it('drops same-slot exit filters', () => {
    const query = suggest('outbound_link_url', 2, { '2': [filter('outbound_link_url', ['https://github.com/*'])] });
    expect(query.taggedSql).not.toContain('exit_clicks');
    expect(query.taggedSql).toContain('exit_candidates');
    expect(Object.keys(query.taggedParams).some((key) => key.startsWith('exit_filter_'))).toBe(false);
  });

  it('windows event-name suggestions to the step and joins candidates', () => {
    const query = suggest('custom_event_name', 1);
    expect(query.taggedSql).toContain('event_candidates');
    expect(query.taggedSql).toContain('evt_ts >= full_ts[2] AND (2 = length(full_ts) OR evt_ts < full_ts[3])');
    expect(query.taggedSql).toContain('SELECT DISTINCT evt_value AS value');
    expect(query.taggedSql.match(/session_id,/g)).toHaveLength(3);
  });

  it('omits the lower window bound at slot 0', () => {
    const query = suggest('custom_event_name', 0);
    expect(query.taggedSql).toContain('(1 = length(full_ts) OR evt_ts < full_ts[2])');
    expect(query.taggedSql).not.toContain('evt_ts >= full_ts[1]');
  });

  it('extracts cep values from all window events without same-slot restriction', () => {
    const query = suggest('cep.plan', 1, { '1': [filter('custom_event_name', ['signup'])] });
    expect(query.taggedSql).toContain('JSONExtractString(custom_event_json');
    expect(query.taggedParams).toHaveProperty('suggest_cep_key', 'plan');
    expect(Object.keys(query.taggedParams).some((key) => key.startsWith('stepevt_filter_'))).toBe(false);
  });

  it('gates event suggestions by earlier-step event filters', () => {
    const query = suggest('custom_event_name', 1, { '0': [filter('custom_event_name', ['signup'])] });
    expect(query.taggedParams).toHaveProperty('stepevt_filter_0');
    expect(query.taggedSql).toContain('(1 = length(full_ts) OR t < full_ts[2])');
    expect(query.taggedSql).toContain('evt_ts >= full_ts[2] AND (2 = length(full_ts) OR evt_ts < full_ts[3])');
  });

  it('rejects infeasible suggestion columns', () => {
    expect(() => suggest('device_type', 1)).toThrow(/not suggestible/);
    expect(() => suggest('referrer_source', 1)).toThrow(/not suggestible/);
    expect(() => suggest('outbound_link_url', 0)).toThrow(/not suggestible/);
    expect(() => suggest('url', 5)).toThrow(/Invalid suggestion slot/);
  });

  it('applies the search term to the value expression', () => {
    const query = suggest('url', 1, {}, { search: 'doc' });
    expect(query.taggedSql).toContain('value ILIKE {suggest_search:String}');
    expect(query.taggedParams).toHaveProperty('suggest_search', '%doc%');
  });

  const suggestKeys = (slot: number, stepFilters: Record<string, QueryFilter[]> = {}, search?: string) =>
    buildJourneyPropertyKeysQuery({ queryFilters: [], stepFilters, numberOfSteps: 3, sample, slot, search });

  describe('journey property key queries', () => {
    it('lists keys of custom events inside the step window', () => {
      const query = suggestKeys(1);
      expect(query.taggedSql).toContain("custom_event_json != '{}'");
      expect(query.taggedSql).toContain('arrayJoin(JSONExtractKeys(custom_event_json)) AS key');
      expect(query.taggedSql).toContain('evt_ts >= full_ts[2] AND (2 = length(full_ts) OR evt_ts < full_ts[3])');
      expect(query.taggedSql).toContain('GROUP BY key');
      expect(query.taggedSql).toContain('ORDER BY key');
      expect(query.taggedSql.match(/session_id,/g)).toHaveLength(3);
    });

    it('omits the lower window bound at slot 0', () => {
      const query = suggestKeys(0);
      expect(query.taggedSql).toContain('(1 = length(full_ts) OR evt_ts < full_ts[2])');
      expect(query.taggedSql).not.toContain('evt_ts >= full_ts[1]');
    });

    it('gates keys by applied earlier-step filters and drops same-slot and forward entries', () => {
      const query = suggestKeys(1, {
        '0': [filter('url', ['/home'])],
        '1': [filter('custom_event_name', ['signup'])],
        '2': [filter('url', ['/pricing'])],
      });
      expect(Object.keys(query.taggedParams).filter((key) => key.startsWith('pos_filter_'))).toHaveLength(1);
      expect(Object.keys(query.taggedParams).some((key) => key.startsWith('stepevt_filter_'))).toBe(false);
    });

    it('searches keys via HAVING', () => {
      const query = suggestKeys(1, {}, 'pla');
      expect(query.taggedSql).toContain('HAVING key ILIKE {suggest_search:String}');
      expect(query.taggedParams).toHaveProperty('suggest_search', '%pla%');
    });

    it('rejects out-of-bounds slots for key suggestions', () => {
      expect(() => suggestKeys(5)).toThrow(/Invalid suggestion slot/);
    });

    it('keeps the chart query untouched by key machinery', () => {
      const query = build({});
      expect(query.taggedSql).not.toContain('JSONExtractKeys');
    });
  });
});
