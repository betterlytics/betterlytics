import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getSchemaDescription } from '@/mcp/tools/describe';
import { executeQuery } from '@/mcp/tools/query';
import { McpQueryInputBaseSchema } from '@/mcp/entities/mcp.entities';
import { executeUserJourneys, McpUserJourneysInputBaseSchema } from '@/mcp/tools/userJourneys';
import { executeFunnelPreview, McpFunnelPreviewInputBaseSchema } from '@/mcp/tools/funnelPreview';
import { executeListFunnels, McpListFunnelsInputBaseSchema } from '@/mcp/tools/listFunnels';
import {
  executeListErrors,
  McpListErrorsInputBaseSchema,
  executeGetError,
  McpGetErrorInputBaseSchema,
} from '@/mcp/tools/errors';

export type McpContext = {
  siteId: string;
  dashboardId: string;
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
        const result = await executeQuery(params, context.siteId);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true };
      }
    },
  );

  server.registerTool(
    'user_journeys',
    {
      description:
        'Analyze user navigation paths through the site. Returns Sankey diagram data showing page-to-page transitions with traffic volumes. Use describe first to see available filter options.',
      inputSchema: McpUserJourneysInputBaseSchema.shape,
    },
    async (params) => {
      try {
        const result = await executeUserJourneys(params, context.siteId);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true };
      }
    },
  );

  server.registerTool(
    'funnel_preview',
    {
      description:
        'Run an ad-hoc funnel analysis. Define ordered steps (each a filter condition like url = "/pricing") to see how many visitors progress through each step. Use describe first to see available filter columns.',
      inputSchema: McpFunnelPreviewInputBaseSchema.shape,
    },
    async (params) => {
      try {
        const result = await executeFunnelPreview(params, context.siteId);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true };
      }
    },
  );

  server.registerTool(
    'list_funnels',
    {
      description:
        'List all saved funnels for this site and return their step-by-step conversion data for the given time range.',
      inputSchema: McpListFunnelsInputBaseSchema.shape,
    },
    async (params) => {
      try {
        const result = await executeListFunnels(params, context.siteId, context.dashboardId);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true };
      }
    },
  );

  server.registerTool(
    'list_errors',
    {
      description:
        'List client-side JavaScript errors grouped by type. Returns error groups with occurrence counts, affected sessions, status, and first/last seen timestamps. Use this to identify the most impactful errors on the site.',
      inputSchema: McpListErrorsInputBaseSchema.shape,
    },
    async (params) => {
      try {
        const result = await executeListErrors(params, context.siteId, context.dashboardId);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true };
      }
    },
  );

  server.registerTool(
    'get_error',
    {
      description:
        'Get detailed information about a specific error, including the full stack trace, browser/OS/device context, and the session trail of events leading up to the error. Use the fingerprint from list_errors, or ask the user to retrieve it from the error details page in the Betterlytics dashboard.',
      inputSchema: McpGetErrorInputBaseSchema.shape,
    },
    async (params) => {
      try {
        const result = await executeGetError(params, context.siteId);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true };
      }
    },
  );

  return server;
}
