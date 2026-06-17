import prisma from '@/lib/postgres';
import {
  StatusPageIncidentSchema,
  type IncidentWithSlug,
  type StatusPageIncident,
  type StatusPageIncidentCreate,
  type StatusPageIncidentUpdate,
} from '@/entities/analytics/statusPage.entities';

export async function listStatusPageIncidents(
  dashboardId: string,
  statusPageId: string,
): Promise<StatusPageIncident[]> {
  const rows = await prisma.statusPageIncident.findMany({
    where: { statusPageId, dashboardId, deletedAt: null },
    orderBy: { startedAt: 'desc' },
  });
  return rows.map((row) => StatusPageIncidentSchema.parse(row));
}

export async function getStatusPageIncidentById(
  dashboardId: string,
  statusPageId: string,
  incidentId: string,
): Promise<StatusPageIncident | null> {
  const row = await prisma.statusPageIncident.findFirst({
    where: { id: incidentId, statusPageId, dashboardId, deletedAt: null },
  });
  return row ? StatusPageIncidentSchema.parse(row) : null;
}

export async function countStatusPageIncidents(dashboardId: string, statusPageId: string): Promise<number> {
  return prisma.statusPageIncident.count({ where: { statusPageId, dashboardId, deletedAt: null } });
}

export async function countActiveIncidentsByStatusPage(dashboardId: string): Promise<Map<string, number>> {
  const grouped = await prisma.statusPageIncident.groupBy({
    by: ['statusPageId'],
    where: { dashboardId, deletedAt: null, status: { not: 'resolved' } },
    _count: { _all: true },
  });
  return new Map(grouped.map((row) => [row.statusPageId, row._count._all]));
}

export async function createStatusPageIncident(
  dashboardId: string,
  createdById: string,
  data: StatusPageIncidentCreate,
): Promise<IncidentWithSlug> {
  const { statusPageId, ...fields } = data;
  const created = await prisma.statusPageIncident.create({
    data: { statusPageId, dashboardId, createdById, ...fields },
    include: { statusPage: { select: { slug: true } } },
  });
  const { statusPage, ...incident } = created;
  return { incident: StatusPageIncidentSchema.parse(incident), slug: statusPage.slug };
}

export async function updateStatusPageIncident(
  dashboardId: string,
  data: StatusPageIncidentUpdate,
): Promise<IncidentWithSlug | null> {
  const { id, statusPageId, ...fields } = data;
  const existing = await prisma.statusPageIncident.findFirst({
    where: { id, statusPageId, dashboardId, deletedAt: null },
    select: { id: true, statusPage: { select: { slug: true } } },
  });
  if (!existing) return null;

  const updated = await prisma.statusPageIncident.update({ where: { id: existing.id }, data: fields });
  return { incident: StatusPageIncidentSchema.parse(updated), slug: existing.statusPage.slug };
}

export async function setStatusPageIncidentPublished(
  dashboardId: string,
  statusPageId: string,
  incidentId: string,
  isPublished: boolean,
): Promise<IncidentWithSlug | null> {
  const existing = await prisma.statusPageIncident.findFirst({
    where: { id: incidentId, statusPageId, dashboardId, deletedAt: null },
    select: { id: true, statusPage: { select: { slug: true } } },
  });
  if (!existing) return null;

  const updated = await prisma.statusPageIncident.update({ where: { id: existing.id }, data: { isPublished } });
  return { incident: StatusPageIncidentSchema.parse(updated), slug: existing.statusPage.slug };
}

export async function deleteStatusPageIncident(
  dashboardId: string,
  statusPageId: string,
  incidentId: string,
): Promise<string | null> {
  const existing = await prisma.statusPageIncident.findFirst({
    where: { id: incidentId, statusPageId, dashboardId, deletedAt: null },
    select: { id: true, statusPage: { select: { slug: true } } },
  });
  if (!existing) return null;

  await prisma.statusPageIncident.update({ where: { id: existing.id }, data: { deletedAt: new Date() } });
  return existing.statusPage.slug;
}

export async function listPublishedIncidents(statusPageId: string): Promise<StatusPageIncident[]> {
  const rows = await prisma.statusPageIncident.findMany({
    where: { statusPageId, isPublished: true, deletedAt: null },
    orderBy: { startedAt: 'desc' },
  });
  return rows.map((row) => StatusPageIncidentSchema.parse(row));
}

export async function listLinkedDetectedIncidentIds(
  dashboardId: string,
  statusPageId: string,
): Promise<string[]> {
  const rows = await prisma.statusPageIncident.findMany({
    where: { statusPageId, dashboardId, deletedAt: null, detectedIncidentId: { not: null } },
    select: { detectedIncidentId: true },
  });
  return rows.flatMap((row) => (row.detectedIncidentId ? [row.detectedIncidentId] : []));
}
