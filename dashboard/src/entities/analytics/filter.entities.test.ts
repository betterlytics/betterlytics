import { describe, it, expect } from 'vitest';
import {
  applyFilterUpdates,
  areQueryFiltersEquivalent,
  diffQueryFilters,
  undoQueryFilterDiff,
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

describe('applyFilterUpdates identity stability', () => {
  it('keeps the existing instance and position for a semantically unchanged filter', () => {
    const region = filter('subdivision_code', 'US-VA');
    const country = filter('country_code', 'US');
    const current = [region, country];

    const next = applyFilterUpdates(
      current,
      [
        { column: 'city', value: 'Ashburn' },
        { column: 'subdivision_code', value: 'US-VA' },
        { column: 'country_code', value: 'US' },
      ],
      ['city', 'subdivision_code', 'country_code'],
    );

    expect(next).toHaveLength(3);
    expect(next[0]).toBe(region);
    expect(next[1]).toBe(country);
    expect(next[2]).toMatchObject({ column: 'city', values: ['Ashburn'] });
  });

  it('mints a new id only for the filter whose value changed', () => {
    const browser = filter('browser', 'Chrome');
    const next = applyFilterUpdates([browser], [{ column: 'browser', value: 'Firefox' }]);

    expect(next).toHaveLength(1);
    expect(next[0].id).not.toBe(browser.id);
  });
});

describe('undoQueryFilterDiff', () => {
  it('removes the added filter and restores the removed instance', () => {
    const firefox = filter('browser', 'Firefox');
    const chrome = filter('browser', 'Chrome');

    const undone = undoQueryFilterDiff([chrome], { added: [chrome], removed: [firefox] });

    expect(undone).toHaveLength(1);
    expect(undone[0]).toBe(firefox);
  });

  it('keeps filters added through other paths while the toast was open', () => {
    const chrome = filter('browser', 'Chrome');
    const dk = filter('country_code', 'DK');

    const undone = undoQueryFilterDiff([chrome, dk], { added: [chrome], removed: [] });

    expect(undone).toEqual([dk]);
  });

  it('does not resurrect a filter the user removed through another path', () => {
    const chrome = filter('browser', 'Chrome');

    const undone = undoQueryFilterDiff([chrome], { added: [chrome], removed: [] });

    expect(undone).toEqual([]);
  });

  it('matches the added filter by content, not id', () => {
    const undone = undoQueryFilterDiff([filter('browser', 'Chrome', 'current')], {
      added: [filter('browser', 'Chrome', 'announced')],
      removed: [],
    });

    expect(undone).toEqual([]);
  });

  it('leaves an added filter alone once the user has edited it', () => {
    const edited = filter('browser', 'Firefox');

    const undone = undoQueryFilterDiff([edited], { added: [filter('browser', 'Chrome')], removed: [] });

    expect(undone).toEqual([edited]);
  });

  it('does not duplicate a removed filter the user already restored', () => {
    const manual = filter('country_code', 'DK', 'manual');

    const undone = undoQueryFilterDiff([manual], { added: [], removed: [filter('country_code', 'DK')] });

    expect(undone).toEqual([manual]);
  });

  it('removes each added filter at most once', () => {
    const a = filter('url', '/a', 'a1');
    const b = filter('url', '/a', 'a2');

    const undone = undoQueryFilterDiff([a, b], { added: [filter('url', '/a', 'a3')], removed: [] });

    expect(undone).toHaveLength(1);
  });
});

describe('diffQueryFilters', () => {
  it('reports only actual additions and removals', () => {
    const region = filter('subdivision_code', 'US-VA');
    const country = filter('country_code', 'US');
    const city = filter('city', 'Ashburn');

    const diff = diffQueryFilters([region, country], [region, country, city]);

    expect(diff.added).toEqual([city]);
    expect(diff.removed).toEqual([]);
  });

  it('reports a value change as a removal plus an addition', () => {
    const chrome = filter('browser', 'Chrome');
    const firefox = filter('browser', 'Firefox');

    const diff = diffQueryFilters([chrome], [firefox]);

    expect(diff.added).toEqual([firefox]);
    expect(diff.removed).toEqual([chrome]);
  });

  it('ignores id differences', () => {
    const diff = diffQueryFilters([filter('url', '/blog', 'x')], [filter('url', '/blog', 'y')]);

    expect(diff.added).toEqual([]);
    expect(diff.removed).toEqual([]);
  });

  it('matches duplicate semantic filters one-to-one', () => {
    const a = filter('url', '/a', 'a1');
    const b = filter('url', '/a', 'a2');

    const diff = diffQueryFilters([a, b], [filter('url', '/a', 'a3')]);

    expect(diff.added).toEqual([]);
    expect(diff.removed).toHaveLength(1);
  });
});

describe('areQueryFiltersEquivalent', () => {
  it('treats identical filters with different ids as equivalent', () => {
    const a = [filter('browser', 'Chrome', 'id-1')];
    const b = [filter('browser', 'Chrome', 'id-2')];

    expect(areQueryFiltersEquivalent(a, b)).toBe(true);
  });

  it('ignores filter order', () => {
    const a = [filter('browser', 'Chrome'), filter('country_code', 'DK')];
    const b = [filter('country_code', 'DK', 'other'), filter('browser', 'Chrome', 'ids')];

    expect(areQueryFiltersEquivalent(a, b)).toBe(true);
  });

  it('ignores value order within a filter', () => {
    const a: QueryFilter[] = [{ id: '1', column: 'browser', operator: '=', values: ['Chrome', 'Firefox'] }];
    const b: QueryFilter[] = [{ id: '2', column: 'browser', operator: '=', values: ['Firefox', 'Chrome'] }];

    expect(areQueryFiltersEquivalent(a, b)).toBe(true);
  });

  it('distinguishes different values, operators, and columns', () => {
    const chrome = [filter('browser', 'Chrome')];

    expect(areQueryFiltersEquivalent(chrome, [filter('browser', 'Firefox')])).toBe(false);
    expect(
      areQueryFiltersEquivalent(chrome, [{ id: 'x', column: 'browser', operator: '!=', values: ['Chrome'] }]),
    ).toBe(false);
    expect(areQueryFiltersEquivalent(chrome, [filter('os', 'Chrome')])).toBe(false);
  });

  it('distinguishes differing lengths', () => {
    const a = [filter('browser', 'Chrome')];

    expect(areQueryFiltersEquivalent(a, [])).toBe(false);
    expect(areQueryFiltersEquivalent(a, [...a, filter('country_code', 'DK')])).toBe(false);
  });
});
