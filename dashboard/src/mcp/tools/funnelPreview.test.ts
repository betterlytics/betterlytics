import { describe, it, expect, vi } from 'vitest';

vi.mock('@/services/analytics/funnels.service', () => ({
  getFunnelPreviewData: vi.fn(),
}));

import { McpFunnelPreviewInputSchema } from '@/mcp/tools/funnelPreview';

describe('McpFunnelPreviewInputSchema', () => {
  const validSteps = [
    { name: 'Homepage', column: 'url' as const, operator: '=' as const, values: ['/'] },
    { name: 'Pricing', column: 'url' as const, operator: '=' as const, values: ['/pricing'] },
  ];

  it('accepts valid input with required fields', () => {
    const result = McpFunnelPreviewInputSchema.safeParse({
      timeRange: '7d',
      steps: validSteps,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isStrict).toBe(false);
    }
  });

  it('rejects fewer than 2 steps', () => {
    const result = McpFunnelPreviewInputSchema.safeParse({
      timeRange: '7d',
      steps: [validSteps[0]],
    });
    expect(result.success).toBe(false);
  });

  it('rejects steps with empty name', () => {
    const result = McpFunnelPreviewInputSchema.safeParse({
      timeRange: '7d',
      steps: [
        { name: '', column: 'url', operator: '=', values: ['/'] },
        { name: 'Pricing', column: 'url', operator: '=', values: ['/pricing'] },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('accepts custom time range with dates', () => {
    const result = McpFunnelPreviewInputSchema.safeParse({
      timeRange: 'custom',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      steps: validSteps,
      isStrict: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects custom time range without dates', () => {
    const result = McpFunnelPreviewInputSchema.safeParse({
      timeRange: 'custom',
      steps: validSteps,
    });
    expect(result.success).toBe(false);
  });
});
