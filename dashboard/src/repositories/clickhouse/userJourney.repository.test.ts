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

import { buildJourneyQuery } from './userJourney.repository';
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

describe('event-level step filters', () => {
  it('stays a session flag and gates the journey in the WHERE', () => {
    const query = build({ '2': [filter('device_type', ['Mobile'])] });
    const orderedEvents = query.taggedSql.slice(0, query.taggedSql.indexOf('session_paths'));
    expect(orderedEvents).toContain('max(');
    expect(orderedEvents).toContain('AS evt_ok_0');
    expect(orderedEvents).not.toMatch(/WHERE[\s\S]*device_type[\s\S]*GROUP BY session_id/);
    expect(query.taggedSql).toContain('WHERE length(path) > 1 AND (length(path) >= 3 AND (evt_ok_0 = 1))');
    expect(query.taggedSql).not.toContain('AS surv_');
    expect(query.taggedSql).not.toContain('arraySlice(path, 1,');
    const sessionPaths = query.taggedSql.slice(
      query.taggedSql.indexOf('session_paths'),
      query.taggedSql.indexOf('filtered_paths'),
    );
    expect(sessionPaths).toContain('evt_ok_0');
  });

  it('keeps event params out of the global namespace', () => {
    const query = build({ '2': [filter('device_type', ['Mobile'])] }, [filter('url', ['https://x.io/*'])]);
    expect(Object.keys(query.taggedParams)).toContain('evt_filter_0');
    expect(Object.keys(query.taggedParams)).toContain('query_filter_0');
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
