import { describe, it, expect } from 'vitest';
import { applyFilterPairs, type QueryFilter } from '@/entities/analytics/filter.entities';

function filter(column: QueryFilter['column'], value: string, id = `id-${column}`): QueryFilter {
  return { id, column, operator: '=', values: [value] };
}

describe('applyFilterPairs', () => {
  it('appends pairs as equals filters with generated ids', () => {
    const next = applyFilterPairs([], [{ column: 'browser', value: 'Chrome' }]);

    expect(next).toHaveLength(1);
    expect(next[0]).toMatchObject({ column: 'browser', operator: '=', values: ['Chrome'] });
    expect(next[0].id).toBeTruthy();
  });

  it('replaces existing filters on the pair columns instead of duplicating', () => {
    const current = [filter('browser', 'Safari'), filter('browser_version', '17')];

    const next = applyFilterPairs(current, [
      { column: 'browser', value: 'Chrome' },
      { column: 'browser_version', value: '120' },
    ]);

    expect(next).toHaveLength(2);
    expect(next.map((f) => f.values[0])).toEqual(['Chrome', '120']);
  });

  it('leaves unrelated columns untouched', () => {
    const current = [filter('url', '/pricing'), filter('browser', 'Safari')];

    const next = applyFilterPairs(current, [{ column: 'browser', value: 'Chrome' }]);

    expect(next).toHaveLength(2);
    expect(next[0]).toMatchObject({ column: 'url', values: ['/pricing'] });
  });

  it('keeps a version filter when replacing only its browser', () => {
    const current = [filter('browser_version', '17')];

    const next = applyFilterPairs(current, [{ column: 'browser', value: 'Chrome' }]);

    expect(next).toHaveLength(2);
    expect(next.map((f) => f.column).sort()).toEqual(['browser', 'browser_version']);
  });

  it('keeps the count stable when replacing at the filter cap', () => {
    const others = Array.from({ length: 8 }, (_, i) => filter('url', `/page-${i}`, `id-${i}`));
    const current = [...others, filter('browser', 'Safari'), filter('browser_version', '17')];

    const next = applyFilterPairs(current, [
      { column: 'browser', value: 'Chrome' },
      { column: 'browser_version', value: '120' },
    ]);

    expect(next).toHaveLength(10);
  });

  it('does not mutate the input array', () => {
    const current = [filter('browser', 'Safari')];

    applyFilterPairs(current, [{ column: 'browser', value: 'Chrome' }]);

    expect(current).toHaveLength(1);
    expect(current[0].values).toEqual(['Safari']);
  });

  it('applies a pair operator when given', () => {
    const next = applyFilterPairs([], [{ column: 'browser', value: 'Chrome', operator: '!=' }]);

    expect(next).toHaveLength(1);
    expect(next[0]).toMatchObject({ column: 'browser', operator: '!=', values: ['Chrome'] });
  });
});
