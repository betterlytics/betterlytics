import { describe, it, expect } from 'vitest';
import { QueryResultSchema } from '@/lib/analytics-query/query.entities';

describe('QueryResultSchema', () => {
  it('accepts an array of row objects', () => {
    const rows = [
      { visitors: 100, device_type: 'desktop' },
      { visitors: 50, device_type: 'mobile' },
    ];
    const result = QueryResultSchema.safeParse(rows);
    expect(result.success).toBe(true);
  });

  it('accepts an empty array', () => {
    const result = QueryResultSchema.safeParse([]);
    expect(result.success).toBe(true);
  });

  it('rejects non-array input', () => {
    const result = QueryResultSchema.safeParse({ visitors: 100 });
    expect(result.success).toBe(false);
  });
});
