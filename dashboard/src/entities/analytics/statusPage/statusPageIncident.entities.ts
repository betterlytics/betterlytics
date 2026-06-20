import { z } from 'zod';
import { STATUS_PAGE_LIMITS } from './statusPage.entities';

export const StatusPageIncidentImpactSchema = z.enum(['degraded', 'outage']);
export type StatusPageIncidentImpact = z.infer<typeof StatusPageIncidentImpactSchema>;

export const StatusPageIncidentStatusSchema = z.enum(['investigating', 'identified', 'monitoring', 'resolved']);
export type StatusPageIncidentStatusValue = z.infer<typeof StatusPageIncidentStatusSchema>;

export const StatusPageIncidentSchema = z.object({
  id: z.string(),
  statusPageId: z.string(),
  title: z.string(),
  body: z.string(),
  impact: StatusPageIncidentImpactSchema,
  status: StatusPageIncidentStatusSchema,
  startedAt: z.date(),
  resolvedAt: z.date().nullable(),
  isPublished: z.boolean(),
  monitorCheckId: z.string().nullable(),
  detectedIncidentId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type StatusPageIncident = z.infer<typeof StatusPageIncidentSchema>;

export type IncidentWithSlug = { incident: StatusPageIncident; slug: string };

const incidentTitle = z.string().trim().min(1).max(STATUS_PAGE_LIMITS.INCIDENT_TITLE_MAX);
const incidentBody = z.string().trim().min(1).max(STATUS_PAGE_LIMITS.INCIDENT_BODY_MAX);

export const StatusPageIncidentCreateSchema = z
  .object({
    statusPageId: z.string().min(1),
    title: incidentTitle,
    body: incidentBody,
    impact: StatusPageIncidentImpactSchema.default('outage'),
    status: StatusPageIncidentStatusSchema.default('investigating'),
    startedAt: z.coerce.date(),
    resolvedAt: z.coerce.date().nullable().default(null),
    monitorCheckId: z.string().min(1).nullable().default(null),
    detectedIncidentId: z.string().min(1).nullable().default(null),
    isPublished: z.boolean().default(false),
  })
  .refine((data) => data.resolvedAt == null || data.resolvedAt >= data.startedAt, {
    message: 'resolvedAt must be at or after startedAt',
    path: ['resolvedAt'],
  });

export type StatusPageIncidentCreate = z.infer<typeof StatusPageIncidentCreateSchema>;

export const StatusPageIncidentUpdateSchema = z.object({
  id: z.string().min(1),
  statusPageId: z.string().min(1),
  title: incidentTitle.optional(),
  body: incidentBody.optional(),
  impact: StatusPageIncidentImpactSchema.optional(),
  status: StatusPageIncidentStatusSchema.optional(),
  startedAt: z.coerce.date().optional(),
  resolvedAt: z.coerce.date().nullable().optional(),
  monitorCheckId: z.string().min(1).nullable().optional(),
  isPublished: z.boolean().optional(),
});
export type StatusPageIncidentUpdate = z.infer<typeof StatusPageIncidentUpdateSchema>;

export type DetectedOutageSuggestion = {
  /** ClickHouse incident id (analytics.monitor_incidents.incident_id). */
  detectedIncidentId: string;
  monitorCheckId: string;
  monitorPublicName: string;
  startedAt: string;
  resolvedAt: string | null;
  ongoing: boolean;
  reasonCode: string;
  suggestedImpact: StatusPageIncidentImpact;
};
