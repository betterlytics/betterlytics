import { z } from 'zod';
import { McpDateRangeSchema, customDateRangeRefinement, dateOrderRefinement } from '@/mcp/entities/mcp.entities';
import { resolveTimeRange } from '@/mcp/utils/resolveTimeRange';
import { round } from '@/mcp/utils/round';
import {
  IncidentStateSchema,
  type MonitorIncidentWithMonitor,
  type MonitorRangeSummary,
} from '@/entities/analytics/monitoring.entities';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { getReasonTranslationKey, reasonCodeFallbackMessages } from '@/lib/monitorReasonCodes';
import { getMonitorIncidentsForRange, getMonitorSummariesForRange } from '@/services/analytics/monitoring.service';

function assertMonitoringEnabled() {
  if (!isFeatureEnabled('enableUptimeMonitoring')) {
    throw new Error('Uptime monitoring is not enabled on this Betterlytics deployment.');
  }
}

export const McpListMonitorsInputBaseSchema = McpDateRangeSchema;

export const McpListMonitorsInputSchema = McpListMonitorsInputBaseSchema.refine(
  customDateRangeRefinement.check,
  customDateRangeRefinement,
).refine(dateOrderRefinement.check, dateOrderRefinement);

function formatMonitor(summary: MonitorRangeSummary) {
  const { monitor, tls } = summary;

  return {
    id: monitor.id,
    name: monitor.name,
    url: monitor.url,
    enabled: monitor.isEnabled,
    operational_state: summary.operationalState,
    state_since: summary.currentStateSince,
    last_check_at: summary.lastCheckAt,
    last_status: summary.lastStatus,
    check_interval_seconds: monitor.intervalSeconds,
    effective_check_interval_seconds: summary.effectiveIntervalSeconds,
    backoff_level: summary.backoffLevel,
    uptime: {
      percent: round(summary.uptimePercent, 3),
      up_seconds: summary.uptimeSeconds,
      measured_seconds: summary.totalSeconds,
    },
    response_time_ms: {
      avg: round(summary.latency.avgMs, 1),
      min: round(summary.latency.minMs, 1),
      max: round(summary.latency.maxMs, 1),
    },
    ssl: tls
      ? {
          status: tls.status,
          expires_at: tls.tlsNotAfter,
          reason: tls.reasonCode,
          reason_description: reasonCodeFallbackMessages[getReasonTranslationKey(tls.reasonCode)],
          checked_at: tls.ts,
        }
      : null,
  };
}

export async function executeListMonitors(rawInput: unknown, siteId: string, dashboardId: string) {
  assertMonitoringEnabled();

  const input = McpListMonitorsInputSchema.parse(rawInput);
  const { start, end } = resolveTimeRange(input);

  const monitors = await getMonitorSummariesForRange(dashboardId, siteId, start, end);

  return {
    monitors: monitors.map(formatMonitor),
    total: monitors.length,
    time_range: { start: start.toISOString(), end: end.toISOString() },
  };
}

export const McpListMonitorIncidentsInputBaseSchema = McpDateRangeSchema.extend({
  monitorId: z
    .string()
    .optional()
    .describe('Only return incidents for this monitor. Use an id from list_monitors.'),
  state: IncidentStateSchema.optional().describe(
    'Only return incidents in this state: "ongoing" (still down) or "resolved". Omit for both.',
  ),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(20)
    .describe('Max number of incidents to return (1-100). Defaults to 20.'),
});

export const McpListMonitorIncidentsInputSchema = McpListMonitorIncidentsInputBaseSchema.refine(
  customDateRangeRefinement.check,
  customDateRangeRefinement,
).refine(dateOrderRefinement.check, dateOrderRefinement);

function formatIncident(incident: MonitorIncidentWithMonitor) {
  return {
    id: incident.incidentId,
    monitor_id: incident.monitor.id,
    monitor_name: incident.monitor.name,
    monitor_url: incident.monitor.url,
    state: incident.state,
    severity: incident.severity,
    reason: incident.reason,
    reason_description: reasonCodeFallbackMessages[getReasonTranslationKey(incident.reason)],
    started_at: incident.startedAt,
    resolved_at: incident.resolvedAt,
    duration_ms: incident.durationMs,
  };
}

export async function executeListMonitorIncidents(rawInput: unknown, siteId: string, dashboardId: string) {
  assertMonitoringEnabled();

  const input = McpListMonitorIncidentsInputSchema.parse(rawInput);
  const { start, end } = resolveTimeRange(input);

  const fetched = await getMonitorIncidentsForRange(dashboardId, siteId, {
    start,
    end,
    monitorId: input.monitorId,
    state: input.state,
    limit: input.limit + 1,
  });
  const incidents = fetched.slice(0, input.limit);

  return {
    incidents: incidents.map(formatIncident),
    count: incidents.length,
    truncated: fetched.length > input.limit,
    time_range: { start: start.toISOString(), end: end.toISOString() },
  };
}
