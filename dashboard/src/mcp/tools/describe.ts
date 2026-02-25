import { METRICS } from '@/mcp/registry/metrics';
import { DIMENSIONS } from '@/mcp/registry/dimensions';
import { FILTER_COLUMNS } from '@/entities/analytics/filter.entities';
import { MCP_TIME_RANGES, MCP_GRANULARITIES } from '@/mcp/query-builder/validation';

export function getSchemaDescription() {
  return {
    metrics: METRICS.map((m) => ({ key: m.key, description: m.description })),
    dimensions: DIMENSIONS.map((d) => ({ key: d.key, description: d.description })),
    filterColumns: [...FILTER_COLUMNS],
    timeRanges: [...MCP_TIME_RANGES],
    granularities: [...MCP_GRANULARITIES],
  };
}
