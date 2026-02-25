import { describe, it, expect } from 'vitest';
import { getSchemaDescription } from '@/mcp/tools/describe';

describe('getSchemaDescription', () => {
  it('returns all expected top-level keys', () => {
    const result = getSchemaDescription();

    expect(result).toHaveProperty('metrics');
    expect(result).toHaveProperty('dimensions');
    expect(result).toHaveProperty('filterColumns');
    expect(result).toHaveProperty('filterOperators');
    expect(result).toHaveProperty('timeRanges');
    expect(result).toHaveProperty('granularities');
  });

  it('returns metrics with key and description', () => {
    const { metrics } = getSchemaDescription();

    expect(metrics.length).toBeGreaterThan(0);
    for (const metric of metrics) {
      expect(metric).toHaveProperty('key');
      expect(metric).toHaveProperty('description');
      expect(typeof metric.key).toBe('string');
      expect(typeof metric.description).toBe('string');
    }
  });

  it('includes the visitors metric', () => {
    const { metrics } = getSchemaDescription();
    expect(metrics.some((m) => m.key === 'visitors')).toBe(true);
  });

  it('includes the device_type dimension', () => {
    const { dimensions } = getSchemaDescription();
    expect(dimensions.some((d) => d.key === 'device_type')).toBe(true);
  });
});
