import { describe, it, expect } from 'vitest';
import {
  classifyStepFilter,
  getStepExcludedColumns,
  stripInfeasibleStepFilters,
  pruneStepFilters,
} from './stepFilters.entities';
import { dependencyScopeFilters, FILTER_COLUMNS, type QueryFilter } from './filter.entities';
import { BAAnalyticsQuerySchema } from './analyticsQuery.entities';

const filter = (column: QueryFilter['column'], values: string[] = ['/x']): QueryFilter => ({
  id: 'f1',
  column,
  operator: '=',
  values,
});

describe('classifyStepFilter', () => {
  it('classifies url as positional at every slot', () => {
    expect(classifyStepFilter('url', 0, 3)).toBe('positional');
    expect(classifyStepFilter('url', 3, 3)).toBe('positional');
  });

  it('classifies referrer and utm columns as entry only at slot 0', () => {
    expect(classifyStepFilter('referrer_source', 0, 3)).toBe('entry');
    expect(classifyStepFilter('utm_campaign', 0, 3)).toBe('entry');
    expect(classifyStepFilter('referrer_source', 1, 3)).toBe('infeasible');
    expect(classifyStepFilter('utm_campaign', 3, 3)).toBe('infeasible');
  });

  it('classifies outbound_link_url as exit only at the last slot', () => {
    expect(classifyStepFilter('outbound_link_url', 3, 3)).toBe('exit');
    expect(classifyStepFilter('outbound_link_url', 0, 3)).toBe('infeasible');
    expect(classifyStepFilter('outbound_link_url', 2, 3)).toBe('infeasible');
  });

  it('classifies custom events and cep as stepEvent at every slot', () => {
    expect(classifyStepFilter('custom_event_name', 0, 3)).toBe('stepEvent');
    expect(classifyStepFilter('custom_event_name', 3, 3)).toBe('stepEvent');
    expect(classifyStepFilter('cep.plan', 1, 3)).toBe('stepEvent');
  });

  it('classifies session-wide columns and gp as infeasible everywhere', () => {
    expect(classifyStepFilter('event_type', 0, 3)).toBe('infeasible');
    expect(classifyStepFilter('device_type', 2, 3)).toBe('infeasible');
    expect(classifyStepFilter('browser_version', 0, 3)).toBe('infeasible');
    expect(classifyStepFilter('domain', 3, 3)).toBe('infeasible');
    expect(classifyStepFilter('gp.tenant', 1, 3)).toBe('infeasible');
  });

  it('classifies anything at an out-of-range slot as infeasible', () => {
    expect(classifyStepFilter('url', 4, 3)).toBe('infeasible');
    expect(classifyStepFilter('url', -1, 3)).toBe('infeasible');
    expect(classifyStepFilter('url', 1.5, 3)).toBe('infeasible');
  });
});

describe('getStepExcludedColumns', () => {
  it('always excludes event_type and gp but never custom_event_name or cep', () => {
    for (const slot of [0, 1, 3]) {
      const excluded = getStepExcludedColumns(slot, 3);
      expect(excluded).not.toContain('custom_event_name');
      expect(excluded).toContain('event_type');
      expect(excluded).toContain('gp');
      expect(excluded).not.toContain('cep');
      expect(excluded).not.toContain('url');
    }
  });

  it('excludes entry columns everywhere except slot 0', () => {
    expect(getStepExcludedColumns(0, 3)).not.toContain('referrer_source');
    expect(getStepExcludedColumns(1, 3)).toContain('referrer_source');
    expect(getStepExcludedColumns(1, 3)).toContain('utm_content');
  });

  it('excludes outbound_link_url everywhere except the last slot', () => {
    expect(getStepExcludedColumns(3, 3)).not.toContain('outbound_link_url');
    expect(getStepExcludedColumns(0, 3)).toContain('outbound_link_url');
  });
});

describe('stripInfeasibleStepFilters', () => {
  it('drops infeasible filters and empty slots, keeps the rest', () => {
    const stripped = stripInfeasibleStepFilters(
      {
        '0': [filter('url'), filter('custom_event_name'), filter('device_type')],
        '2': [filter('outbound_link_url')],
        '3': [filter('outbound_link_url')],
      },
      3,
    );
    expect(stripped).toEqual({ '0': [filter('url'), filter('custom_event_name')], '3': [filter('outbound_link_url')] });
  });

  it('drops whole slots beyond the last slot', () => {
    expect(stripInfeasibleStepFilters({ '5': [filter('url')] }, 3)).toEqual({});
  });

  it('returns a new object and leaves the input untouched', () => {
    const input = { '0': [filter('url')] };
    const output = stripInfeasibleStepFilters(input, 3);
    expect(output).not.toBe(input);
    expect(input['0']).toHaveLength(1);
  });
});

describe('pruneStepFilters', () => {
  it('removes slots above the new last slot and keeps the rest', () => {
    const pruned = pruneStepFilters({ '0': [filter('url')], '4': [filter('url')] }, 3);
    expect(pruned).toEqual({ '0': [filter('url')] });
  });
});

const baseQuery = {
  startDate: new Date('2026-08-01T00:00:00Z'),
  endDate: new Date('2026-08-14T00:00:00Z'),
  granularity: 'day' as const,
  queryFilters: [],
  timezone: 'UTC',
  interval: '7d' as const,
  compare: 'off' as const,
  userJourney: { numberOfSteps: 3, numberOfJourneys: 10 },
};

describe('step suggestion scoping parity with the main filter', () => {
  it('keeps step-legal columns free of dependency parents - declaring one requires wiring dependent scoping through the journey suggestions endpoint first (spec section 2)', () => {
    const lastSlot = 3;
    const slots = Array.from({ length: lastSlot + 1 }, (_, slot) => slot);
    const stepLegalColumns: QueryFilter['column'][] = [
      ...FILTER_COLUMNS.filter((column) =>
        slots.some((slot) => classifyStepFilter(column, slot, lastSlot) !== 'infeasible'),
      ),
      'cep.probe',
    ];
    const candidateParents = FILTER_COLUMNS.map((column) => filter(column, ['x']));
    for (const column of stepLegalColumns) {
      expect(dependencyScopeFilters(column, candidateParents)).toEqual([]);
    }
  });
});

describe('UserJourneySchema stepFilters', () => {
  it('defaults stepFilters to an empty object when omitted', () => {
    const parsed = BAAnalyticsQuerySchema.parse(baseQuery);
    expect(parsed.userJourney.stepFilters).toEqual({});
  });

  it('accepts stepFilters keyed by slots within numberOfSteps', () => {
    const parsed = BAAnalyticsQuerySchema.parse({
      ...baseQuery,
      userJourney: { ...baseQuery.userJourney, stepFilters: { '2': [filter('url')] } },
    });
    expect(parsed.userJourney.stepFilters['2']).toHaveLength(1);
  });

  it('rejects slot keys at or above numberOfSteps', () => {
    for (const slot of ['3', '4']) {
      expect(() =>
        BAAnalyticsQuerySchema.parse({
          ...baseQuery,
          userJourney: { ...baseQuery.userJourney, stepFilters: { [slot]: [filter('url')] } },
        }),
      ).toThrow();
    }
  });

  it('rejects non-integer slot keys', () => {
    expect(() =>
      BAAnalyticsQuerySchema.parse({
        ...baseQuery,
        userJourney: { ...baseQuery.userJourney, stepFilters: { abc: [filter('url')] } },
      }),
    ).toThrow();
  });

  it('rejects more than MAX_FILTER_ROWS filters in one slot', () => {
    const filters = Array.from({ length: 11 }, (_, i) => ({ ...filter('url'), id: `f${i}` }));
    expect(() =>
      BAAnalyticsQuerySchema.parse({
        ...baseQuery,
        userJourney: { ...baseQuery.userJourney, stepFilters: { '0': filters } },
      }),
    ).toThrow();
  });

  it('bounds numberOfSteps to 2 through 6', () => {
    for (const numberOfSteps of [2, 6]) {
      expect(() =>
        BAAnalyticsQuerySchema.parse({ ...baseQuery, userJourney: { ...baseQuery.userJourney, numberOfSteps } }),
      ).not.toThrow();
    }
    for (const numberOfSteps of [1, 7]) {
      expect(() =>
        BAAnalyticsQuerySchema.parse({ ...baseQuery, userJourney: { ...baseQuery.userJourney, numberOfSteps } }),
      ).toThrow();
    }
  });
});
