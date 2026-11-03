import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getSchemaDescription, type ToolAvailability } from '@/mcp/tools/describe';
import { executeQuery } from '@/mcp/tools/query';
import { executeQuerySessions } from '@/mcp/tools/querySessions';
import { McpQueryInputBaseSchema, McpQuerySessionsInputBaseSchema } from '@/mcp/entities/mcp.entities';
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
import {
  DashboardIdInputSchema,
  listDashboards,
  resolveDashboard,
  type McpContext,
  type McpDashboard,
} from '@/mcp/context';

const DASHBOARD_HINT =
  ' Reads one dashboard: pass its dashboardId from list_dashboards, which may be left out when the connection can read only one.';

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

function registerDashboardTool(
  server: McpServer,
  context: McpContext,
  toolName: string,
  config: { description: string; inputSchema: z.ZodRawShape },
  execute: (params: unknown, dashboard: McpDashboard) => Promise<unknown>,
) {
  server.registerTool(
    toolName,
    {
      description: config.description + DASHBOARD_HINT,
      inputSchema: { ...config.inputSchema, dashboardId: DashboardIdInputSchema },
    },
    ({ dashboardId, ...params }: { dashboardId?: string }) =>
      runTool(toolName, () => execute(params, resolveDashboard(context, dashboardId))),
  );
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
        'Returns available metrics, dimensions, filter columns, time ranges, and granularities. Call this first to understand what you can query. Every other tool except list_dashboards reads one dashboard, chosen with its dashboardId argument; call list_dashboards to see the dashboards you can read.',
    },
    () => runTool('describe', () => getSchemaDescription(available)),
  );

  server.registerTool(
    'list_dashboards',
    {
      description:
        "List the dashboards this connection can read, newest membership first, with each dashboard's id, domain and your role on it. Pass an id as dashboardId to any other tool to read that dashboard.",
    },
    () => runTool('list_dashboards', () => listDashboards(context)),
  );

  registerDashboardTool(
    server,
    context,
    'query',
    {
      description:
        'Query analytics data with flexible metrics and dimensions. Use describe first to see available options. For bounce rate, visit duration, pages per session, and landing or exit pages, use query_sessions.',
      inputSchema: McpQueryInputBaseSchema.shape,
    },
    (params, d) => executeQuery(params, d.siteId),
  );

  registerDashboardTool(
    server,
    context,
    'query_sessions',
    {
      description:
        'Query aggregate session analytics: sessions, visitors, pageviews, bounce rate, average visit duration, and pages per session, as totals or as an hourly or daily series, broken down by landing page (entry_page), exit page, device, geography, referrer, or UTM fields. Filters take the same columns as query plus entry_page and exit_page. Sessions are picked by when they started, and metrics always cover the whole session. A filter on url, event_type, custom_event_name, outbound_link_url, or cep.<key> keeps a session when any of its events in the range matches, and != drops the whole session. Breakdowns leave out sessions with an empty value for a requested dimension. Use describe first: its querySessions section lists the metrics with units and the dimensions.',
      inputSchema: McpQuerySessionsInputBaseSchema.shape,
    },
    (params, d) => executeQuerySessions(params, d.siteId),
  );

  registerDashboardTool(
    server,
    context,
    'user_journeys',
    {
      description:
        'Analyze user navigation paths through the site. Returns Sankey diagram data showing page-to-page transitions with traffic volumes. Use describe first to see available filter options.',
      inputSchema: McpUserJourneysInputBaseSchema.shape,
    },
    (params, d) => executeUserJourneys(params, d.siteId),
  );

  registerDashboardTool(
    server,
    context,
    'funnel_preview',
    {
      description:
        'Run an ad-hoc funnel analysis. Define ordered steps (each a filter condition like url = "/pricing") to see how many visitors progress through each step. Use describe first to see available filter columns.',
      inputSchema: McpFunnelPreviewInputBaseSchema.shape,
    },
    (params, d) => executeFunnelPreview(params, d.siteId),
  );

  registerDashboardTool(
    server,
    context,
    'list_global_properties',
    {
      description:
        'List the global properties recorded for the dashboard. Without a "key" argument it returns the property keys, each as a column in the gp.<key> form you can use directly in a filter, e.g. { column: "gp.plan", operator: "=", values: ["pro"] }. Pass a "key" argument to see example values for that specific property. Use this to discover which global properties are filterable.',
      inputSchema: McpListGlobalPropertiesInputBaseSchema.shape,
    },
    (params, d) => executeListGlobalProperties(params, d.siteId),
  );

  registerDashboardTool(
    server,
    context,
    'list_funnels',
    {
      description:
        'List all saved funnels for the dashboard and return their step-by-step conversion data for the given time range.',
      inputSchema: McpListFunnelsInputBaseSchema.shape,
    },
    (params, d) => executeListFunnels(params, d.siteId, d.dashboardId),
  );

  registerDashboardTool(
    server,
    context,
    'list_errors',
    {
      description:
        'List client-side JavaScript errors grouped by type. Returns error groups with occurrence counts, affected sessions, status, and first/last seen timestamps. Use this to identify the most impactful errors on the site.',
      inputSchema: McpListErrorsInputBaseSchema.shape,
    },
    (params, d) => executeListErrors(params, d.siteId, d.dashboardId),
  );

  registerDashboardTool(
    server,
    context,
    'get_error',
    {
      description:
        'Get detailed information about a specific error, including the full stack trace, browser/OS/device context, and the session trail of events leading up to the error. Use the fingerprint from list_errors, or ask the user to retrieve it from the error details page in the Betterlytics dashboard.',
      inputSchema: McpGetErrorInputBaseSchema.shape,
    },
    (params, d) => executeGetError(params, d.siteId),
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
  registerDashboardTool(
    server,
    context,
    'list_monitors',
    {
      description:
        'List the uptime monitors configured for the dashboard with their current operational state (up, down, degraded, preparing, paused), plus uptime percentage and response time summary over the given time range. Use timeRange "24h" to answer "is my site up right now".',
      inputSchema: McpListMonitorsInputBaseSchema.shape,
    },
    (params, d) => executeListMonitors(params, d.siteId, d.dashboardId),
  );

  registerDashboardTool(
    server,
    context,
    'list_monitor_incidents',
    {
      description:
        "List detected downtime incidents (ongoing and resolved) for the dashboard's uptime monitors, newest first, with severity, duration, and failure reason. Filterable by monitor and incident state. SSL certificate incidents are not included; cert health is reported per monitor by list_monitors.",
      inputSchema: McpListMonitorIncidentsInputBaseSchema.shape,
    },
    (params, d) => executeListMonitorIncidents(params, d.siteId, d.dashboardId),
  );
}

function registerStatusPageTools(server: McpServer, context: McpContext) {
  registerDashboardTool(
    server,
    context,
    'list_status_pages',
    {
      description:
        "List the dashboard's public status pages exactly as visitors currently see them: published state, public URL, derived overall status, each attached monitor with its public name, status and uptime, and the incidents shown on the page with their full update timelines.",
      inputSchema: McpListStatusPagesInputBaseSchema.shape,
    },
    (params, d) => executeListStatusPages(params, d.dashboardId),
  );

  registerDashboardTool(
    server,
    context,
    'list_incident_suggestions',
    {
      description:
        'List detected outages that are NOT covered by any incident posted on the status page. Use this to find out whether an ongoing outage is missing an incident, or whether a recent one was never documented. Each suggestion carries the detected incident id and the affected monitors. Every status page and every monitor attached to them is swept, so an empty result means nothing is uncovered. Only the last 90 days count, and a resolved outage stops being suggested 3 days after it recovered.',
      inputSchema: McpListIncidentSuggestionsInputBaseSchema.shape,
    },
    (params, d) => executeListIncidentSuggestions(params, d.dashboardId),
  );
}
