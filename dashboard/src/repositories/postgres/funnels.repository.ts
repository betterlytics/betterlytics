import {
  CreateFunnel,
  CreateFunnelSchema,
  Funnel,
  FunnelSchema,
  UpdateFunnel,
} from '@/entities/analytics/funnels.entities';
import prisma from '@/lib/postgres';

export async function getFunnelsByDashboardId(dashboardCUID: string): Promise<Funnel[]> {
  const funnels = await prisma.funnel.findMany({
    where: { dashboardId: dashboardCUID, deletedAt: null, dashboard: { deletedAt: null } },
    include: {
      funnelSteps: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return funnels.map((funnel) => FunnelSchema.parse(funnel));
}

export async function getFunnelById(id: string): Promise<Funnel | null> {
  const funnel = await prisma.funnel.findUnique({
    where: { id, deletedAt: null, dashboard: { deletedAt: null } },
    include: {
      funnelSteps: true,
    },
  });
  if (funnel === null) {
    return null;
  }
  return FunnelSchema.parse(funnel);
}

export async function createFunnel(funnelData: CreateFunnel) {
  const { funnelSteps, ...funnelDataWithoutSteps } = CreateFunnelSchema.parse(funnelData);

  return await prisma.funnel.create({
    data: {
      ...funnelDataWithoutSteps,
      funnelSteps: {
        create: funnelSteps,
      },
    },
  });
}

export async function deleteFunnelById(dashboardId: string, funnelId: string): Promise<void> {
  await prisma.funnel.update({
    where: { id: funnelId, dashboardId, dashboard: { deletedAt: null } },
    data: {
      deletedAt: new Date(),
    },
  });
}

export async function updateFunnel(funnel: UpdateFunnel): Promise<void> {
  await prisma.funnel.update({
    where: { id: funnel.id, dashboard: { deletedAt: null } },
    data: {
      ...funnel,
      funnelSteps: {
        deleteMany: {},
        create: funnel.funnelSteps,
      },
    },
  });
}
