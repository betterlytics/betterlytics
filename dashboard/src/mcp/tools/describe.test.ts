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
    expect(result).toHaveProperty('customDateRange');
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

  it('includes referrer dimensions', () => {
    const { dimensions } = getSchemaDescription();
    expect(dimensions.some((d) => d.key === 'referrer_source')).toBe(true);
    expect(dimensions.some((d) => d.key === 'referrer_source_name')).toBe(true);
  });

  it('returns filter columns with key and description', () => {
    const { filterColumns } = getSchemaDescription();

    expect(filterColumns.length).toBeGreaterThan(0);
    for (const col of filterColumns) {
      expect(col).toHaveProperty('key');
      expect(col).toHaveProperty('description');
      expect(typeof col.key).toBe('string');
      expect(typeof col.description).toBe('string');
    }
  });

  it('does not include custom in the timeRanges list', () => {
    const { timeRanges } = getSchemaDescription();
    expect(timeRanges).not.toContain('custom');
  });

  it('documents custom date range with example', () => {
    const { customDateRange } = getSchemaDescription();
    expect(customDateRange).toHaveProperty('description');
    expect(customDateRange).toHaveProperty('example');
    expect(customDateRange.example.timeRange).toBe('custom');
    expect(customDateRange.example.startDate).toBeDefined();
    expect(customDateRange.example.endDate).toBeDefined();
  });

  it('includes tools section with user_journeys, funnel_preview, and list_funnels', () => {
    const result = getSchemaDescription();
    expect(result).toHaveProperty('tools');
    expect(result.tools).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'user_journeys' }),
        expect.objectContaining({ name: 'funnel_preview' }),
        expect.objectContaining({ name: 'list_funnels' }),
      ]),
    );
  });
});
