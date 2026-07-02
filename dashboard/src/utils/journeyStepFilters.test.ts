import { describe, it, expect } from 'vitest';
import type { QueryFilter } from '@/entities/analytics/filter.entities';
import { pruneStepFilters, setStepFiltersAt, splitStepFilters } from '@/utils/journeyStepFilters';

const filter = (over: Partial<QueryFilter>): QueryFilter => ({
  id: 'f',
  column: 'url',
  operator: '=',
  values: ['/a'],
  ...over,
});

describe('splitStepFilters', () => {
  it('classifies url filters as positional and everything else as session-level', () => {
    const { sessionFilters, positionalUrlFilters } = splitStepFilters({
      '0': [filter({ id: 'u0', column: 'url' })],
      '2': [filter({ id: 'd2', column: 'device_type', values: ['Mobile'] }), filter({ id: 'u2', column: 'url' })],
    });
    expect(sessionFilters.map((f) => f.id)).toEqual(['d2']);
    expect(positionalUrlFilters).toEqual([
      { position: 0, filters: [filter({ id: 'u0', column: 'url' })] },
      { position: 2, filters: [filter({ id: 'u2', column: 'url' })] },
    ]);
  });

  it('treats global property filters as session-level', () => {
    const { sessionFilters, positionalUrlFilters } = splitStepFilters({
      '1': [filter({ id: 'g', column: 'gp.plan', values: ['pro'] })],
    });
    expect(sessionFilters.map((f) => f.id)).toEqual(['g']);
    expect(positionalUrlFilters).toEqual([]);
  });

  it('drops unusable url filters (empty values)', () => {
    const { positionalUrlFilters } = splitStepFilters({ '1': [filter({ values: [''] })] });
    expect(positionalUrlFilters).toEqual([]);
  });

  it('sorts positional entries by position', () => {
    const { positionalUrlFilters } = splitStepFilters({
      '3': [filter({ id: 'b' })],
      '1': [filter({ id: 'a' })],
    });
    expect(positionalUrlFilters.map((e) => e.position)).toEqual([1, 3]);
  });
});

describe('pruneStepFilters', () => {
  it('drops positions beyond the new number of steps', () => {
    const pruned = pruneStepFilters({ '1': [filter({})], '5': [filter({})] }, 3);
    expect(Object.keys(pruned)).toEqual(['1']);
  });

  it('keeps the boundary position', () => {
    const pruned = pruneStepFilters({ '3': [filter({})] }, 3);
    expect(Object.keys(pruned)).toEqual(['3']);
  });

  it('returns the same object when nothing is pruned', () => {
    const stepFilters = { '1': [filter({})] };
    expect(pruneStepFilters(stepFilters, 3)).toBe(stepFilters);
  });
});

describe('setStepFiltersAt', () => {
  it('sets filters at a position without mutating the input', () => {
    const before: Record<string, QueryFilter[]> = {};
    const after = setStepFiltersAt(before, 2, [filter({})]);
    expect(after['2']).toHaveLength(1);
    expect(before).toEqual({});
  });

  it('removes the position when given an empty array', () => {
    const after = setStepFiltersAt({ '2': [filter({})] }, 2, []);
    expect(after['2']).toBeUndefined();
  });
});
