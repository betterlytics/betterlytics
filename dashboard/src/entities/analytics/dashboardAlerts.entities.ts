import { z } from 'zod';

export const DownMonitorAlertSchema = z.object({
  monitorId: z.string(),
  incidentId: z.string(),
});
export type DownMonitorAlert = z.infer<typeof DownMonitorAlertSchema>;

export const UnresolvedStatusPageIncidentSchema = z.object({
  incidentId: z.string(),
});
export type UnresolvedStatusPageIncident = z.infer<typeof UnresolvedStatusPageIncidentSchema>;

export const DashboardAlertsSchema = z.object({
  downMonitors: z.array(DownMonitorAlertSchema),
  statusPageIncidents: z.array(UnresolvedStatusPageIncidentSchema),
});
export type DashboardAlerts = z.infer<typeof DashboardAlertsSchema>;
