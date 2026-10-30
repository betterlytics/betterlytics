import { describe, it, expect } from 'vitest';
import { BAHourlyQuery } from './ba-hourly-query';
import { BASessionQuery } from './ba-session-query';
import type { QueryFilter } from '@/entities/analytics/filter.entities';

function makeFilter(
  column: QueryFilter['column'],
  operator: QueryFilter['operator'],
  values: string[],
  id = 'filter-1',
): QueryFilter {
  return { id, column, operator, values };
}

function buildGeoSql(filters: QueryFilter[]) {
  return BAHourlyQuery.getGeoHourlyFilters(filters)
    .map((part) => part.taggedSql)
    .join(' AND ');
}

describe('hourly MV filters bare wildcard semantics', () => {
  it('treats = * as "value present"', () => {
    const sql = buildGeoSql([makeFilter('city', '=', ['*'])]);

    expect(sql).toBe(`city != ''`);
  });

  it('treats != * as "value absent"', () => {
    const sql = buildGeoSql([makeFilter('city', '!=', ['*'])]);

    expect(sql).toBe(`city = ''`);
  });

  it('routes plain values through the ILIKE path', () => {
    const sql = buildGeoSql([makeFilter('country_code', '=', ['DK'])]);

    expect(sql).toMatch(/arrayExists\(pattern -> country_code ILIKE pattern/);
  });

  it('keeps partial wildcard patterns on the ILIKE path', () => {
    const sql = buildGeoSql([makeFilter('city', '=', ['Copen*'])]);

    expect(sql).toMatch(/arrayExists\(pattern -> city ILIKE pattern/);
  });

  it('does not special-case a wildcard mixed with other values', () => {
    const sql = buildGeoSql([makeFilter('city', '!=', ['Copenhagen', '*'])]);

    expect(sql).toMatch(/arrayAll\(pattern -> city NOT ILIKE pattern/);
  });

  it.each([
    ['=', /arrayExists\(pattern -> city ILIKE pattern/],
    ['!=', /arrayAll\(pattern -> city NOT ILIKE pattern/],
  ] as const)('treats a lone percent sign as a literal for %s', (operator, expected) => {
    const [part] = BAHourlyQuery.getGeoHourlyFilters([makeFilter('city', operator, ['%'])]);

    expect(part.taggedSql).toMatch(expected);
    expect(part.taggedParams).toEqual({ hourly_mv_filter_0: ['\\%'] });
  });

  it('applies wildcard semantics to overview filters too', () => {
    const sql = BAHourlyQuery.getOverviewHourlyFilters([makeFilter('browser', '!=', ['*'])])
      .map((part) => part.taggedSql)
      .join(' AND ');

    expect(sql).toBe(`browser = ''`);
  });

  it('emits the same presence predicate as the sessions slow path', () => {
    const fastSql = buildGeoSql([makeFilter('city', '=', ['*'])]);
    const slow = BASessionQuery.getSessionTableSubQuery(
      ['visitor_id'],
      [makeFilter('city', '=', ['*'])],
      'test-site',
      '2026-01-01 00:00:00',
      '2026-01-31 23:59:59',
    );

    expect(fastSql).toBe(`city != ''`);
    expect(slow.taggedSql).toContain(`city != ''`);
  });
});

describe('hourly MV filters case-insensitive matching', () => {
  it('keeps != plain values on the arrayAll NOT ILIKE path', () => {
    const sql = buildGeoSql([makeFilter('country_code', '!=', ['DK'])]);

    expect(sql).toMatch(/arrayAll\(pattern -> country_code NOT ILIKE pattern/);
  });

  it('passes plain values through untransformed so ILIKE does the case folding', () => {
    const [part] = BAHourlyQuery.getGeoHourlyFilters([makeFilter('country_code', '=', ['us'])]);

    expect(part.taggedSql).toMatch(/arrayExists\(pattern -> country_code ILIKE pattern/);
    expect(part.taggedParams).toEqual({ hourly_mv_filter_0: ['us'] });
  });

  it('still maps * to % in mixed value lists', () => {
    const [part] = BAHourlyQuery.getGeoHourlyFilters([makeFilter('city', '=', ['Copen*', 'Aarhus'])]);

    expect(part.taggedParams).toEqual({ hourly_mv_filter_0: ['Copen%', 'Aarhus'] });
  });
});

describe('hourly MV filters literal metacharacters', () => {
  it.each(['=', '!='] as const)('escapes underscore, percent and backslash for %s', (operator) => {
    const [part] = BAHourlyQuery.getGeoHourlyFilters([
      makeFilter('city', operator, ['San_Jose', '50%off', 'a\\b']),
    ]);

    expect(part.taggedParams).toEqual({ hourly_mv_filter_0: ['San\\_Jose', '50\\%off', 'a\\\\b'] });
  });

  it('escapes before mapping * so the wildcard stays live', () => {
    const [part] = BAHourlyQuery.getOverviewHourlyFilters([makeFilter('browser', '=', ['Chrome_*'])]);

    expect(part.taggedParams).toEqual({ hourly_mv_filter_0: ['Chrome\\_%'] });
  });

  it.each(['=', '!='] as const)('binds the same patterns as the sessions slow path for %s', (operator) => {
    const filters = [makeFilter('city', operator, ['San_Jose', '50%off', 'a\\b', 'Copen*'])];
    const [fast] = BAHourlyQuery.getGeoHourlyFilters(filters);
    const slow = BASessionQuery.getSessionTableSubQuery(
      ['visitor_id'],
      filters,
      'test-site',
      '2026-01-01 00:00:00',
      '2026-01-31 23:59:59',
    );

    expect(Object.values(slow.taggedParams)).toContainEqual(fast.taggedParams.hourly_mv_filter_0);
  });
});
