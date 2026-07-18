import prisma from '@/lib/postgres';
import {
  StatusPageSchema,
  StatusPageMonitorRowSchema,
  type PublishedStatusPage,
  type StatusPage,
  type StatusPageCreate,
  type StatusPageImageKind,
  type StatusPageListItem,
  type StatusPageUpdate,
  type StatusPageWithMonitors,
} from '@/entities/analytics/statusPage/statusPage.entities';

/** URL of an uploaded image, served by the /status/{slug}/image/{kind} route handler (with the hash as a cache-bust token). */
function statusPageImageUrl(slug: string, kind: StatusPageImageKind, hash: string): string {
  return `/status/${slug}/image/${kind}?v=${hash}`;
}

function resolveLogoUrl(row: { slug: string; logoHash: string | null }): string | null {
  return row.logoHash ? statusPageImageUrl(row.slug, 'logo', row.logoHash) : null;
}

function resolveFaviconUrl(row: { slug: string; faviconHash: string | null }): string | null {
  if (row.faviconHash) return statusPageImageUrl(row.slug, 'favicon', row.faviconHash);
  return null;
}

function toStatusPage(
  row: { slug: string; logoHash: string | null; faviconHash: string | null } & Record<string, unknown>,
): StatusPage {
  return StatusPageSchema.parse({
    ...row,
    logoUrl: resolveLogoUrl(row),
    faviconUrl: resolveFaviconUrl(row),
  });
}

export type StatusPageImageWrite = { data: Buffer; mimeType: string; hash: string };

export type StatusPageImageWrites = {
  logo?: StatusPageImageWrite | null;
  favicon?: StatusPageImageWrite | null;
};

function imageChange(statusPageId: string, kind: StatusPageImageKind, write: StatusPageImageWrite | null | undefined) {
  if (write === undefined) return { data: {}, op: null };
  if (write === null) {
    const data = kind === 'logo' ? { logoHash: null } : { faviconHash: null };
    return { data, op: prisma.statusPageImage.deleteMany({ where: { statusPageId, kind } }) };
  }
  const data = kind === 'logo' ? { logoHash: write.hash } : { faviconHash: write.hash };
  return {
    data,
    op: prisma.statusPageImage.upsert({
      where: { statusPageId_kind: { statusPageId, kind } },
      create: { statusPageId, kind, data: write.data, mimeType: write.mimeType },
      update: { data: write.data, mimeType: write.mimeType },
    }),
  };
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
    ...toStatusPage(row),
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
    ...toStatusPage(page),
    monitors: monitors.map((monitor) => StatusPageMonitorRowSchema.parse(monitor)),
  };
}

export async function listStatusPageMonitorCheckIds(
  dashboardId: string,
  statusPageId: string,
): Promise<string[]> {
  const rows = await prisma.statusPageMonitor.findMany({
    where: { statusPageId, dashboardId },
    select: { monitorCheckId: true },
  });
  return rows.map((row) => row.monitorCheckId);
}

export async function statusPageSlugExists(slug: string, excludeStatusPageId?: string): Promise<boolean> {
  const row = await prisma.statusPage.findFirst({ where: { slug, deletedAt: null }, select: { id: true } });
  return row != null && row.id !== excludeStatusPageId;
}

export async function statusPageCustomDomainExists(
  domain: string,
  excludeStatusPageId?: string,
): Promise<boolean> {
  const row = await prisma.statusPage.findFirst({
    where: { customDomain: domain, deletedAt: null },
    select: { id: true },
  });
  return row != null && row.id !== excludeStatusPageId;
}

export async function countStatusPages(dashboardId: string): Promise<number> {
  return prisma.statusPage.count({ where: { dashboardId, deletedAt: null } });
}

export async function createStatusPage(
  dashboardId: string,
  data: StatusPageCreate,
  images?: StatusPageImageWrites,
): Promise<StatusPage> {
  const { monitors, ...page } = data;
  const imageRows = (['logo', 'favicon'] as const).flatMap((kind) =>
    images?.[kind] ? [{ kind, data: images[kind]!.data, mimeType: images[kind]!.mimeType }] : [],
  );
  const created = await prisma.statusPage.create({
    data: {
      dashboardId,
      ...page,
      ...(images?.logo ? { logoHash: images.logo.hash } : {}),
      ...(images?.favicon ? { faviconHash: images.favicon.hash } : {}),
      monitors: {
        // dashboardId is set by the parent relation (composite FK [statusPageId, dashboardId])
        create: monitors.map((monitor, position) => ({
          monitorCheckId: monitor.monitorCheckId,
          publicName: monitor.publicName,
          position,
        })),
      },
      ...(imageRows.length ? { images: { create: imageRows } } : {}),
    },
  });

  return toStatusPage(created);
}

export async function updateStatusPage(
  dashboardId: string,
  data: StatusPageUpdate,
  images?: StatusPageImageWrites,
): Promise<StatusPage> {
  const { id, monitors, ...page } = data;

  const logo = imageChange(id, 'logo', images?.logo);
  const favicon = imageChange(id, 'favicon', images?.favicon);

  const [updated] = await prisma.$transaction([
    prisma.statusPage.update({
      where: { id_dashboardId: { id, dashboardId } },
      data: { ...page, ...logo.data, ...favicon.data },
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
    ...[logo.op, favicon.op].filter((op) => op !== null),
  ]);

  return toStatusPage(updated);
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
  return toStatusPage(updated);
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
 * Read for the public image route handler — the ONLY query that loads the blob. Not gated on
 * isPublished so the editor's live preview can render draft pages' images; the slug uniquely
 * identifies a non-deleted page (partial unique index).
 */
export async function getStatusPageImageBySlug(
  slug: string,
  kind: StatusPageImageKind,
): Promise<{ data: Buffer; mimeType: string; hash: string | null } | null> {
  const image = await prisma.statusPageImage.findFirst({
    where: { kind, statusPage: { slug, deletedAt: null } },
    select: {
      data: true,
      mimeType: true,
      statusPage: { select: { logoHash: true, faviconHash: true } },
    },
  });
  if (!image) return null;
  const hash = kind === 'logo' ? image.statusPage.logoHash : image.statusPage.faviconHash;
  return { data: Buffer.from(image.data), mimeType: image.mimeType, hash };
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
    page: toStatusPage(page),
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
