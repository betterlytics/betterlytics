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
};

export const DASHBOARD_NOT_FOUND = 'Dashboard not found';
export const DASHBOARD_ID_REQUIRED =
  'This connection can read several dashboards, so pass dashboardId. Call list_dashboards to see their ids.';

export const DASHBOARD_ID_DESCRIPTION =
  'Id of the dashboard to read, as returned by list_dashboards (also the id in the dashboard URL). May be left out when the connection can read only one dashboard.';

export const DashboardIdInputSchema = z.string().optional().describe(DASHBOARD_ID_DESCRIPTION);

export function resolveDashboard(context: McpContext, dashboardId: string | undefined): McpDashboard {
  if (dashboardId === undefined) {
    if (context.dashboards.length === 1) return context.dashboards[0]!;
    throw new Error(context.dashboards.length === 0 ? DASHBOARD_NOT_FOUND : DASHBOARD_ID_REQUIRED);
  }

  const dashboard = context.dashboards.find((d) => d.dashboardId === dashboardId);
  if (!dashboard) throw new Error(DASHBOARD_NOT_FOUND);
  return dashboard;
}

export function listDashboards(context: McpContext) {
  return {
    dashboards: context.dashboards.map((d) => ({ id: d.dashboardId, domain: d.domain, role: d.role })),
  };
}
