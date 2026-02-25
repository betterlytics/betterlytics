import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { validateToken } from '@/mcp/auth/token';
import { getSchemaDescription } from '@/mcp/tools/describe';
import { executeQuery } from '@/mcp/tools/query';
import { METRIC_KEYS } from '@/mcp/registry/metrics';
import { DIMENSION_KEYS } from '@/mcp/registry/dimensions';
import { FILTER_COLUMNS, FILTER_OPERATORS } from '@/entities/analytics/filter.entities';
import { MCP_TIME_RANGES, MCP_GRANULARITIES } from '@/mcp/query-builder/validation';

export function createMcpServer(token: string, timezone: string): McpServer {
  const server = new McpServer({
    name: 'betterlytics',
    version: '0.1.0',
  });

  server.registerTool(
    'betterlytics_describe',
    {
      description:
        'Returns available metrics, dimensions, filter columns, time ranges, and granularities. Call this first to understand what you can query.',
    },
    async () => {
      try {
        await validateToken(token);
        const schema = getSchemaDescription();
        return { content: [{ type: 'text', text: JSON.stringify(schema, null, 2) }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true };
      }
    },
  );

  server.registerTool(
    'betterlytics_query',
    {
      description:
        'Query analytics data with flexible metrics and dimensions. Use betterlytics_describe first to see available options.',
      inputSchema: {
        metrics: z
          .array(z.enum(METRIC_KEYS as [string, ...string[]]))
          .describe('Metrics to query, e.g. ["visitors", "pageviews"]'),
        dimensions: z
          .array(z.enum(DIMENSION_KEYS as [string, ...string[]]))
          .optional()
          .describe('Dimensions to group by, e.g. ["device_type"]'),
        filters: z
          .array(
            z.object({
              column: z.enum(FILTER_COLUMNS),
              operator: z.enum(FILTER_OPERATORS),
              values: z.array(z.string()),
            }),
          )
          .optional()
          .describe('Filters to apply'),
        timeRange: z.enum(MCP_TIME_RANGES).describe('Time range preset'),
        granularity: z
          .enum(MCP_GRANULARITIES)
          .optional()
          .describe('Time-series granularity. Omit for aggregate totals.'),
        orderBy: z.string().optional().describe('Metric to sort by. Defaults to first metric.'),
        order: z.enum(['asc', 'desc']).optional().describe('Sort direction. Defaults to desc.'),
        limit: z.number().optional().describe('Max rows to return. Defaults to 100.'),
      },
    },
    async (params) => {
      try {
        const { siteId } = await validateToken(token);
        const result = await executeQuery(params, siteId, timezone);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true };
      }
    },
  );

  return server;
}
