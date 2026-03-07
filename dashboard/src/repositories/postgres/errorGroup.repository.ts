import prisma from '@/lib/postgres';
import type { ErrorGroupStatusValue } from '@/entities/analytics/errors.entities';

export async function getTrackedErrorGroups(
  dashboardId: string,
  fingerprints: string[],
): Promise<Record<string, ErrorGroupStatusValue>> {
  if (fingerprints.length === 0) return {};

  const rows = await prisma.errorGroup.findMany({
    where: { dashboardId, errorFingerprint: { in: fingerprints } },
    select: { errorFingerprint: true, status: true },
  });

  return Object.fromEntries(rows.map((r) => [r.errorFingerprint, r.status as ErrorGroupStatusValue]));
}

export async function upsertErrorGroup(
  dashboardId: string,
  errorFingerprint: string,
  status: ErrorGroupStatusValue,
): Promise<void> {
  await prisma.errorGroup.upsert({
    where: { dashboardId_errorFingerprint: { dashboardId, errorFingerprint } },
    create: { dashboardId, errorFingerprint, status },
    update: { status },
  });
}

export async function bulkUpsertErrorGroup(
  dashboardId: string,
  fingerprints: string[],
  status: ErrorGroupStatusValue,
): Promise<void> {
  if (fingerprints.length === 0) return;

  await prisma.$transaction(
    fingerprints.map((errorFingerprint) =>
      prisma.errorGroup.upsert({
        where: { dashboardId_errorFingerprint: { dashboardId, errorFingerprint } },
        create: { dashboardId, errorFingerprint, status },
        update: { status },
      }),
    ),
  );
}
