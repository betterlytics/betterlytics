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
