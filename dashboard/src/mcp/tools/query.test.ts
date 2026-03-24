import { describe, it, expect } from 'vitest';
import { McpQueryResultSchema } from '@/mcp/entities/mcp.entities';

describe('McpQueryResultSchema', () => {
  it('accepts an array of row objects', () => {
    const rows = [
      { visitors: 100, device_type: 'desktop' },
      { visitors: 50, device_type: 'mobile' },
    ];
    const result = McpQueryResultSchema.safeParse(rows);
    expect(result.success).toBe(true);
  });

  it('accepts an empty array', () => {
    const result = McpQueryResultSchema.safeParse([]);
    expect(result.success).toBe(true);
  });

  it('rejects non-array input', () => {
    const result = McpQueryResultSchema.safeParse({ visitors: 100 });
    expect(result.success).toBe(false);
  });
});
