import { describe, it, expect } from 'vitest';
import { BAAnalyticsQuerySchema } from '@/entities/analytics/analyticsQuery.entities';

const base = {
  startDate: new Date('2026-06-01T00:00:00Z'),
  endDate: new Date('2026-06-28T00:00:00Z'),
  granularity: 'day',
  queryFilters: [],
  timezone: 'UTC',
  interval: '28d',
  compare: 'off',
  userJourney: { numberOfSteps: 3, numberOfJourneys: 10 },
};

const urlFilter = { id: 'f1', column: 'url', operator: '=', values: ['/signup'] };

describe('UserJourneySchema.stepFilters', () => {
  it('defaults stepFilters to an empty object when omitted', () => {
    const parsed = BAAnalyticsQuerySchema.parse(base);
    expect(parsed.userJourney.stepFilters).toEqual({});
  });

  it('accepts filters keyed by stringified position', () => {
    const parsed = BAAnalyticsQuerySchema.parse({
      ...base,
      userJourney: { ...base.userJourney, stepFilters: { '2': [urlFilter] } },
    });
    expect(parsed.userJourney.stepFilters['2']).toHaveLength(1);
  });

  it('rejects positions beyond the maximum number of steps', () => {
    const query = {
      ...base,
      userJourney: { ...base.userJourney, stepFilters: { '6': [urlFilter] } },
    };
    expect(() => BAAnalyticsQuerySchema.parse(query)).toThrow();
  });

  it('rejects non-numeric position keys', () => {
    const query = {
      ...base,
      userJourney: { ...base.userJourney, stepFilters: { entry: [urlFilter] } },
    };
    expect(() => BAAnalyticsQuerySchema.parse(query)).toThrow();
  });

  it('rejects more than MAX_FILTER_ROWS filters at one position', () => {
    const filters = Array.from({ length: 11 }, (_, i) => ({ ...urlFilter, id: `f${i}` }));
    const query = {
      ...base,
      userJourney: { ...base.userJourney, stepFilters: { '0': filters } },
    };
    expect(() => BAAnalyticsQuerySchema.parse(query)).toThrow();
  });
});
