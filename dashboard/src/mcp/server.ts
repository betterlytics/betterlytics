import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getSchemaDescription } from '@/mcp/tools/describe';
import { executeQuery } from '@/mcp/tools/query';
import { McpQueryInputBaseSchema } from '@/mcp/entities/mcp.entities';

export type McpContext = {
  siteId: string;
};

export function createMcpServer(context: McpContext): McpServer {
  const server = new McpServer({
    name: 'betterlytics',
    version: '0.1.0',
  });

  server.registerTool(
    'describe',
    {
      description:
        'Returns available metrics, dimensions, filter columns, time ranges, and granularities. Call this first to understand what you can query.',
    },
    async () => {
      try {
        const schema = getSchemaDescription();
        return { content: [{ type: 'text', text: JSON.stringify(schema, null, 2) }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true };
      }
    },
  );

  server.registerTool(
    'query',
    {
      description:
        'Query analytics data with flexible metrics and dimensions. Use describe first to see available options.',
      inputSchema: McpQueryInputBaseSchema.shape,
    },
    async (params) => {
      try {
        const result = await executeQuery(params, context.siteId, params.timezone);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true };
      }
    },
  );

  return server;
}
