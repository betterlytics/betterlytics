import { describe, it, expect, vi } from 'vitest';

vi.mock('@/services/analytics/funnels.service', () => ({
  getFunnelsByDashboardId: vi.fn(),
}));

vi.mock('@/repositories/postgres/dashboard.repository', () => ({
  findDashboardBySiteId: vi.fn(),
}));

import { McpListFunnelsInputSchema } from '@/mcp/tools/listFunnels';

describe('McpListFunnelsInputSchema', () => {
  it('accepts valid input with required fields', () => {
    const result = McpListFunnelsInputSchema.safeParse({ timeRange: '7d' });
    expect(result.success).toBe(true);
  });

  it('accepts custom time range with dates', () => {
    const result = McpListFunnelsInputSchema.safeParse({
      timeRange: 'custom',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
    });
    expect(result.success).toBe(true);
  });

  it('rejects custom time range without dates', () => {
    const result = McpListFunnelsInputSchema.safeParse({ timeRange: 'custom' });
    expect(result.success).toBe(false);
  });
});
