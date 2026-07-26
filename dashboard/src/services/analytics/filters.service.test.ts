import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/repositories/clickhouse/filters.repository', () => ({
  getFilterDistinctValues: vi.fn(),
  getPropertyKeys: vi.fn(),
  getPropertyValues: vi.fn(),
}));

import { getPropertyKeys } from '@/repositories/clickhouse/filters.repository';
import { getAvailablePropertyKeys } from '@/services/analytics/filters.service';
import type { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

const getKeys = vi.mocked(getPropertyKeys);
const siteQuery = {} as BASiteQuery;

describe('getAvailablePropertyKeys', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hides keys that cannot be used as filter columns', async () => {
    getKeys.mockResolvedValue(['plan', 'ran\tdom', 'k'.repeat(65), '', 'user_type']);

    const keys = await getAvailablePropertyKeys(siteQuery, 'cep');

    expect(keys).toEqual(['plan', 'user_type']);
  });

  it('passes valid keys through untouched', async () => {
    getKeys.mockResolvedValue(['plan', 'user type', 'æøå']);

    const keys = await getAvailablePropertyKeys(siteQuery, 'gp');

    expect(keys).toEqual(['plan', 'user type', 'æøå']);
  });
});
