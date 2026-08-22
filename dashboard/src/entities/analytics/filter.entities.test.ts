import { describe, it, expect } from 'vitest';
import {
  applyFilterUpdates,
  dependencyScopeFilters,
  withDependentColumns,
  type QueryFilter,
} from '@/entities/analytics/filter.entities';

function filter(column: QueryFilter['column'], value: string, id = `id-${column}`): QueryFilter {
  return { id, column, operator: '=', values: [value] };
}

describe('applyFilterUpdates', () => {
  it('appends updates as equals filters with generated ids', () => {
    const next = applyFilterUpdates([], [{ column: 'browser', value: 'Chrome' }]);

    expect(next).toHaveLength(1);
    expect(next[0]).toMatchObject({ column: 'browser', operator: '=', values: ['Chrome'] });
    expect(next[0].id).toBeTruthy();
  });

  it('replaces existing filters on the updated columns instead of duplicating', () => {
    const current = [filter('browser', 'Safari'), filter('browser_version', '17')];

    const next = applyFilterUpdates(current, [
      { column: 'browser', value: 'Chrome' },
      { column: 'browser_version', value: '120' },
    ]);

    expect(next).toHaveLength(2);
    expect(next.map((f) => f.values[0])).toEqual(['Chrome', '120']);
  });

  it('applies a country + region + city triplet atomically', () => {
    const current = [filter('country_code', 'US'), filter('browser', 'Chrome')];

    const next = applyFilterUpdates(current, [
      { column: 'country_code', value: 'DK' },
      { column: 'subdivision_code', value: 'DK-84' },
      { column: 'city', value: 'Aarhus' },
    ]);

    expect(next).toHaveLength(4);
    expect(next[0]).toMatchObject({ column: 'browser', values: ['Chrome'] });
    expect(next.slice(1).map((f) => f.values[0])).toEqual(['DK', 'DK-84', 'Aarhus']);
  });

  it('clears replaceColumns that have no incoming update', () => {
    const current = [filter('browser', 'Safari'), filter('browser_version', '17')];

    const next = applyFilterUpdates(current, [{ column: 'browser', value: 'Chrome' }], [
      'browser',
      'browser_version',
    ]);

    expect(next).toHaveLength(1);
    expect(next[0]).toMatchObject({ column: 'browser', values: ['Chrome'] });
  });

  it('leaves unrelated columns untouched', () => {
    const current = [filter('url', '/pricing'), filter('browser', 'Safari')];

    const next = applyFilterUpdates(current, [{ column: 'browser', value: 'Chrome' }]);

    expect(next).toHaveLength(2);
    expect(next[0]).toMatchObject({ column: 'url', values: ['/pricing'] });
  });

  it('keeps a version filter when replacing only its browser', () => {
    const current = [filter('browser_version', '17')];

    const next = applyFilterUpdates(current, [{ column: 'browser', value: 'Chrome' }]);

    expect(next).toHaveLength(2);
    expect(next.map((f) => f.column).sort()).toEqual(['browser', 'browser_version']);
  });

  it('keeps the count stable when replacing at the filter cap', () => {
    const others = Array.from({ length: 8 }, (_, i) => filter('url', `/page-${i}`, `id-${i}`));
    const current = [...others, filter('browser', 'Safari'), filter('browser_version', '17')];

    const next = applyFilterUpdates(current, [
      { column: 'browser', value: 'Chrome' },
      { column: 'browser_version', value: '120' },
    ]);

    expect(next).toHaveLength(10);
  });

  it('does not mutate the input array', () => {
    const current = [filter('browser', 'Safari')];

    applyFilterUpdates(current, [{ column: 'browser', value: 'Chrome' }]);

    expect(current).toHaveLength(1);
    expect(current[0].values).toEqual(['Safari']);
  });

  it('clears a lingering city filter when a region row applies region + country', () => {
    const current = [filter('country_code', 'US'), filter('subdivision_code', 'US-IL'), filter('city', 'Springfield')];

    const next = applyFilterUpdates(
      current,
      [
        { column: 'subdivision_code', value: 'DK-84' },
        { column: 'country_code', value: 'DK' },
      ],
      withDependentColumns(['subdivision_code', 'country_code']),
    );

    expect(next).toHaveLength(2);
    expect(next.map((f) => f.values[0]).sort()).toEqual(['DK', 'DK-84']);
  });

  it('applies an update operator when given', () => {
    const next = applyFilterUpdates([], [{ column: 'browser', value: 'Chrome', operator: '!=' }]);

    expect(next).toHaveLength(1);
    expect(next[0]).toMatchObject({ column: 'browser', operator: '!=', values: ['Chrome'] });
  });
});

describe('withDependentColumns', () => {
  it('expands a parent column with its dependents', () => {
    expect(withDependentColumns(['browser']).sort()).toEqual(['browser', 'browser_version']);
    expect(withDependentColumns(['os']).sort()).toEqual(['os', 'os_version']);
  });

  it('expands geography columns to all narrower levels', () => {
    expect(withDependentColumns(['country_code']).sort()).toEqual(['city', 'country_code', 'subdivision_code']);
    expect(withDependentColumns(['subdivision_code']).sort()).toEqual(['city', 'subdivision_code']);
  });

  it('never expands a dependent to its parent', () => {
    expect(withDependentColumns(['browser_version'])).toEqual(['browser_version']);
    expect(withDependentColumns(['os_version'])).toEqual(['os_version']);
    expect(withDependentColumns(['city'])).toEqual(['city']);
  });

  it('passes through columns without dependents', () => {
    expect(withDependentColumns(['url'])).toEqual(['url']);
    expect(withDependentColumns(['gp.plan'])).toEqual(['gp.plan']);
  });

  it('deduplicates when a dependent is already listed', () => {
    expect(withDependentColumns(['browser', 'browser_version']).sort()).toEqual(['browser', 'browser_version']);
  });
});

describe('dependencyScopeFilters', () => {
  it('keeps only filters on columns related to the column', () => {
    const siblings = [filter('browser', 'Chrome'), filter('url', '/pricing'), filter('os', 'Windows')];

    expect(dependencyScopeFilters('browser_version', siblings)).toEqual([siblings[0]]);
  });

  it('scopes city by both region and country', () => {
    const siblings = [filter('country_code', 'DK'), filter('subdivision_code', 'DK-84'), filter('browser', 'Chrome')];

    expect(dependencyScopeFilters('city', siblings)).toEqual([siblings[0], siblings[1]]);
  });

  it('scopes city by country alone when no region filter exists', () => {
    const siblings = [filter('country_code', 'DK'), filter('url', '/pricing')];

    expect(dependencyScopeFilters('city', siblings)).toEqual([siblings[0]]);
  });

  it('never scopes a parent by its dependent values', () => {
    expect(dependencyScopeFilters('country_code', [filter('city', 'Aarhus')])).toEqual([]);
    expect(dependencyScopeFilters('subdivision_code', [filter('city', 'Aarhus')])).toEqual([]);
    expect(dependencyScopeFilters('browser', [filter('browser_version', '120')])).toEqual([]);
  });

  it('returns nothing for columns without related filters', () => {
    expect(dependencyScopeFilters('browser', [filter('os', 'Windows'), filter('os_version', '10')])).toEqual([]);
    expect(dependencyScopeFilters('gp.plan', [filter('browser', 'Chrome')])).toEqual([]);
  });

  it('ignores related filters without usable values', () => {
    const empty: QueryFilter = { id: 'empty', column: 'browser', operator: '=', values: [] };
    const blank: QueryFilter = { id: 'blank', column: 'browser', operator: '=', values: [''] };

    expect(dependencyScopeFilters('browser_version', [empty, blank])).toEqual([]);
  });
});
