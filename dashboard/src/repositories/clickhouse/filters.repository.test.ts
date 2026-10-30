import { describe, it, expect, vi, beforeEach } from 'vitest';

const query = vi.hoisted(() => vi.fn());

vi.mock('@/lib/clickhouse', () => ({
  clickhouse: { query },
}));

vi.mock('@/lib/ba-query', () => ({
  BAQuery: { getSampling: vi.fn() },
}));

import { getFilterDistinctValues, getPropertyKeys, getPropertyValues } from './filters.repository';
import type { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

const siteQuery = {
  siteId: 'test-site',
  startDateTime: '2026-01-01 00:00:00',
  endDateTime: '2026-01-31 23:59:59',
} as BASiteQuery;

function boundSearch() {
  return query.mock.calls[0][1].params.search;
}

describe('filter value search', () => {
  beforeEach(() => {
    query.mockReset();
    query.mockReturnValue({ toPromise: () => Promise.resolve([]) });
  });

  it('matches backslash, percent and underscore literally in distinct values', async () => {
    await getFilterDistinctValues(siteQuery, 'custom_event_name', 50, 'plan_50%\\x');

    expect(boundSearch()).toBe('%plan\\_50\\%\\\\x%');
  });

  it('matches backslash, percent and underscore literally in property keys', async () => {
    await getPropertyKeys(siteQuery, 'cep', 'plan_50%\\x');

    expect(boundSearch()).toBe('%plan\\_50\\%\\\\x%');
  });

  it('matches backslash, percent and underscore literally in property values', async () => {
    await getPropertyValues(siteQuery, 'gp', 'plan', 'plan_50%\\x');

    expect(boundSearch()).toBe('%plan\\_50\\%\\\\x%');
  });

  it('leaves * as a plain character', async () => {
    await getFilterDistinctValues(siteQuery, 'url', 50, '/users/*');

    expect(boundSearch()).toBe('%/users/*%');
  });
});

describe('filter value ordering', () => {
  beforeEach(() => {
    query.mockReset();
    query.mockReturnValue({ toPromise: () => Promise.resolve([]) });
  });

  function normalizedSql() {
    return (query.mock.calls[0][0] as string).replace(/\s+/g, ' ');
  }

  it('orders distinct values most common first, ties alphabetical', async () => {
    await getFilterDistinctValues(siteQuery, 'browser', 50);

    expect(normalizedSql()).toContain('GROUP BY value ORDER BY count() DESC, value ASC LIMIT');
  });

  it('keeps the same order when searching distinct values', async () => {
    await getFilterDistinctValues(siteQuery, 'url', 50, '/blog');

    expect(normalizedSql()).toContain('GROUP BY value ORDER BY count() DESC, value ASC LIMIT');
  });

  it.each(['gp', 'cep'] as const)(
    'orders %s property values most common first, ties alphabetical',
    async (source) => {
      await getPropertyValues(siteQuery, source, 'plan', 'pro');

      expect(normalizedSql()).toContain('GROUP BY value ORDER BY count() DESC, value ASC LIMIT');
    },
  );

  it('ranks distinct values by events from rankFrom when the lookup was widened', async () => {
    await getFilterDistinctValues(siteQuery, 'url', 50, undefined, '2026-01-25 00:00:00');

    expect(normalizedSql()).toMatch(
      /ORDER BY countIf\(timestamp >= \{rank_from\w*:DateTime\}\) DESC, value ASC LIMIT/,
    );
    expect(Object.values(query.mock.calls[0][1].params)).toContain('2026-01-25 00:00:00');
  });

  it('ranks property values by events from rankFrom when the lookup was widened', async () => {
    await getPropertyValues(siteQuery, 'cep', 'plan', undefined, 50, '2026-01-25 00:00:00');

    expect(normalizedSql()).toMatch(
      /ORDER BY countIf\(timestamp >= \{rank_from\w*:DateTime\}\) DESC, value ASC LIMIT/,
    );
    expect(Object.values(query.mock.calls[0][1].params)).toContain('2026-01-25 00:00:00');
  });
});
