import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getSchemaDescription, type ToolAvailability } from '@/mcp/tools/describe';
import { executeQuery } from '@/mcp/tools/query';
import { McpQueryInputBaseSchema } from '@/mcp/entities/mcp.entities';
import { executeUserJourneys, McpUserJourneysInputBaseSchema } from '@/mcp/tools/userJourneys';
import { executeFunnelPreview, McpFunnelPreviewInputBaseSchema } from '@/mcp/tools/funnelPreview';
import { executeListFunnels, McpListFunnelsInputBaseSchema } from '@/mcp/tools/listFunnels';
import { executeListGlobalProperties, McpListGlobalPropertiesInputBaseSchema } from '@/mcp/tools/globalProperties';
import {
  executeListErrors,
  McpListErrorsInputBaseSchema,
  executeGetError,
  McpGetErrorInputBaseSchema,
} from '@/mcp/tools/errors';
import {
  executeListMonitors,
  McpListMonitorsInputBaseSchema,
  executeListMonitorIncidents,
  McpListMonitorIncidentsInputBaseSchema,
} from '@/mcp/tools/monitoring';
import {
  executeListStatusPages,
  McpListStatusPagesInputBaseSchema,
  executeListIncidentSuggestions,
  McpListIncidentSuggestionsInputBaseSchema,
} from '@/mcp/tools/statusPages';
import { mcpToolCallsTotal, mcpToolDurationSeconds } from '@/mcp/metrics';
import { isFeatureEnabled } from '@/lib/feature-flags';

export type McpContext = {
  siteId: string;
  dashboardId: string;
};

type ToolResult = {
  content: { type: 'text'; text: string }[];
  isError?: boolean;
};

async function runTool(toolName: string, fn: () => Promise<unknown> | unknown): Promise<ToolResult> {
  const endTimer = mcpToolDurationSeconds.startTimer({ tool: toolName });
  try {
    const result = await fn();
    endTimer({ status: 'ok' });
    mcpToolCallsTotal.inc({ tool: toolName, status: 'ok' });
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (error) {
    endTimer({ status: 'error' });
    mcpToolCallsTotal.inc({ tool: toolName, status: 'error' });
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true };
  }
}

export function createMcpServer(context: McpContext): McpServer {
  const server = new McpServer({
    name: 'betterlytics',
    version: '0.1.0',
  });

  const available: ToolAvailability = {
    uptimeMonitoring: isFeatureEnabled('enableUptimeMonitoring'),
    publicStatusPages: isFeatureEnabled('enablePublicStatusPages'),
  };

  server.registerTool(
    'describe',
    {
      description:
        'Returns available metrics, dimensions, filter columns, time ranges, and granularities. Call this first to understand what you can query.',
    },
    () => runTool('describe', () => getSchemaDescription(available)),
  );

  server.registerTool(
    'query',
    {
      description:
        'Query analytics data with flexible metrics and dimensions. Use describe first to see available options.',
      inputSchema: McpQueryInputBaseSchema.shape,
    },
    (params) => runTool('query', () => executeQuery(params, context.siteId)),
  );

  server.registerTool(
    'user_journeys',
    {
      description:
        'Analyze user navigation paths through the site. Returns Sankey diagram data showing page-to-page transitions with traffic volumes. Use describe first to see available filter options.',
      inputSchema: McpUserJourneysInputBaseSchema.shape,
    },
    (params) => runTool('user_journeys', () => executeUserJourneys(params, context.siteId)),
  );

  server.registerTool(
    'funnel_preview',
    {
      description:
        'Run an ad-hoc funnel analysis. Define ordered steps (each a filter condition like url = "/pricing") to see how many visitors progress through each step. Use describe first to see available filter columns.',
      inputSchema: McpFunnelPreviewInputBaseSchema.shape,
    },
    (params) => runTool('funnel_preview', () => executeFunnelPreview(params, context.siteId)),
  );

  server.registerTool(
    'list_global_properties',
    {
      description:
        'List the global properties recorded for this dashboard. Without a "key" argument it returns the property keys, each as a column in the gp.<key> form you can use directly in a filter, e.g. { column: "gp.plan", operator: "=", values: ["pro"] }. Pass a "key" argument to see example values for that specific property. Use this to discover which global properties are filterable.',
      inputSchema: McpListGlobalPropertiesInputBaseSchema.shape,
    },
    (params) => runTool('list_global_properties', () => executeListGlobalProperties(params, context.siteId)),
  );

  server.registerTool(
    'list_funnels',
    {
      description:
        'List all saved funnels for this site and return their step-by-step conversion data for the given time range.',
      inputSchema: McpListFunnelsInputBaseSchema.shape,
    },
    (params) => runTool('list_funnels', () => executeListFunnels(params, context.siteId, context.dashboardId)),
  );

  server.registerTool(
    'list_errors',
    {
      description:
        'List client-side JavaScript errors grouped by type. Returns error groups with occurrence counts, affected sessions, status, and first/last seen timestamps. Use this to identify the most impactful errors on the site.',
      inputSchema: McpListErrorsInputBaseSchema.shape,
    },
    (params) => runTool('list_errors', () => executeListErrors(params, context.siteId, context.dashboardId)),
  );

  server.registerTool(
    'get_error',
    {
      description:
        'Get detailed information about a specific error, including the full stack trace, browser/OS/device context, and the session trail of events leading up to the error. Use the fingerprint from list_errors, or ask the user to retrieve it from the error details page in the Betterlytics dashboard.',
      inputSchema: McpGetErrorInputBaseSchema.shape,
    },
    (params) => runTool('get_error', () => executeGetError(params, context.siteId)),
  );

  if (available.uptimeMonitoring) {
    registerMonitoringTools(server, context);
  }
  if (available.publicStatusPages) {
    registerStatusPageTools(server, context);
  }

  return server;
}

function registerMonitoringTools(server: McpServer, context: McpContext) {
  server.registerTool(
    'list_monitors',
    {
      description:
        'List the uptime monitors configured for this dashboard with their current operational state (up, down, degraded, preparing, paused), plus uptime percentage and response time summary over the given time range. Use timeRange "24h" to answer "is my site up right now".',
      inputSchema: McpListMonitorsInputBaseSchema.shape,
    },
    (params) => runTool('list_monitors', () => executeListMonitors(params, context.siteId, context.dashboardId)),
  );

  server.registerTool(
    'list_monitor_incidents',
    {
      description:
        "List detected downtime incidents (ongoing and resolved) for this dashboard's uptime monitors, newest first, with severity, duration, and failure reason. Filterable by monitor and incident state. SSL certificate incidents are not included; cert health is reported per monitor by list_monitors.",
      inputSchema: McpListMonitorIncidentsInputBaseSchema.shape,
    },
    (params) =>
      runTool('list_monitor_incidents', () =>
        executeListMonitorIncidents(params, context.siteId, context.dashboardId),
      ),
  );
}

function registerStatusPageTools(server: McpServer, context: McpContext) {
  server.registerTool(
    'list_status_pages',
    {
      description:
        "List this dashboard's public status pages exactly as visitors currently see them: published state, public URL, derived overall status, each attached monitor with its public name, status and uptime, and the incidents shown on the page with their full update timelines.",
      inputSchema: McpListStatusPagesInputBaseSchema.shape,
    },
    (params) => runTool('list_status_pages', () => executeListStatusPages(params, context.dashboardId)),
  );

  server.registerTool(
    'list_incident_suggestions',
    {
      description:
        'List detected outages that are NOT covered by any incident posted on the status page. Use this to find out whether an ongoing outage is missing an incident, or whether a recent one was never documented. Each suggestion carries the detected incident id and the affected monitors. Every status page and every monitor attached to them is swept, so an empty result means nothing is uncovered. Only the last 90 days count, and a resolved outage stops being suggested 3 days after it recovered.',
      inputSchema: McpListIncidentSuggestionsInputBaseSchema.shape,
    },
    (params) =>
      runTool('list_incident_suggestions', () => executeListIncidentSuggestions(params, context.dashboardId)),
  );
}
