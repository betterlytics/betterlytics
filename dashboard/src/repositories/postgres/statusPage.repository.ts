import prisma from '@/lib/postgres';
import {
  StatusPageSchema,
  StatusPageMonitorRowSchema,
  type PublishedStatusPage,
  type StatusPage,
  type StatusPageCreate,
  type StatusPageListItem,
  type StatusPageUpdate,
  type StatusPageWithMonitors,
} from '@/entities/analytics/statusPage.entities';

/**
 * The app consumes a single `logoUrl` string. An uploaded logo is served by the
 * /status/{slug}/logo route handler; we derive that URL here (with the hash as a cache-bust
 * token) so callers never touch the blob. Falls back to the owner-pasted external URL.
 */
function resolveLogoUrl(row: { slug: string; logoHash: string | null; logoUrl: string | null }): string | null {
  if (row.logoHash) return `/status/${row.slug}/logo?v=${row.logoHash}`;
  return row.logoUrl ?? null;
}

export async function listStatusPages(
  dashboardId: string,
): Promise<Omit<StatusPageListItem, 'activeIncidentCount'>[]> {
  const rows = await prisma.statusPage.findMany({
    where: { dashboardId, deletedAt: null },
    include: {
      _count: { select: { monitors: true } },
      monitors: { orderBy: { position: 'asc' }, select: { monitorCheckId: true, publicName: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  return rows.map(({ _count, monitors, ...row }) => ({
    ...StatusPageSchema.parse({ ...row, logoUrl: resolveLogoUrl(row) }),
    monitorCount: _count.monitors,
    monitors: monitors,
  }));
}

export async function getStatusPageById(
  dashboardId: string,
  statusPageId: string,
): Promise<StatusPageWithMonitors | null> {
  const row = await prisma.statusPage.findFirst({
    where: { id: statusPageId, dashboardId, deletedAt: null },
    include: { monitors: { orderBy: { position: 'asc' } } },
  });
  if (!row) return null;

  const { monitors, ...page } = row;
  return {
    ...StatusPageSchema.parse({ ...page, logoUrl: resolveLogoUrl(page) }),
    monitors: monitors.map((monitor) => StatusPageMonitorRowSchema.parse(monitor)),
  };
}

export async function statusPageSlugExists(slug: string, excludeStatusPageId?: string): Promise<boolean> {
  const row = await prisma.statusPage.findFirst({ where: { slug, deletedAt: null }, select: { id: true } });
  return row != null && row.id !== excludeStatusPageId;
}

export async function countStatusPages(dashboardId: string): Promise<number> {
  return prisma.statusPage.count({ where: { dashboardId, deletedAt: null } });
}

export async function createStatusPage(dashboardId: string, data: StatusPageCreate): Promise<StatusPage> {
  const { monitors, ...page } = data;
  const created = await prisma.statusPage.create({
    data: {
      dashboardId,
      ...page,
      monitors: {
        // dashboardId is set by the parent relation (composite FK [statusPageId, dashboardId])
        create: monitors.map((monitor, position) => ({
          monitorCheckId: monitor.monitorCheckId,
          publicName: monitor.publicName,
          position,
        })),
      },
    },
  });

  return StatusPageSchema.parse(created);
}

export async function updateStatusPage(dashboardId: string, data: StatusPageUpdate): Promise<StatusPage> {
  const { id, monitors, ...page } = data;

  const [updated] = await prisma.$transaction([
    prisma.statusPage.update({
      where: { id_dashboardId: { id, dashboardId } },
      data: page,
    }),
    ...(monitors
      ? [
          prisma.statusPageMonitor.deleteMany({ where: { statusPageId: id, dashboardId } }),
          prisma.statusPageMonitor.createMany({
            data: monitors.map((monitor, position) => ({
              statusPageId: id,
              monitorCheckId: monitor.monitorCheckId,
              dashboardId,
              publicName: monitor.publicName,
              position,
            })),
          }),
        ]
      : []),
  ]);

  return StatusPageSchema.parse(updated);
}

export async function setStatusPagePublished(
  dashboardId: string,
  statusPageId: string,
  isPublished: boolean,
): Promise<StatusPage> {
  const updated = await prisma.statusPage.update({
    where: { id_dashboardId: { id: statusPageId, dashboardId } },
    data: { isPublished },
  });
  return StatusPageSchema.parse(updated);
}

export async function deleteStatusPage(dashboardId: string, statusPageId: string): Promise<void> {
  await prisma.statusPage.update({
    where: { id_dashboardId: { id: statusPageId, dashboardId } },
    data: { deletedAt: new Date() },
  });
}

export async function removeMonitorFromStatusPages(dashboardId: string, monitorCheckId: string): Promise<void> {
  await prisma.statusPageMonitor.deleteMany({ where: { dashboardId, monitorCheckId } });
}

/**
 * Store an uploaded logo and stamp its hash on the page, atomically. The page update is keyed by the
 * composite (id, dashboardId), so it throws if the page isn't owned by this dashboard — that ownership
 * check also guards the logo upsert in the same transaction. Returns the slug for cache revalidation.
 */
export async function setStatusPageLogo(
  dashboardId: string,
  statusPageId: string,
  logo: { data: Buffer; mimeType: string; hash: string },
): Promise<string> {
  const [page] = await prisma.$transaction([
    prisma.statusPage.update({
      where: { id_dashboardId: { id: statusPageId, dashboardId } },
      data: { logoHash: logo.hash, logoUrl: null },
      select: { slug: true },
    }),
    prisma.statusPageLogo.upsert({
      where: { statusPageId },
      create: { statusPageId, data: logo.data, mimeType: logo.mimeType },
      update: { data: logo.data, mimeType: logo.mimeType },
    }),
  ]);
  return page.slug;
}

export async function removeStatusPageLogo(dashboardId: string, statusPageId: string): Promise<string> {
  const [page] = await prisma.$transaction([
    prisma.statusPage.update({
      where: { id_dashboardId: { id: statusPageId, dashboardId } },
      data: { logoHash: null },
      select: { slug: true },
    }),
    prisma.statusPageLogo.deleteMany({ where: { statusPageId } }),
  ]);
  return page.slug;
}

/**
 * Read for the public logo route handler — the ONLY query that loads the blob. Not gated on
 * isPublished so the editor's live preview can render draft pages' logos; the slug uniquely
 * identifies a non-deleted page (partial unique index).
 */
export async function getStatusPageLogoBySlug(
  slug: string,
): Promise<{ data: Buffer; mimeType: string; hash: string | null } | null> {
  const logo = await prisma.statusPageLogo.findFirst({
    where: { statusPage: { slug, deletedAt: null } },
    select: { data: true, mimeType: true, statusPage: { select: { logoHash: true } } },
  });
  if (!logo) return null;
  return { data: Buffer.from(logo.data), mimeType: logo.mimeType, hash: logo.statusPage.logoHash };
}

const statusPageSnapshotInclude = {
  dashboard: { select: { siteId: true } },
  monitors: {
    orderBy: { position: 'asc' as const },
    where: { monitorCheck: { deletedAt: null } },
    include: { monitorCheck: { select: { isEnabled: true, createdAt: true } } },
  },
};

type StatusPageSnapshotRow = NonNullable<
  Awaited<ReturnType<typeof prisma.statusPage.findFirst<{ include: typeof statusPageSnapshotInclude }>>>
>;

function toPublishedStatusPage(row: StatusPageSnapshotRow): PublishedStatusPage {
  const { dashboard, monitors, ...page } = row;
  return {
    page: StatusPageSchema.parse({ ...page, logoUrl: resolveLogoUrl(page) }),
    siteId: dashboard.siteId,
    monitors: monitors.map((monitor) => ({
      monitorCheckId: monitor.monitorCheckId,
      publicName: monitor.publicName,
      position: monitor.position,
      isEnabled: monitor.monitorCheck.isEnabled,
      monitorCreatedAt: monitor.monitorCheck.createdAt,
    })),
  };
}

export async function getPublishedStatusPageBySlug(slug: string): Promise<PublishedStatusPage | null> {
  const row = await prisma.statusPage.findFirst({
    where: { slug, isPublished: true, deletedAt: null },
    include: statusPageSnapshotInclude,
  });
  return row ? toPublishedStatusPage(row) : null;
}

export async function getStatusPageSnapshotById(
  dashboardId: string,
  statusPageId: string,
): Promise<PublishedStatusPage | null> {
  const row = await prisma.statusPage.findFirst({
    where: { id: statusPageId, dashboardId, deletedAt: null },
    include: statusPageSnapshotInclude,
  });
  return row ? toPublishedStatusPage(row) : null;
}
