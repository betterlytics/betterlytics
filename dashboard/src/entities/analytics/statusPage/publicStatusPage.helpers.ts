import type {
  PublicMonitorStatus,
  PublicOverallStatus,
  PublicStatusPageIncident,
} from './publicStatusPage.entities';
import type {
  StatusPageIncident,
  StatusPageIncidentImpact,
  StatusPageIncidentTimelineEntry,
} from './statusPageIncident.entities';

const FAVICON_DOT_COLOR: Record<PublicOverallStatus, string> = {
  operational: '#10b981',
  degraded: '#d97706',
  partial_outage: '#ea580c',
  outage: '#dc2626',
  unknown: '#9ca3af',
};

export function statusDotFavicon(status: PublicOverallStatus): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="${FAVICON_DOT_COLOR[status]}"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function deriveOverallStatus(statuses: PublicMonitorStatus[]): PublicOverallStatus {
  const known = statuses.filter((status) => status !== 'unknown');
  if (known.length === 0) return 'unknown';

  const downCount = known.filter((status) => status === 'down').length;

  // only goes full-red when EVERYTHING is down; any mix of up + down is the milder "partial outage".
  if (downCount === known.length) return 'outage';
  if (downCount > 0) return 'partial_outage';
  if (known.includes('degraded')) return 'degraded';
  return 'operational';
}

// Severity ladders so an open incident can only ever ESCALATE the live status, never soften it.
// `unknown` sits below `operational` so any incident impact wins over a no-data monitor.
const MONITOR_STATUS_SEVERITY: Record<PublicMonitorStatus, number> = {
  unknown: -1,
  operational: 0,
  degraded: 1,
  down: 2,
};

const OVERALL_STATUS_SEVERITY: Record<PublicOverallStatus, number> = {
  unknown: -1,
  operational: 0,
  degraded: 1,
  partial_outage: 2,
  outage: 3,
};

const INCIDENT_IMPACT_SEVERITY: Record<StatusPageIncidentImpact, number> = {
  degraded: 0,
  partial_outage: 1,
  outage: 2,
};

function worstIncidentImpact(
  current: StatusPageIncidentImpact | undefined,
  next: StatusPageIncidentImpact,
): StatusPageIncidentImpact {
  if (current == null) return next;
  return INCIDENT_IMPACT_SEVERITY[next] > INCIDENT_IMPACT_SEVERITY[current] ? next : current;
}

function impactToMonitorStatus(impact: StatusPageIncidentImpact): PublicMonitorStatus {
  return impact === 'degraded' ? 'degraded' : 'down';
}

function escalateMonitorStatus(
  base: PublicMonitorStatus,
  impact: StatusPageIncidentImpact | undefined,
): PublicMonitorStatus {
  if (impact == null) return base;
  const fromImpact = impactToMonitorStatus(impact);
  return MONITOR_STATUS_SEVERITY[fromImpact] > MONITOR_STATUS_SEVERITY[base] ? fromImpact : base;
}

function escalateOverallStatus(
  base: PublicOverallStatus,
  impact: StatusPageIncidentImpact | undefined,
): PublicOverallStatus {
  if (impact == null) return base;
  const fromImpact = impact as PublicOverallStatus;
  return OVERALL_STATUS_SEVERITY[fromImpact] > OVERALL_STATUS_SEVERITY[base] ? fromImpact : base;
}

export type OpenIncidentRef = {
  impact: StatusPageIncidentImpact;
  monitorKey: string | null;
};

export function deriveStatusWithIncidents(
  monitors: Array<{ key: string; detected: PublicMonitorStatus }>,
  openIncidents: OpenIncidentRef[],
): { monitorStatuses: PublicMonitorStatus[]; overallStatus: PublicOverallStatus } {
  let pageWideImpact: StatusPageIncidentImpact | undefined;
  const impactByKey = new Map<string, StatusPageIncidentImpact>();
  for (const incident of openIncidents) {
    if (incident.monitorKey == null) {
      pageWideImpact = worstIncidentImpact(pageWideImpact, incident.impact);
    } else {
      impactByKey.set(
        incident.monitorKey,
        worstIncidentImpact(impactByKey.get(incident.monitorKey), incident.impact),
      );
    }
  }

  const onPageKeys = new Set(monitors.map((monitor) => monitor.key));
  const monitorStatuses = monitors.map((monitor) =>
    escalateMonitorStatus(monitor.detected, impactByKey.get(monitor.key)),
  );
  const ghostStatuses = [...impactByKey.entries()]
    .filter(([key]) => !onPageKeys.has(key))
    .map(([, impact]) => impactToMonitorStatus(impact));

  const single = monitors.length === 1;
  const rollup = deriveOverallStatus([
    ...(single ? monitors.map((monitor) => monitor.detected) : monitorStatuses),
    ...ghostStatuses,
  ]);
  const directImpact = single ? impactByKey.get(monitors[0].key) : undefined;
  const impact = directImpact == null ? pageWideImpact : worstIncidentImpact(pageWideImpact, directImpact);
  return { monitorStatuses, overallStatus: escalateOverallStatus(rollup, impact) };
}

export function deriveOverallUptime(uptimes: Array<number | null>): number | null {
  const known = uptimes.filter((uptime): uptime is number => uptime != null);
  if (!known.length) return null;
  return known.reduce((sum, uptime) => sum + uptime, 0) / known.length;
}

export function toPublicIncident(
  incident: StatusPageIncident,
  monitorPublicNames: string[],
  updates: StatusPageIncidentTimelineEntry[],
): PublicStatusPageIncident {
  return {
    title: incident.title,
    body: incident.body,
    impact: incident.impact,
    status: incident.status,
    monitorPublicNames,
    startedAt: incident.startedAt.toISOString(),
    resolvedAt: incident.resolvedAt ? incident.resolvedAt.toISOString() : null,
    updates: updates.map((entry) => ({
      status: entry.status,
      message: entry.message,
      createdAt: entry.createdAt.toISOString(),
    })),
  };
}
