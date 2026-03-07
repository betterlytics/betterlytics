import { METRICS } from '@/mcp/registry/metrics';
import { DIMENSIONS } from '@/mcp/registry/dimensions';
import { FILTER_COLUMNS, FILTER_OPERATORS } from '@/entities/analytics/filter.entities';
import { getFilterColumnDescription } from '@/mcp/registry/filterColumns';
import { TIME_RANGE_VALUES } from '@/utils/timeRanges';
import { MCP_GRANULARITIES } from '@/mcp/entities/mcp.entities';

type SchemaDescription = {
  metrics: { key: string; description: string }[];
  dimensions: { key: string; description: string }[];
  filterColumns: { key: string; description: string }[];
  filterOperators: readonly string[];
  timeRanges: string[];
  customDateRange: { description: string; example: { timeRange: string; startDate: string; endDate: string } };
  granularities: readonly string[];
  tools: { name: string; description: string }[];
};

export function getSchemaDescription(): SchemaDescription {
  return {
    metrics: METRICS.map((m) => ({ key: m.key, description: m.description })),
    dimensions: DIMENSIONS.map((d) => ({ key: d.key, description: d.description })),
    filterColumns: FILTER_COLUMNS.map((col) => ({
      key: col,
      description: getFilterColumnDescription(col),
    })),
    filterOperators: FILTER_OPERATORS,
    timeRanges: TIME_RANGE_VALUES.filter((t) => t !== 'custom'),
    customDateRange: {
      description: 'Set timeRange to "custom" and provide startDate and endDate (YYYY-MM-DD) for arbitrary date ranges.',
      example: { timeRange: 'custom', startDate: '2026-01-01', endDate: '2026-01-31' },
    },
    granularities: MCP_GRANULARITIES,
    tools: [
      {
        name: 'user_journeys',
        description: 'Analyze user navigation paths. Returns Sankey diagram data (nodes + links) showing page-to-page transitions. Inputs: timeRange, filters (optional), maxSteps (default 3), limit (default 50, max number of top paths to return).',
      },
      {
        name: 'funnel_preview',
        description: 'Run ad-hoc funnel analysis. Define ordered steps (filter conditions) to see visitor dropoff. Inputs: timeRange, steps (min 2, each with name/column/operator/values), isStrict (default false).',
      },
      {
        name: 'list_funnels',
        description: 'List saved funnels for this site with conversion data. Inputs: timeRange.',
      },
    ],
  };
}
