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

  it('keeps plain values on the IN path', () => {
    const sql = buildGeoSql([makeFilter('country_code', '=', ['DK'])]);

    expect(sql).toContain('country_code IN');
  });

  it('keeps partial wildcard patterns on the ILIKE path', () => {
    const sql = buildGeoSql([makeFilter('city', '=', ['Copen*'])]);

    expect(sql).toMatch(/arrayExists\(pattern -> city ILIKE pattern/);
  });

  it('does not special-case a wildcard mixed with other values', () => {
    const sql = buildGeoSql([makeFilter('city', '!=', ['Copenhagen', '*'])]);

    expect(sql).toMatch(/arrayAll\(pattern -> city NOT ILIKE pattern/);
  });

  it('treats a lone literal % the same as *, matching the transforming builders', () => {
    const sql = buildGeoSql([makeFilter('city', '=', ['%'])]);

    expect(sql).toBe(`city != ''`);
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
