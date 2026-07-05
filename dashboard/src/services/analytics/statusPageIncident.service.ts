import {
  applyStatusPageIncidentChanges,
  countStatusPageIncidents,
  countStatusPageIncidentUpdates,
  createStatusPageIncident,
  deleteStatusPageIncident,
  getStatusPageIncidentById,
  listLinkedDetectedIncidentIds,
  listStatusPageIncidents,
  listStatusPageIncidentUpdates,
} from '@/repositories/postgres/statusPageIncident.repository';
import {
  getStatusPageSnapshotById,
  listStatusPageMonitorCheckIds,
} from '@/repositories/postgres/statusPage.repository';
import { getDetectedOutagesForMonitors } from '@/repositories/clickhouse/monitoring.repository';
import { STATUS_PAGE_LIMITS } from '@/entities/analytics/statusPage/statusPage.entities';
import {
  type DetectedOutageMonitor,
  type DetectedOutageSuggestion,
  type IncidentWithSlug,
  type StatusPageIncident,
  type StatusPageIncidentBatchSave,
  type StatusPageIncidentCreate,
  type StatusPageIncidentImpact,
  type StatusPageIncidentTimelineEntry,
} from '@/entities/analytics/statusPage/statusPageIncident.entities';

export function getIncidentsForStatusPage(
  dashboardId: string,
  statusPageId: string,
): Promise<StatusPageIncident[]> {
  return listStatusPageIncidents(dashboardId, statusPageId);
}

export function getStatusPageIncident(
  dashboardId: string,
  statusPageId: string,
  incidentId: string,
): Promise<StatusPageIncident | null> {
  return getStatusPageIncidentById(dashboardId, statusPageId, incidentId);
}

export function addStatusPageIncident(
  dashboardId: string,
  createdById: string,
  data: StatusPageIncidentCreate,
): Promise<IncidentWithSlug> {
  return createStatusPageIncident(dashboardId, createdById, data);
}

export function saveStatusPageIncidentChanges(
  dashboardId: string,
  actorId: string | null,
  data: StatusPageIncidentBatchSave,
): Promise<IncidentWithSlug | null> {
  return applyStatusPageIncidentChanges(dashboardId, actorId, data);
}

export function countIncidentUpdates(incidentId: string): Promise<number> {
  return countStatusPageIncidentUpdates(incidentId);
}

export function getStatusPageIncidentTimeline(
  dashboardId: string,
  statusPageId: string,
  incidentId: string,
): Promise<StatusPageIncidentTimelineEntry[] | null> {
  return listStatusPageIncidentUpdates(dashboardId, statusPageId, incidentId);
}

export function removeStatusPageIncident(
  dashboardId: string,
  statusPageId: string,
  incidentId: string,
): Promise<string | null> {
  return deleteStatusPageIncident(dashboardId, statusPageId, incidentId);
}

export function countActiveStatusPageIncidents(dashboardId: string, statusPageId: string): Promise<number> {
  return countStatusPageIncidents(dashboardId, statusPageId);
}

export function getStatusPageMonitorCheckIds(dashboardId: string, statusPageId: string): Promise<string[]> {
  return listStatusPageMonitorCheckIds(dashboardId, statusPageId);
}

function severityToImpact(severity: string): StatusPageIncidentImpact {
  return severity === 'critical' ? 'outage' : 'degraded';
}

type SurvivingOutage = {
  detectedIncidentId: string;
  monitorCheckId: string;
  monitorPublicName: string;
  startedAt: string;
  startedAtMs: number;
  resolvedAt: string | null;
  ongoing: boolean;
  impact: StatusPageIncidentImpact;
};

// Fold a start-ascending cluster of outages into one suggestion: the earliest is the representative,
// monitors are deduped, impact is the worst, and the group is ongoing if any member still is.
function buildSuggestion(cluster: SurvivingOutage[]): DetectedOutageSuggestion {
  const monitors = new Map<string, DetectedOutageMonitor>();
  let ongoing = false;
  let impact: StatusPageIncidentImpact = 'degraded';
  let latestResolvedMs = -Infinity;
  let latestResolvedAt: string | null = null;

  for (const outage of cluster) {
    if (!monitors.has(outage.monitorCheckId)) {
      monitors.set(outage.monitorCheckId, {
        monitorCheckId: outage.monitorCheckId,
        monitorPublicName: outage.monitorPublicName,
      });
    }
    if (outage.ongoing) ongoing = true;
    if (outage.impact === 'outage') impact = 'outage';
    if (!outage.ongoing && outage.resolvedAt) {
      const ms = new Date(outage.resolvedAt).getTime();
      if (ms > latestResolvedMs) {
        latestResolvedMs = ms;
        latestResolvedAt = outage.resolvedAt;
      }
    }
  }

  return {
    detectedIncidentId: cluster[0].detectedIncidentId,
    monitors: [...monitors.values()],
    startedAt: cluster[0].startedAt,
    resolvedAt: ongoing ? null : latestResolvedAt,
    ongoing,
    suggestedImpact: impact,
  };
}

export async function getIncidentSuggestions(
  dashboardId: string,
  statusPageId: string,
): Promise<DetectedOutageSuggestion[]> {
  const snapshot = await getStatusPageSnapshotById(dashboardId, statusPageId);
  if (!snapshot) return [];

  const nameByCheckId = new Map(snapshot.monitors.map((monitor) => [monitor.monitorCheckId, monitor.publicName]));
  const checkIds = snapshot.monitors.map((monitor) => monitor.monitorCheckId);
  if (!checkIds.length) return [];

  const [detected, linkedIds, incidents] = await Promise.all([
    getDetectedOutagesForMonitors(
      checkIds,
      snapshot.siteId,
      STATUS_PAGE_LIMITS.UPTIME_WINDOW_DAYS,
      STATUS_PAGE_LIMITS.SUGGESTIONS_RESOLVED_MAX_AGE_DAYS,
      STATUS_PAGE_LIMITS.SUGGESTIONS_MAX * 3,
    ),
    listLinkedDetectedIncidentIds(dashboardId, statusPageId),
    listStatusPageIncidents(dashboardId, statusPageId),
  ]);
  const linked = new Set(linkedIds);

  const now = Date.now();
  const coveredByIncident = (outage: { monitorCheckId: string; startedAt: string; resolvedAt: string | null }) => {
    const start = new Date(outage.startedAt).getTime();
    const end = outage.resolvedAt ? new Date(outage.resolvedAt).getTime() : now;
    return incidents.some((incident) => {
      const covers =
        incident.monitorCheckIds.length === 0 || incident.monitorCheckIds.includes(outage.monitorCheckId);
      return covers && start <= (incident.resolvedAt?.getTime() ?? now) && end >= incident.startedAt.getTime();
    });
  };

  const survivors: SurvivingOutage[] = [];
  for (const outage of detected) {
    if (linked.has(outage.detectedIncidentId)) continue;
    const monitorPublicName = nameByCheckId.get(outage.monitorCheckId);
    if (monitorPublicName == null) continue;
    if (coveredByIncident(outage)) continue;
    survivors.push({
      detectedIncidentId: outage.detectedIncidentId,
      monitorCheckId: outage.monitorCheckId,
      monitorPublicName,
      startedAt: outage.startedAt,
      startedAtMs: new Date(outage.startedAt).getTime(),
      resolvedAt: outage.resolvedAt,
      ongoing: outage.ongoing,
      impact: severityToImpact(outage.severity),
    });
  }

  survivors.sort((a, b) => a.startedAtMs - b.startedAtMs);
  const windowMs = STATUS_PAGE_LIMITS.SUGGESTIONS_CORRELATION_WINDOW_MINUTES * 60_000;
  const groups: DetectedOutageSuggestion[] = [];
  let cluster: SurvivingOutage[] = [];
  for (const outage of survivors) {
    if (cluster.length && outage.startedAtMs - cluster[0].startedAtMs > windowMs) {
      groups.push(buildSuggestion(cluster));
      cluster = [];
    }
    cluster.push(outage);
  }
  if (cluster.length) groups.push(buildSuggestion(cluster));

  groups.sort((a, b) => {
    if (a.ongoing !== b.ongoing) return a.ongoing ? -1 : 1;
    return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
  });

  return groups.slice(0, STATUS_PAGE_LIMITS.SUGGESTIONS_MAX);
}
