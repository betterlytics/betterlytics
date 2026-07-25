import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/repositories/clickhouse/globalProperties.repository', () => ({
  getTopGlobalPropertyKeys: vi.fn(),
  getTopGlobalPropertyValuesForKeys: vi.fn(),
}));

import {
  getTopGlobalPropertyKeys,
  getTopGlobalPropertyValuesForKeys,
} from '@/repositories/clickhouse/globalProperties.repository';
import {
  McpListGlobalPropertiesInputSchema,
  executeListGlobalProperties,
} from '@/mcp/tools/globalProperties';

const getKeys = vi.mocked(getTopGlobalPropertyKeys);
const getValues = vi.mocked(getTopGlobalPropertyValuesForKeys);

describe('McpListGlobalPropertiesInputSchema', () => {
  it('accepts valid input with just a time range', () => {
    expect(McpListGlobalPropertiesInputSchema.safeParse({ timeRange: '7d' }).success).toBe(true);
  });

  it('accepts an optional key argument', () => {
    expect(McpListGlobalPropertiesInputSchema.safeParse({ timeRange: '7d', key: 'gp.plan' }).success).toBe(true);
  });

  it('rejects custom time range without dates', () => {
    expect(McpListGlobalPropertiesInputSchema.safeParse({ timeRange: 'custom' }).success).toBe(false);
  });
});

describe('executeListGlobalProperties', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists keys rendered in gp.<key> form when no key is given', async () => {
    getKeys.mockResolvedValue([
      { property_key: 'plan', visitors: 100 },
      { property_key: 'user_type', visitors: 50 },
    ]);

    const result = await executeListGlobalProperties({ timeRange: '7d' }, 'site-1');

    expect(getKeys).toHaveBeenCalledOnce();
    expect(getValues).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      keys: ['gp.plan', 'gp.user_type'],
      truncated: false,
    });
  });

  it('returns example values for a specific key, stripping an existing gp. prefix', async () => {
    getValues.mockResolvedValue([
      { property_key: 'plan', value: 'pro', visitors: 80 },
      { property_key: 'plan', value: 'free', visitors: 20 },
    ]);

    const result = await executeListGlobalProperties({ timeRange: '7d', key: 'gp.plan' }, 'site-1');

    expect(getValues).toHaveBeenCalledOnce();
    expect(getValues.mock.calls[0][1]).toEqual(['plan']);
    expect(getKeys).not.toHaveBeenCalled();
    expect(result).toEqual({
      column: 'gp.plan',
      values: ['pro', 'free'],
      truncated: false,
    });
  });

  it('reports truncation when the values response hits the limit', async () => {
    getValues.mockResolvedValue(
      Array.from({ length: 20 }, (_, i) => ({ property_key: 'plan', value: `value-${i}`, visitors: 20 - i })),
    );

    const result = await executeListGlobalProperties({ timeRange: '7d', key: 'gp.plan' }, 'site-1');

    expect(result).toMatchObject({ truncated: true });
  });

  it('accepts a key without the gp. prefix', async () => {
    getValues.mockResolvedValue([]);

    await executeListGlobalProperties({ timeRange: '7d', key: 'plan' }, 'site-1');

    expect(getValues.mock.calls[0][1]).toEqual(['plan']);
  });
});
