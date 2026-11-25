import { z } from 'zod';
import type { DashboardRole } from '@prisma/client';

export type McpDashboard = {
  dashboardId: string;
  siteId: string;
  domain: string;
  role: DashboardRole | null;
};

export type McpContext = {
  // Rate-limit key for calls that read no single dashboard when the credential covers several.
  credentialId: string;
  // Ordered like the dashboards page: newest membership first.
  dashboards: McpDashboard[];
  // Granted, but their owners or admins turned AI access off: named only so calls to them say why they fail.
  aiAccessDisabledDashboardIds: string[];
};

export const DASHBOARD_NOT_FOUND = 'Dashboard not found';
export const AI_ACCESS_DISABLED =
  "AI access to this dashboard is turned off by the dashboard's owners or admins, so no agent or token can read it. One of them can turn it back on under the dashboard's Settings > AI access.";
export const AI_ACCESS_DISABLED_ALL =
  "AI access is turned off by their owners or admins on every dashboard this connection can read. One of them can turn it back on under the dashboard's Settings > AI access.";
export const DASHBOARD_ID_REQUIRED =
  'This connection can read several dashboards, so pass dashboardId. Call list_dashboards to see their ids.';

export const DASHBOARD_ID_DESCRIPTION =
  'Id of the dashboard to read, as returned by list_dashboards (also the id in the dashboard URL). May be left out when the connection can read only one dashboard.';

export const DashboardIdInputSchema = z.string().optional().describe(DASHBOARD_ID_DESCRIPTION);

export function resolveDashboard(context: McpContext, dashboardId: string | undefined): McpDashboard {
  const disabled = context.aiAccessDisabledDashboardIds;
  if (dashboardId === undefined) {
    if (context.dashboards.length === 1) return context.dashboards[0]!;
    if (context.dashboards.length > 0) throw new Error(DASHBOARD_ID_REQUIRED);
    if (disabled.length === 0) throw new Error(DASHBOARD_NOT_FOUND);
    throw new Error(disabled.length === 1 ? AI_ACCESS_DISABLED : AI_ACCESS_DISABLED_ALL);
  }

  const dashboard = context.dashboards.find((d) => d.dashboardId === dashboardId);
  if (dashboard) return dashboard;
  throw new Error(disabled.includes(dashboardId) ? AI_ACCESS_DISABLED : DASHBOARD_NOT_FOUND);
}

export function listDashboards(context: McpContext) {
  return {
    dashboards: context.dashboards.map((d) => ({ id: d.dashboardId, domain: d.domain, role: d.role })),
  };
}
