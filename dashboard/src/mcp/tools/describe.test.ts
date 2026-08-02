import { describe, it, expect } from 'vitest';
import { getSchemaDescription, type ToolAvailability } from '@/mcp/tools/describe';

const ALL_ENABLED: ToolAvailability = { uptimeMonitoring: true, publicStatusPages: true };

describe('getSchemaDescription', () => {
  it('returns all expected top-level keys', () => {
    const result = getSchemaDescription(ALL_ENABLED);

    expect(result).toHaveProperty('metrics');
    expect(result).toHaveProperty('dimensions');
    expect(result).toHaveProperty('filterColumns');
    expect(result).toHaveProperty('filterOperators');
    expect(result).toHaveProperty('timeRanges');
    expect(result).toHaveProperty('customDateRange');
    expect(result).toHaveProperty('granularities');
  });

  it('returns metrics with key and description', () => {
    const { metrics } = getSchemaDescription(ALL_ENABLED);

    expect(metrics.length).toBeGreaterThan(0);
    for (const metric of metrics) {
      expect(metric).toHaveProperty('key');
      expect(metric).toHaveProperty('description');
      expect(typeof metric.key).toBe('string');
      expect(typeof metric.description).toBe('string');
    }
  });

  it('includes the visitors metric', () => {
    const { metrics } = getSchemaDescription(ALL_ENABLED);
    expect(metrics.some((m) => m.key === 'visitors')).toBe(true);
  });

  it('includes the device_type dimension', () => {
    const { dimensions } = getSchemaDescription(ALL_ENABLED);
    expect(dimensions.some((d) => d.key === 'device_type')).toBe(true);
  });

  it('includes referrer dimensions', () => {
    const { dimensions } = getSchemaDescription(ALL_ENABLED);
    expect(dimensions.some((d) => d.key === 'referrer_source')).toBe(true);
    expect(dimensions.some((d) => d.key === 'referrer_source_name')).toBe(true);
  });

  it('returns filter columns with key and description', () => {
    const { filterColumns } = getSchemaDescription(ALL_ENABLED);

    expect(filterColumns.length).toBeGreaterThan(0);
    for (const col of filterColumns) {
      expect(col).toHaveProperty('key');
      expect(col).toHaveProperty('description');
      expect(typeof col.key).toBe('string');
      expect(typeof col.description).toBe('string');
    }
  });

  it('documents global properties and points to the list_global_properties tool', () => {
    const result = getSchemaDescription(ALL_ENABLED);
    expect(result).toHaveProperty('globalProperties');
    expect(result.globalProperties.description).toContain('gp.');
    expect(result.globalProperties.description).toContain('list_global_properties');
  });

  it('includes list_global_properties in the tools section', () => {
    const { tools } = getSchemaDescription(ALL_ENABLED);
    expect(tools).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'list_global_properties' })]));
  });

  it('does not include custom in the timeRanges list', () => {
    const { timeRanges } = getSchemaDescription(ALL_ENABLED);
    expect(timeRanges).not.toContain('custom');
  });

  it('documents custom date range with example', () => {
    const { customDateRange } = getSchemaDescription(ALL_ENABLED);
    expect(customDateRange).toHaveProperty('description');
    expect(customDateRange).toHaveProperty('example');
    expect(customDateRange.example.timeRange).toBe('custom');
    expect(customDateRange.example.startDate).toBeDefined();
    expect(customDateRange.example.endDate).toBeDefined();
  });

  it('includes the monitoring tools with their documented inputs', () => {
    const { tools } = getSchemaDescription(ALL_ENABLED);

    const monitors = tools.find((t) => t.name === 'list_monitors');
    expect(monitors?.inputs.map((i) => i.name)).toEqual(['timeRange', 'timezone']);

    const incidents = tools.find((t) => t.name === 'list_monitor_incidents');
    expect(incidents?.inputs.map((i) => i.name)).toEqual(['timeRange', 'timezone', 'monitorId', 'state', 'limit']);
  });

  it('includes the status page tools with their documented inputs', () => {
    const { tools } = getSchemaDescription(ALL_ENABLED);

    const pages = tools.find((t) => t.name === 'list_status_pages');
    expect(pages?.inputs.map((i) => i.name)).toEqual(['statusPageId']);

    const suggestions = tools.find((t) => t.name === 'list_incident_suggestions');
    expect(suggestions?.inputs.map((i) => i.name)).toEqual(['statusPageId']);
  });

  it('omits the optional tool groups when their deployment flags are off', () => {
    const { tools } = getSchemaDescription({ uptimeMonitoring: false, publicStatusPages: false });
    const names = tools.map((t) => t.name);

    expect(names).not.toContain('list_monitors');
    expect(names).not.toContain('list_monitor_incidents');
    expect(names).not.toContain('list_status_pages');
    expect(names).not.toContain('list_incident_suggestions');
    // The always-on tools are untouched.
    expect(names).toContain('query');
    expect(names).toContain('list_errors');
  });

  it('can advertise monitoring without status pages', () => {
    const { tools } = getSchemaDescription({ uptimeMonitoring: true, publicStatusPages: false });
    const names = tools.map((t) => t.name);

    expect(names).toContain('list_monitors');
    expect(names).not.toContain('list_status_pages');
  });

  it('includes tools section with user_journeys, funnel_preview, and list_funnels', () => {
    const result = getSchemaDescription(ALL_ENABLED);
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
