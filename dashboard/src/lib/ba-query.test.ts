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
