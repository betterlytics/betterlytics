import type {
  StatusPageIncidentImpact,
  StatusPageIncidentStatusValue,
} from '@/entities/analytics/statusPage/statusPageIncident.entities';
import { INCIDENT_STATUS_TONE, type IncidentStatusTone } from './incidentStatusTone';

// Admin (dashboard-themed Tailwind) styling per incident tone/impact. The public page
// renders the same tones via its own --sp-* CSS variables (see IncidentCard/pillStyle).

export const STATUS_TONE_BADGE: Record<IncidentStatusTone, string> = {
  amber: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  orange: 'border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400',
  blue: 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400',
  green: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
};

export const STATUS_TONE_DOT: Record<IncidentStatusTone, string> = {
  amber: 'bg-amber-500',
  orange: 'bg-orange-500',
  blue: 'bg-sky-500',
  green: 'bg-emerald-500',
};

const STATUS_TONE_DOT_HOLLOW: Record<IncidentStatusTone, string> = {
  amber: 'bg-background border-2 border-amber-500',
  orange: 'bg-background border-2 border-orange-500',
  blue: 'bg-background border-2 border-sky-500',
  green: 'bg-background border-2 border-emerald-500',
};

const STATUS_TONE_TEXT: Record<IncidentStatusTone, string> = {
  amber: 'text-amber-600 dark:text-amber-400',
  orange: 'text-orange-600 dark:text-orange-400',
  blue: 'text-sky-600 dark:text-sky-400',
  green: 'text-emerald-600 dark:text-emerald-400',
};

export const statusBadgeClass = (status: StatusPageIncidentStatusValue) =>
  STATUS_TONE_BADGE[INCIDENT_STATUS_TONE[status]];

export const statusDotClass = (status: StatusPageIncidentStatusValue) => STATUS_TONE_DOT[INCIDENT_STATUS_TONE[status]];

export const statusDotHollowClass = (status: StatusPageIncidentStatusValue) =>
  STATUS_TONE_DOT_HOLLOW[INCIDENT_STATUS_TONE[status]];

export const statusTextClass = (status: StatusPageIncidentStatusValue) => STATUS_TONE_TEXT[INCIDENT_STATUS_TONE[status]];

export const IMPACT_BADGE: Record<StatusPageIncidentImpact, string> = {
  degraded: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  partial_outage: 'border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400',
  outage: 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400',
};

export const IMPACT_DOT: Record<StatusPageIncidentImpact, string> = {
  degraded: 'bg-amber-500',
  partial_outage: 'bg-orange-500',
  outage: 'bg-rose-500',
};

export const IMPACT_SELECTED: Record<StatusPageIncidentImpact, string> = {
  degraded: 'border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  partial_outage: 'border-orange-500/50 bg-orange-500/10 text-orange-600 dark:text-orange-400',
  outage: 'border-rose-500/50 bg-rose-500/10 text-rose-600 dark:text-rose-400',
};
