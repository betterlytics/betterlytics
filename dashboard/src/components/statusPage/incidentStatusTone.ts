import type { StatusPageIncidentStatusValue } from '@/entities/analytics/statusPage/statusPageIncident.entities';

export type IncidentStatusTone = 'amber' | 'orange' | 'blue' | 'green';

export const INCIDENT_STATUS_TONE: Record<StatusPageIncidentStatusValue, IncidentStatusTone> = {
  investigating: 'amber',
  identified: 'orange',
  monitoring: 'blue',
  resolved: 'green',
};
