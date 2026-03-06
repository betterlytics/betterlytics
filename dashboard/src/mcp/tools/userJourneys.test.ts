import { describe, it, expect, vi } from 'vitest';

vi.mock('@/services/analytics/userJourney.service', () => ({
  getUserJourneyForSankeyDiagram: vi.fn(),
}));

vi.mock('@/mcp/utils/resolveTimeRange', () => ({
  resolveTimeRange: vi.fn(),
}));

import { McpUserJourneysInputSchema } from '@/mcp/tools/userJourneys';

describe('McpUserJourneysInputSchema', () => {
  it('accepts valid input with required fields only', () => {
    const result = McpUserJourneysInputSchema.safeParse({ timeRange: '7d' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.maxSteps).toBe(3);
      expect(result.data.limit).toBe(50);
      expect(result.data.timezone).toBe('UTC');
    }
  });

  it('accepts full input with all optional fields', () => {
    const result = McpUserJourneysInputSchema.safeParse({
      timeRange: 'custom',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      timezone: 'Europe/Berlin',
      filters: [{ column: 'url', operator: '=', values: ['/pricing'] }],
      maxSteps: 5,
      limit: 100,
    });
    expect(result.success).toBe(true);
  });

  it('rejects custom time range without dates', () => {
    const result = McpUserJourneysInputSchema.safeParse({ timeRange: 'custom' });
    expect(result.success).toBe(false);
  });

  it('rejects maxSteps less than 2', () => {
    const result = McpUserJourneysInputSchema.safeParse({ timeRange: '7d', maxSteps: 1 });
    expect(result.success).toBe(false);
  });
});
