import { z } from 'zod';
import { STATUS_PAGE_LIMITS } from './statusPage.entities';

export const StatusPageIncidentImpactSchema = z.enum(['degraded', 'partial_outage', 'outage']);
export type StatusPageIncidentImpact = z.infer<typeof StatusPageIncidentImpactSchema>;

export const StatusPageIncidentStatusSchema = z.enum(['investigating', 'identified', 'monitoring', 'resolved']);
export type StatusPageIncidentStatusValue = z.infer<typeof StatusPageIncidentStatusSchema>;

export const StatusPageIncidentSchema = z.object({
  id: z.string(),
  statusPageId: z.string(),
  title: z.string(),
  body: z.string(),
  description: z.string().nullable(),
  impact: StatusPageIncidentImpactSchema,
  status: StatusPageIncidentStatusSchema,
  startedAt: z.date(),
  resolvedAt: z.date().nullable(),
  // Affected monitors (display-only check ids); empty = unspecified, all selected = page-wide.
  monitorCheckIds: z.array(z.string()).default([]),
  detectedIncidentId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type StatusPageIncident = z.infer<typeof StatusPageIncidentSchema>;

export type IncidentWithSlug = { incident: StatusPageIncident; slug: string };

export const StatusPageIncidentTimelineEntrySchema = z.object({
  id: z.string(),
  incidentId: z.string(),
  status: StatusPageIncidentStatusSchema,
  message: z.string(),
  createdById: z.string().nullable(),
  createdAt: z.date(),
});
export type StatusPageIncidentTimelineEntry = z.infer<typeof StatusPageIncidentTimelineEntrySchema>;

export const PublishedIncidentTimelineEntrySchema = StatusPageIncidentTimelineEntrySchema.omit({
  id: true,
  createdById: true,
});
export type PublishedIncidentTimelineEntry = z.infer<typeof PublishedIncidentTimelineEntrySchema>;

const incidentTitle = z.string().trim().min(1).max(STATUS_PAGE_LIMITS.INCIDENT_TITLE_MAX);
const incidentDescription = z.string().trim().max(STATUS_PAGE_LIMITS.INCIDENT_DESCRIPTION_MAX);
const incidentMessage = z.string().trim().max(STATUS_PAGE_LIMITS.INCIDENT_UPDATE_MESSAGE_MAX);

const incidentUpdateInput = z.object({
  status: StatusPageIncidentStatusSchema,
  message: incidentMessage.default(''),
  occurredAt: z.coerce.date().optional(),
});

export const StatusPageIncidentCreateSchema = z.object({
  statusPageId: z.string().min(1),
  title: incidentTitle,
  description: incidentDescription.default(''),
  impact: StatusPageIncidentImpactSchema.default('outage'),
  updates: z
    .array(incidentUpdateInput)
    .min(1, 'An incident needs at least one timeline entry')
    .max(STATUS_PAGE_LIMITS.INCIDENT_UPDATES_MAX),
  monitorCheckIds: z.array(z.string().min(1)).default([]),
  detectedIncidentId: z.string().min(1).nullable().default(null),
});

export type StatusPageIncidentCreate = z.infer<typeof StatusPageIncidentCreateSchema>;

export const StatusPageIncidentBatchSaveSchema = z.object({
  incidentId: z.string().min(1),
  statusPageId: z.string().min(1),
  metadata: z
    .object({
      title: incidentTitle,
      description: incidentDescription.default(''),
      impact: StatusPageIncidentImpactSchema,
      monitorCheckIds: z.array(z.string().min(1)),
    })
    .optional(),
  editedUpdates: z
    .array(z.object({ updateId: z.string().min(1), message: incidentMessage.default('') }))
    .max(STATUS_PAGE_LIMITS.INCIDENT_UPDATES_MAX)
    .default([]),
  newUpdates: z.array(incidentUpdateInput).max(STATUS_PAGE_LIMITS.INCIDENT_UPDATES_MAX).default([]),
  deletedUpdateIds: z.array(z.string().min(1)).max(STATUS_PAGE_LIMITS.INCIDENT_UPDATES_MAX).default([]),
});
export type StatusPageIncidentBatchSave = z.infer<typeof StatusPageIncidentBatchSaveSchema>;

export type DetectedOutageMonitor = {
  monitorCheckId: string;
  monitorPublicName: string;
};

// A group of detected outages that started close enough together to be one real incident (shared
// root cause across monitors). Single-monitor outages are just groups of one.
export type DetectedOutageSuggestion = {
  /** Representative ClickHouse incident id (the earliest in the group) */
  detectedIncidentId: string;
  monitors: DetectedOutageMonitor[];
  /** Earliest start across the group. */
  startedAt: string;
  /** Latest resolve across the group, or null if any monitor is still down. */
  resolvedAt: string | null;
  /** True if any monitor in the group is still down. */
  ongoing: boolean;
  /** Worst impact across the group. */
  suggestedImpact: StatusPageIncidentImpact;
};
