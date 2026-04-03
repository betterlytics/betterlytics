import { describe, it, expect } from 'vitest';
import { getFilterColumnDescription } from '@/mcp/registry/filterColumns';
import { STATIC_FILTER_COLUMNS } from '@/entities/analytics/filter.entities';

describe('filterColumns registry', () => {
  it('returns a description for every filter column', () => {
    for (const column of STATIC_FILTER_COLUMNS) {
      const description = getFilterColumnDescription(column);
      expect(typeof description).toBe('string');
      expect(description.length).toBeGreaterThan(0);
    }
  });
});
