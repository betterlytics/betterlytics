import { describe, it, expect } from 'vitest';
import { BAFilterSearchParams } from './filterSearchParams';
import { sanitizeStepFilters } from '@/entities/analytics/filterQueryParams.entities';

const TZ = 'Etc/UTC';

function decodeParams(params: Record<string, string>) {
  return BAFilterSearchParams.decode(params, TZ);
}

function encodeFilters(filters: unknown[]) {
  return JSON.stringify(filters);
}

const validFilter = { id: 'f1', column: 'url', operator: '=', values: ['/pricing'] };

describe('BAFilterSearchParams.decode with malformed query filters', () => {
  it('drops only the invalid filter and keeps the rest', () => {
    const result = decodeParams({
      queryFilters: encodeFilters([
        validFilter,
        { id: 'f2', column: 'cep.ran\tdom', operator: '=', values: ['b'] },
      ]),
    });

    expect(result.queryFilters).toHaveLength(1);
    expect(result.queryFilters[0].column).toBe('url');
  });

  it('preserves unrelated state when a filter is invalid', () => {
    const result = decodeParams({
      queryFilters: encodeFilters([{ id: 'f2', column: 'not_a_column', operator: '=', values: ['x'] }]),
      interval: '7d',
    });

    expect(result.queryFilters).toHaveLength(0);
    expect(result.interval).toBe('7d');
  });

  it('treats unparseable queryFilters JSON as empty without touching other params', () => {
    const result = decodeParams({
      queryFilters: '{not-json',
      interval: '7d',
    });

    expect(result.queryFilters).toHaveLength(0);
    expect(result.interval).toBe('7d');
  });

  it('treats non-array queryFilters JSON as empty', () => {
    const result = decodeParams({ queryFilters: JSON.stringify({ id: 'f1' }) });

    expect(result.queryFilters).toHaveLength(0);
  });

  it('drops filters with a malformed shape', () => {
    const result = decodeParams({
      queryFilters: encodeFilters([{ id: 'f2', column: 'url' }, validFilter]),
    });

    expect(result.queryFilters).toHaveLength(1);
    expect(result.queryFilters[0].id).toBe('f1');
  });
});

describe('sanitizeStepFilters', () => {
  const valid = { id: 'f1', column: 'url', operator: '=', values: ['/pricing'] };

  it('returns an empty object for non-object input', () => {
    expect(sanitizeStepFilters(undefined, 3)).toEqual({});
    expect(sanitizeStepFilters('nope', 3)).toEqual({});
    expect(sanitizeStepFilters([valid], 3)).toEqual({});
  });

  it('keeps valid slots and drops invalid filters individually', () => {
    const result = sanitizeStepFilters({ '1': [valid, { column: 'url' }] }, 3);
    expect(result['1']).toEqual([valid]);
  });

  it('drops out-of-range and non-integer slot keys', () => {
    expect(sanitizeStepFilters({ '4': [valid], 'x': [valid], '-1': [valid] }, 3)).toEqual({});
  });

  it('drops slots whose filters all fail validation', () => {
    expect(sanitizeStepFilters({ '0': [{ column: 'url' }] }, 3)).toEqual({});
  });

  it('drops the slot equal to numberOfSteps (slots are zero-based)', () => {
    expect(sanitizeStepFilters({ '3': [valid] }, 3)).toEqual({});
    expect(sanitizeStepFilters({ '2': [valid] }, 3)).toEqual({ '2': [valid] });
  });
});

describe('stepFilters in the userJourney search param', () => {
  it('round-trips stepFilters through encode and decode', () => {
    const defaults = BAFilterSearchParams.getDefaultFilters();
    const withStepFilters = {
      ...defaults,
      userJourney: {
        ...defaults.userJourney,
        stepFilters: { '1': [{ id: 'f1', column: 'url' as const, operator: '=' as const, values: ['/pricing'] }] },
      },
    };
    const encoded = Object.fromEntries(BAFilterSearchParams.encode(withStepFilters));
    expect(encoded.userJourney).toContain('stepFilters');

    const decoded = BAFilterSearchParams.decode(encoded, 'Etc/UTC');
    expect(decoded.userJourney.stepFilters['1']).toHaveLength(1);
  });

  it('elides the userJourney param when everything matches defaults', () => {
    const encoded = BAFilterSearchParams.encode(BAFilterSearchParams.getDefaultFilters());
    expect(encoded.find(([key]) => key === 'userJourney')).toBeUndefined();
  });

  it('survives a malformed stepFilters entry without resetting other state', () => {
    const defaults = BAFilterSearchParams.getDefaultFilters();
    const decoded = BAFilterSearchParams.decode(
      {
        userJourney: JSON.stringify({
          numberOfSteps: 4,
          numberOfJourneys: 20,
          stepFilters: { '2': [{ broken: true }], '9': [] },
        }),
      },
      'Etc/UTC',
    );
    expect(decoded.userJourney.numberOfSteps).toBe(4);
    expect(decoded.userJourney.stepFilters).toEqual({});
    expect(decoded.queryFilters).toEqual(defaults.queryFilters);
  });

  it('clamps decoded numberOfSteps into the 2 to 6 range', () => {
    const low = BAFilterSearchParams.decode(
      { userJourney: JSON.stringify({ numberOfSteps: 1, numberOfJourneys: 5, stepFilters: {} }) },
      'Etc/UTC',
    );
    expect(low.userJourney.numberOfSteps).toBe(2);
    const high = BAFilterSearchParams.decode(
      { userJourney: JSON.stringify({ numberOfSteps: 9, numberOfJourneys: 5, stepFilters: {} }) },
      'Etc/UTC',
    );
    expect(high.userJourney.numberOfSteps).toBe(6);
  });
});

describe('BAFilterSearchParams.decode existing behavior', () => {
  it('keeps valid filters as-is', () => {
    const result = decodeParams({
      queryFilters: encodeFilters([validFilter, { id: 'f2', column: 'gp.plan', operator: '!=', values: ['pro'] }]),
    });

    expect(result.queryFilters).toHaveLength(2);
    expect(result.queryFilters[1].column).toBe('gp.plan');
  });

  it('still migrates legacy single-value filters', () => {
    const result = decodeParams({
      queryFilters: encodeFilters([{ id: 'f1', column: 'url', operator: '=', value: '/pricing' }]),
    });

    expect(result.queryFilters).toHaveLength(1);
    expect(result.queryFilters[0].values).toEqual(['/pricing']);
  });

  it('still caps the number of filters at the row limit', () => {
    const filters = Array.from({ length: 15 }, (_, i) => ({
      id: `f${i}`,
      column: 'url',
      operator: '=',
      values: [`/${i}`],
    }));
    const result = decodeParams({ queryFilters: encodeFilters(filters) });

    expect(result.queryFilters).toHaveLength(10);
  });
});
