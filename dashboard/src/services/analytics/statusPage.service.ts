import {
  countStatusPages,
  createStatusPage,
  deleteStatusPage,
  getStatusPageById,
  getStatusPageSnapshotById,
  listStatusPages,
  setStatusPagePublished,
  statusPageCustomDomainExists,
  statusPageSlugExists,
  updateStatusPage,
  type StatusPageImageWrites,
} from '@/repositories/postgres/statusPage.repository';

export type { StatusPageImageWrites } from '@/repositories/postgres/statusPage.repository';
import { countActiveIncidentsByStatusPage } from '@/repositories/postgres/statusPageIncident.repository';
import { listMonitorChecks } from '@/repositories/postgres/monitoring.repository';
import { findDashboardById } from '@/repositories/postgres/dashboard.repository';
import { assembleStatusPagePreview } from '@/services/analytics/publicStatusPage.service';
import type {
  StatusPage,
  StatusPageCreate,
  StatusPageListItem,
  StatusPageUpdate,
  StatusPageWithMonitors,
} from '@/entities/analytics/statusPage/statusPage.entities';

export async function getStatusPagesForDashboard(dashboardId: string): Promise<StatusPageListItem[]> {
  const [pages, activeIncidentsByPage] = await Promise.all([
    listStatusPages(dashboardId),
    countActiveIncidentsByStatusPage(dashboardId),
  ]);

  return pages.map((page) => ({
    ...page,
    activeIncidentCount: activeIncidentsByPage.get(page.id) ?? 0,
  }));
}

export async function getStatusPage(
  dashboardId: string,
  statusPageId: string,
): Promise<StatusPageWithMonitors | null> {
  return getStatusPageById(dashboardId, statusPageId);
}

export async function getStatusPageEditorData(dashboardId: string, statusPageId: string) {
  const [statusPage, snapshot, allMonitors, dashboard] = await Promise.all([
    getStatusPageById(dashboardId, statusPageId),
    getStatusPageSnapshotById(dashboardId, statusPageId),
    listMonitorChecks(dashboardId),
    findDashboardById(dashboardId),
  ]);
  if (!statusPage || !snapshot) return null;

  return {
    statusPage,
    monitors: allMonitors.map((monitor) => ({ id: monitor.id, name: monitor.name ?? null, url: monitor.url })),
    previewPayload: await assembleStatusPagePreview(snapshot, allMonitors),
    dashboardDomain: dashboard.domain,
  };
}

export async function countStatusPagesForDashboard(dashboardId: string): Promise<number> {
  return countStatusPages(dashboardId);
}

export async function addStatusPage(
  dashboardId: string,
  data: StatusPageCreate,
  images?: StatusPageImageWrites,
): Promise<StatusPage> {
  return createStatusPage(dashboardId, data, images);
}

export async function saveStatusPage(
  dashboardId: string,
  data: StatusPageUpdate,
  images?: StatusPageImageWrites,
): Promise<{ page: StatusPage; previousSlug: string } | null> {
  const existing = await getStatusPageById(dashboardId, data.id);
  if (!existing) return null;

  const page = await updateStatusPage(dashboardId, data, images);
  return { page, previousSlug: existing.slug };
}

export async function publishStatusPage(
  dashboardId: string,
  statusPageId: string,
  isPublished: boolean,
): Promise<StatusPage> {
  return setStatusPagePublished(dashboardId, statusPageId, isPublished);
}

export async function removeStatusPage(dashboardId: string, statusPageId: string): Promise<string | null> {
  const existing = await getStatusPageById(dashboardId, statusPageId);
  if (!existing) return null;

  await deleteStatusPage(dashboardId, statusPageId);
  return existing.slug;
}

export async function isStatusPageSlugAvailable(slug: string, excludeStatusPageId?: string): Promise<boolean> {
  return !(await statusPageSlugExists(slug, excludeStatusPageId));
}

export async function isStatusPageCustomDomainAvailable(
  domain: string,
  excludeStatusPageId?: string,
): Promise<boolean> {
  return !(await statusPageCustomDomainExists(domain, excludeStatusPageId));
}
