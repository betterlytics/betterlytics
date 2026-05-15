import { describe, it, expect } from 'vitest';
import { MAX_FILTER_ROWS, QueryFilterSchema } from '@/entities/analytics/filter.entities';
import { CreateSavedFilterSchema, SavedFilterSchema } from '@/entities/analytics/savedFilters.entities';
import { BAAnalyticsQuerySchema } from '@/entities/analytics/analyticsQuery.entities';

const entry = (id: string) => ({
  id,
  column: 'url' as const,
  operator: '=' as const,
  values: ['/'],
});

const queryFilter = (id: string) => ({
  id,
  column: 'url' as const,
  operator: '=' as const,
  values: ['/'],
});

const baseAnalyticsInput = (queryFilters: ReturnType<typeof queryFilter>[]) => ({
  startDate: new Date(),
  endDate: new Date(),
  granularity: 'day' as const,
  queryFilters,
  timezone: 'UTC',
  userJourney: { numberOfSteps: 3, numberOfJourneys: 10 },
  interval: '28d' as const,
  compare: 'off' as const,
});

describe('MAX_FILTER_ROWS', () => {
  it('caps SavedFilterSchema.entries', () => {
    const dashboardId = 'cjld2cjxh0000qzrmn831i7rn';
    const id = 'cjld2cjxh0001qzrmn832j8so';
    const ok = SavedFilterSchema.safeParse({
      id,
      dashboardId,
      name: 'ok',
      entries: Array.from({ length: MAX_FILTER_ROWS }, (_, i) => entry(`e${i}`)),
    });
    expect(ok.success).toBe(true);

    const tooMany = SavedFilterSchema.safeParse({
      id,
      dashboardId,
      name: 'too many',
      entries: Array.from({ length: MAX_FILTER_ROWS + 1 }, (_, i) => entry(`e${i}`)),
    });
    expect(tooMany.success).toBe(false);
  });

  it('caps CreateSavedFilterSchema.entries', () => {
    const dashboardId = 'cjld2cjxh0000qzrmn831i7rn';
    const make = (n: number) => ({
      name: 'x',
      dashboardId,
      entries: Array.from({ length: n }, () => ({
        column: 'url' as const,
        operator: '=' as const,
        values: ['/'],
      })),
    });
    expect(CreateSavedFilterSchema.safeParse(make(MAX_FILTER_ROWS)).success).toBe(true);
    expect(CreateSavedFilterSchema.safeParse(make(MAX_FILTER_ROWS + 1)).success).toBe(false);
  });

  it('caps BAAnalyticsQuerySchema.queryFilters', () => {
    const ok = BAAnalyticsQuerySchema.safeParse(
      baseAnalyticsInput(Array.from({ length: MAX_FILTER_ROWS }, (_, i) => queryFilter(`q${i}`))),
    );
    expect(ok.success).toBe(true);

    const tooMany = BAAnalyticsQuerySchema.safeParse(
      baseAnalyticsInput(Array.from({ length: MAX_FILTER_ROWS + 1 }, (_, i) => queryFilter(`q${i}`))),
    );
    expect(tooMany.success).toBe(false);
  });

  it(`QueryFilterSchema itself has no row cap (caps applied at array level)`, () => {
    expect(QueryFilterSchema.safeParse(queryFilter('q')).success).toBe(true);
  });
});
