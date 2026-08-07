import { describe, it, expect } from 'vitest';
import { BAFilterSearchParams } from './filterSearchParams';

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
