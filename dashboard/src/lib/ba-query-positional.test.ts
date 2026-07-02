import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/env', () => ({
  env: { SAMPLING_TRAFFIC_THRESHOLD: 100_000, SAMPLING_FACTOR: 0.25, HIGH_TRAFFIC_CONCURRENCY_LIMIT: 20 },
}));
vi.mock('@/repositories/clickhouse/usage.repository', () => ({
  isHighTrafficSite: vi.fn().mockResolvedValue(false),
}));
vi.mock('@/observability/clickhouse-concurrency', () => ({ setSiteConcurrencyLimit: vi.fn() }));

import { BAQuery } from '@/lib/ba-query';
import type { QueryFilter } from '@/entities/analytics/filter.entities';

const urlFilter = (operator: '=' | '!=', values: string[]): QueryFilter => ({
  id: 'f',
  column: 'url',
  operator,
  values,
});

describe('buildPositionalUrlPredicate', () => {
  it('emits arrayExists over path[p+1] for the equals operator', () => {
    const { taggedSql, taggedParams } = BAQuery.buildPositionalUrlPredicate(urlFilter('=', ['/signup']), 2, 0);
    expect(taggedSql).toBe('arrayExists(pattern -> path[3] ILIKE pattern, {step_filter_0:Array(String)})');
    expect(taggedParams).toEqual({ step_filter_0: ['/signup'] });
  });

  it('emits arrayAll with NOT ILIKE for the not-equals operator', () => {
    const { taggedSql } = BAQuery.buildPositionalUrlPredicate(urlFilter('!=', ['/login']), 1, 4);
    expect(taggedSql).toBe('arrayAll(pattern -> path[2] NOT ILIKE pattern, {step_filter_4:Array(String)})');
  });

  it('converts * wildcards to %', () => {
    const { taggedParams } = BAQuery.buildPositionalUrlPredicate(urlFilter('=', ['/dashboard/*']), 0, 0);
    expect(taggedParams).toEqual({ step_filter_0: ['/dashboard/%'] });
  });

  it('keeps multiple values as one array parameter', () => {
    const { taggedParams } = BAQuery.buildPositionalUrlPredicate(urlFilter('=', ['/a', '/b']), 0, 1);
    expect(taggedParams).toEqual({ step_filter_1: ['/a', '/b'] });
  });

  it('throws on invalid positions', () => {
    expect(() => BAQuery.buildPositionalUrlPredicate(urlFilter('=', ['/a']), -1, 0)).toThrow();
    expect(() => BAQuery.buildPositionalUrlPredicate(urlFilter('=', ['/a']), 1.5, 0)).toThrow();
    expect(() => BAQuery.buildPositionalUrlPredicate(urlFilter('=', ['/a']), 33, 0)).toThrow();
  });
});
