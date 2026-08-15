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
  it('lands in the ordered_events WHERE alongside global filters', () => {
    const query = build({ '2': [filter('device_type', ['Mobile'])] });
    const orderedEvents = query.taggedSql.slice(0, query.taggedSql.indexOf('session_paths'));
    expect(orderedEvents).toContain('device_type');
    expect(query.taggedSql).not.toContain('HAVING');
  });
});

describe('entry step filters', () => {
  it('adds a HAVING with argMin on ordered_events for slot 0', () => {
    const query = build({ '0': [filter('utm_source', ['newsletter'])] });
    expect(query.taggedSql).toMatch(/GROUP BY session_id HAVING .*argMin\(utm_source, timestamp\)/);
  });

  it('drops entry columns at non-zero slots as infeasible', () => {
    const query = build({ '1': [filter('utm_source', ['newsletter'])] });
    expect(query.taggedSql).not.toContain('argMin');
    expect(query.taggedSql).not.toContain('utm_source');
  });
});

describe('positional url step filters', () => {
  it('applies the predicate in filtered_paths on the sliced path', () => {
    const query = build({ '2': [filter('url', ['/signup'])] });
    expect(query.taggedSql).toMatch(/WHERE length\(path\) > 1 AND .*path\[3\]/);
  });

  it('AND-combines multiple filters at one slot', () => {
    const query = build({
      '1': [filter('url', ['/share/*']), filter('url', ['/share/private'], '!=')],
    });
    expect(query.taggedSql).toContain('arrayExists(pattern -> path[2] ILIKE pattern');
    expect(query.taggedSql).toContain('arrayAll(pattern -> path[2] NOT ILIKE pattern');
  });

  it('skips filters without values', () => {
    const query = build({ '1': [filter('url', [])] });
    expect(query.taggedSql).not.toContain('path[2]');
  });
});

describe('exit step filters', () => {
  it('builds the exit_clicks CTE, join and exact-length predicate for the last slot', () => {
    const query = build({ '3': [filter('outbound_link_url', ['https://example.com/*'])] });
    expect(query.taggedSql).toContain('exit_clicks AS (');
    expect(query.taggedSql).toContain(`event_type = 'outbound_link'`);
    expect(query.taggedSql).toContain('ANY INNER JOIN exit_clicks USING (session_id)');
    expect(query.taggedSql).toContain('full_path_length = {max_length:UInt8}');
    expect(query.taggedSql).toContain('last_matching_click > last_pageview_ts');
    expect(query.taggedSql).toContain('max(timestamp) AS last_pageview_ts');
  });

  it('does not apply global query filters inside exit_clicks', () => {
    const query = build({ '3': [filter('outbound_link_url', ['https://x.com'])] }, [
      filter('url', ['/pricing']),
    ]);
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
