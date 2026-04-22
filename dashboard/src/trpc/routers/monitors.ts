import { z } from 'zod';
import { createRouter, dashboardProcedure } from '@/trpc/init';
import {
  getMonitorChecksWithStatus,
  getMonitorCheck,
  fetchMonitorMetrics,
  fetchRecentMonitorResults,
  fetchMonitorIncidentSegments,
  fetchLatestMonitorTlsResult,
  fetchMonitorDailyUptime,
} from '@/services/analytics/monitoring.service';
import { toMonitorUptimePresentation } from '@/presenters/toMonitorUptimeDays';
import { BATimeZone } from '@/entities/analytics/analyticsQuery.entities';

export const monitorsRouter = createRouter({
  list: dashboardProcedure.input(z.object({ timezone: BATimeZone })).query(async ({ ctx, input }) => {
    return await getMonitorChecksWithStatus(ctx.authContext.dashboardId, ctx.authContext.siteId, input.timezone);
  }),

  get: dashboardProcedure.input(z.object({ monitorId: z.string() })).query(async ({ ctx, input }) => {
    return await getMonitorCheck(ctx.authContext.dashboardId, input.monitorId);
  }),

  metrics: dashboardProcedure
    .input(z.object({ monitorId: z.string(), timezone: BATimeZone }))
    .query(async ({ ctx, input }) => {
      return await fetchMonitorMetrics(
        ctx.authContext.dashboardId,
        input.monitorId,
        ctx.authContext.siteId,
        input.timezone,
      );
    }),

  recentResults: dashboardProcedure
    .input(z.object({ monitorId: z.string(), errorsOnly: z.boolean() }))
    .query(async ({ ctx, input }) => {
      return await fetchRecentMonitorResults(input.monitorId, ctx.authContext.siteId, 10, input.errorsOnly);
    }),

  incidents: dashboardProcedure.input(z.object({ monitorId: z.string() })).query(async ({ ctx, input }) => {
    return await fetchMonitorIncidentSegments(input.monitorId, ctx.authContext.siteId);
  }),

  latestTls: dashboardProcedure.input(z.object({ monitorId: z.string() })).query(async ({ ctx, input }) => {
    return await fetchLatestMonitorTlsResult(input.monitorId, ctx.authContext.siteId);
  }),

  uptime: dashboardProcedure
    .input(z.object({ monitorId: z.string(), timezone: BATimeZone, days: z.number().optional().default(180) }))
    .query(async ({ ctx, input }) => {
      const rows = await fetchMonitorDailyUptime(
        input.monitorId,
        ctx.authContext.dashboardId,
        ctx.authContext.siteId,
        input.timezone,
        input.days,
      );
      return toMonitorUptimePresentation(rows, input.days);
    }),
});
