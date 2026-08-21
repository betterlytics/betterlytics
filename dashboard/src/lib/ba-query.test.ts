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

import { BAQuery } from './ba-query';
import type { QueryFilter } from '@/entities/analytics/filter.entities';

function makeFilter(
  column: QueryFilter['column'],
  operator: QueryFilter['operator'],
  values: string[],
  id = 'filter-1',
): QueryFilter {
  return { id, column, operator, values };
}

function buildSql(filters: QueryFilter[]) {
  const parts = BAQuery.getFilterQuery(filters);
  return parts.map((part) => part.taggedSql).join(' AND ');
}

describe('getFilterQuery bare wildcard semantics', () => {
  it('treats = * as "value present"', () => {
    const sql = buildSql([makeFilter('custom_event_name', '=', ['*'])]);

    expect(sql).toBe(`custom_event_name != ''`);
  });

  it('treats != * as "value absent"', () => {
    const sql = buildSql([makeFilter('utm_source', '!=', ['*'])]);

    expect(sql).toBe(`utm_source = ''`);
  });

  it('keeps the ILIKE path for event_type since Enum8 cannot compare to empty string', () => {
    const sql = buildSql([makeFilter('event_type', '=', ['*'])]);

    expect(sql).toContain('event_type ILIKE pattern');
    expect(sql).not.toContain(`event_type != ''`);
  });

  it('keeps the NOT ILIKE path for event_type != *', () => {
    const sql = buildSql([makeFilter('event_type', '!=', ['*'])]);

    expect(sql).toContain('event_type NOT ILIKE pattern');
    expect(sql).not.toContain(`event_type = ''`);
  });

  it('does not special-case a wildcard mixed with other values', () => {
    const sql = buildSql([makeFilter('custom_event_name', '=', ['signup', '*'])]);

    expect(sql).toContain('custom_event_name ILIKE pattern');
  });

  it('does not special-case partial wildcard patterns', () => {
    const sql = buildSql([makeFilter('url', '=', ['/docs/*'])]);

    expect(sql).toContain('url ILIKE pattern');
  });

  it('applies the referrer_source column override to presence checks', () => {
    const sql = buildSql([makeFilter('referrer_source', '=', ['*'])]);

    expect(sql).toBe(`referrer_source_effective != ''`);
  });
});

describe('getFilterQuery regressions', () => {
  it('keeps = as arrayExists ILIKE for plain values', () => {
    const sql = buildSql([makeFilter('custom_event_name', '=', ['signup'])]);

    expect(sql).toMatch(/arrayExists\(pattern -> custom_event_name ILIKE pattern/);
  });

  it('keeps != as arrayAll NOT ILIKE for plain values', () => {
    const sql = buildSql([makeFilter('custom_event_name', '!=', ['signup'])]);

    expect(sql).toMatch(/arrayAll\(pattern -> custom_event_name NOT ILIKE pattern/);
  });

  it('keeps gp bare wildcard as key existence', () => {
    const equals = buildSql([makeFilter('gp.plan', '=', ['*'])]);
    const notEquals = buildSql([makeFilter('gp.plan', '!=', ['*'])]);

    expect(equals).toContain('has(global_properties_keys');
    expect(notEquals).toContain('NOT has(global_properties_keys');
  });
});

describe('getFilterQuery custom event properties', () => {
  it('filters = through JSONExtractString on the blob', () => {
    const sql = buildSql([makeFilter('cep.plan', '=', ['pro'])]);

    expect(sql).toMatch(/arrayExists\(pattern -> JSONExtractString\(custom_event_json, \{cep_key_0:String\}\) ILIKE pattern/);
  });

  it('keeps != as a per-event arrayAll NOT ILIKE', () => {
    const sql = buildSql([makeFilter('cep.plan', '!=', ['pro'])]);

    expect(sql).toMatch(/arrayAll\(pattern -> JSONExtractString\(custom_event_json, \{cep_key_0:String\}\) NOT ILIKE pattern/);
  });

  it('keeps cep bare wildcard as key existence', () => {
    const equals = buildSql([makeFilter('cep.plan', '=', ['*'])]);
    const notEquals = buildSql([makeFilter('cep.plan', '!=', ['*'])]);

    expect(equals).toContain('JSONHas(custom_event_json');
    expect(notEquals).toContain('NOT JSONHas(custom_event_json');
  });
});

describe('getFilterQuery empty-values semantics', () => {
  it('compiles an empty = filter to match nothing - stored funnel filters rely on this, never drop them as unusable (#946)', () => {
    const sql = buildSql([makeFilter('url', '=', [])]);
    const [part] = BAQuery.getFilterQuery([makeFilter('url', '=', [])]);

    expect(sql).toContain('arrayExists');
    expect(part.taggedParams).toHaveProperty('query_filter_0', []);
  });

  it('compiles an empty != filter to match everything', () => {
    const sql = buildSql([makeFilter('url', '!=', [])]);

    expect(sql).toContain('arrayAll');

describe('buildPositionalUrlPredicate', () => {
  it('targets path at the 1-indexed slot with arrayExists ILIKE for =', () => {
    const sql = BAQuery.buildPositionalUrlPredicate(makeFilter('url', '=', ['/signup']), 2, 0);
    expect(sql.taggedSql).toContain('path[3]');
    expect(sql.taggedSql).toContain('arrayExists');
    expect(sql.taggedSql).toContain('ILIKE');
  });

  it('uses arrayAll NOT ILIKE for !=', () => {
    const sql = BAQuery.buildPositionalUrlPredicate(makeFilter('url', '!=', ['/login']), 0, 0);
    expect(sql.taggedSql).toContain('path[1]');
    expect(sql.taggedSql).toContain('arrayAll');
    expect(sql.taggedSql).toContain('NOT ILIKE');
  });

  it('rewrites * wildcards to % in the values param', () => {
    const sql = BAQuery.buildPositionalUrlPredicate(makeFilter('url', '=', ['/dashboard/*']), 1, 4);
    expect(sql.taggedParams).toEqual({ pos_filter_4: ['/dashboard/%'] });
  });

  it('compiles a bare wildcard to a presence check on the slot', () => {
    const sql = BAQuery.buildPositionalUrlPredicate(makeFilter('url', '=', ['*']), 2, 0);
    expect(sql.taggedSql).toBe(`path[3] != ''`);
  });

  it('throws on a non-integer or out-of-range slot', () => {
    expect(() => BAQuery.buildPositionalUrlPredicate(makeFilter('url', '=', ['/x']), 1.5, 0)).toThrow();
    expect(() => BAQuery.buildPositionalUrlPredicate(makeFilter('url', '=', ['/x']), -1, 0)).toThrow();
    expect(() => BAQuery.buildPositionalUrlPredicate(makeFilter('url', '=', ['/x']), 33, 0)).toThrow();
  });
});

describe('buildEntryPredicate', () => {
  it('wraps the column in argMin over timestamp', () => {
    const sql = BAQuery.buildEntryPredicate(makeFilter('utm_source', '=', ['newsletter']), 0);
    expect(sql.taggedSql).toContain('argMin(utm_source, timestamp)');
    expect(sql.taggedSql).toContain('arrayExists');
    expect(sql.taggedParams).toEqual({ entry_filter_0: ['newsletter'] });
  });

  it('resolves referrer_source through its SQL override', () => {
    const sql = BAQuery.buildEntryPredicate(makeFilter('referrer_source', '=', ['google']), 1);
    expect(sql.taggedSql).toContain('argMin(referrer_source_effective, timestamp)');
  });

  it('compiles a bare wildcard to a presence check on the entry value', () => {
    const sql = BAQuery.buildEntryPredicate(makeFilter('utm_source', '!=', ['*']), 0);
    expect(sql.taggedSql).toBe(`argMin(utm_source, timestamp) = ''`);
  });

  it('rejects property columns', () => {
    expect(() => BAQuery.buildEntryPredicate(makeFilter('gp.tenant', '=', ['x']), 0)).toThrow();
  });
});

describe('buildExitPredicate', () => {
  it('targets the outbound link url with namespaced params', () => {
    const sql = BAQuery.buildExitPredicate(makeFilter('outbound_link_url', '=', ['https://github.com/*']), 0);
    expect(sql.taggedSql).toContain('outbound_link_url');
    expect(sql.taggedSql).toContain('ILIKE');
    expect(sql.taggedParams).toEqual({ exit_filter_0: ['https://github.com/%'] });
  });

  it('rejects property columns', () => {
    expect(() => BAQuery.buildExitPredicate(makeFilter('gp.tenant', '=', ['x']), 0)).toThrow();
  });
});

