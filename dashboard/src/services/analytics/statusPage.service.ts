import {
  createStatusPage,
  deleteStatusPage,
  getStatusPageById,
  listStatusPages,
  removeStatusPageLogo,
  setStatusPageLogo,
  setStatusPagePublished,
  statusPageSlugExists,
  updateStatusPage,
} from '@/repositories/postgres/statusPage.repository';
import type {
  StatusPage,
  StatusPageCreate,
  StatusPageListItem,
  StatusPageUpdate,
  StatusPageWithMonitors,
} from '@/entities/analytics/statusPage.entities';

export async function getStatusPagesForDashboard(dashboardId: string): Promise<StatusPageListItem[]> {
  return listStatusPages(dashboardId);
}

export async function getStatusPage(dashboardId: string, statusPageId: string): Promise<StatusPageWithMonitors | null> {
  return getStatusPageById(dashboardId, statusPageId);
}

export async function addStatusPage(dashboardId: string, data: StatusPageCreate): Promise<StatusPage> {
  return createStatusPage(dashboardId, data);
}

export async function saveStatusPage(
  dashboardId: string,
  data: StatusPageUpdate,
): Promise<{ page: StatusPage; previousSlug: string } | null> {
  const existing = await getStatusPageById(dashboardId, data.id);
  if (!existing) return null;

  const page = await updateStatusPage(dashboardId, data);
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

export async function saveStatusPageLogo(
  dashboardId: string,
  statusPageId: string,
  logo: { data: Buffer; mimeType: string; hash: string },
): Promise<string> {
  return setStatusPageLogo(dashboardId, statusPageId, logo);
}

export async function clearStatusPageLogo(dashboardId: string, statusPageId: string): Promise<string> {
  return removeStatusPageLogo(dashboardId, statusPageId);
}
