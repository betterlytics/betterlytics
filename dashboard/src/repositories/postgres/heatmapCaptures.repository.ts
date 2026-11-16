import prisma from '@/lib/postgres';
import {
  HEATMAP_CAPTURE_LINK_TTL_MS,
  MAX_UNUSED_HEATMAP_CAPTURE_LINKS,
  HeatmapCaptureLocationSchema,
  HeatmapCaptureSchema,
  type CreateHeatmapCaptureLinkInput,
  type HeatmapCapture,
  type HeatmapCaptureFilter,
  type HeatmapCaptureLocation,
} from '@/entities/analytics/heatmapCaptures.entities';

// Sweeps every expired link, plus this user's used and surplus links on the dashboard, so a
// user never holds more than a few live links per dashboard.
export async function createHeatmapCaptureLink(
  dashboardId: string,
  createdById: string,
  input: CreateHeatmapCaptureLinkInput,
  tokenHash: string,
): Promise<{ expiresAt: Date }> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + HEATMAP_CAPTURE_LINK_TTL_MS);

  await prisma.$transaction(async (tx) => {
    const kept = await tx.heatmapCaptureLink.findMany({
      where: { dashboardId, createdById, usedAt: null, expiresAt: { gt: now } },
      orderBy: { createdAt: 'desc' },
      take: MAX_UNUSED_HEATMAP_CAPTURE_LINKS - 1,
      select: { id: true },
    });
    await tx.heatmapCaptureLink.deleteMany({
      where: {
        OR: [
          { expiresAt: { lte: now } },
          { dashboardId, createdById, id: { notIn: kept.map((link) => link.id) } },
        ],
      },
    });
    await tx.heatmapCaptureLink.create({
      data: { tokenHash, dashboardId, createdById, path: input.path, device: input.device, expiresAt },
    });
  });

  return { expiresAt };
}

const captureSelect = {
  id: true,
  dashboardId: true,
  path: true,
  device: true,
  viewportWidth: true,
  documentHeight: true,
  sizeBytes: true,
  createdAt: true,
  createdById: true,
  createdBy: { select: { name: true } },
  capturedFromPath: true,
} as const;

export async function findHeatmapCaptures(
  dashboardId: string,
  filter: HeatmapCaptureFilter,
): Promise<HeatmapCapture[]> {
  const rows = await prisma.heatmapCapture.findMany({
    where: { dashboardId, path: filter.path, device: filter.device },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    select: captureSelect,
  });

  return rows.map(({ createdBy, ...row }) =>
    HeatmapCaptureSchema.parse({ ...row, createdByName: createdBy?.name ?? null }),
  );
}

export async function findHeatmapCaptureLocation(
  dashboardId: string,
  captureId: string,
): Promise<HeatmapCaptureLocation | null> {
  const row = await prisma.heatmapCapture.findFirst({
    where: { id: captureId, dashboardId },
    select: { storage: true, storageKey: true },
  });

  return row ? HeatmapCaptureLocationSchema.parse(row) : null;
}

export async function deleteHeatmapCaptureRow(dashboardId: string, captureId: string): Promise<void> {
  await prisma.heatmapCapture.deleteMany({ where: { id: captureId, dashboardId } });
}
