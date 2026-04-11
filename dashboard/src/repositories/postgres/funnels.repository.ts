import {
  CreateFunnel,
  CreateFunnelSchema,
  Funnel,
  FunnelSchema,
  UpdateFunnel,
} from '@/entities/analytics/funnels.entities';
import prisma from '@/lib/postgres';

const FUNNEL_STEPS_INCLUDE = {
  funnelSteps: {
    include: {
      filters: true,
    },
  },
} as const;

export async function getFunnelsByDashboardId(dashboardCUID: string): Promise<Funnel[]> {
  const funnels = await prisma.funnel.findMany({
    where: { dashboardId: dashboardCUID, deletedAt: null },
    include: FUNNEL_STEPS_INCLUDE,
    orderBy: {
      createdAt: 'desc',
    },
  });

  return funnels.map((funnel) => FunnelSchema.parse(funnel));
}

export async function getFunnelById(id: string): Promise<Funnel | null> {
  const funnel = await prisma.funnel.findUnique({
    where: { id, deletedAt: null },
    include: FUNNEL_STEPS_INCLUDE,
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
        create: funnelSteps.map((step) => ({
          name: step.name,
          filters: {
            create: step.filters,
          },
        })),
      },
    },
  });
}

export async function deleteFunnelById(dashboardId: string, funnelId: string): Promise<void> {
  await prisma.funnel.update({
    where: { id: funnelId, dashboardId },
    data: {
      deletedAt: new Date(),
    },
  });
}

export async function updateFunnel(funnel: UpdateFunnel): Promise<void> {
  await prisma.funnel.update({
    where: { id: funnel.id },
    data: {
      name: funnel.name,
      isStrict: funnel.isStrict,
      funnelSteps: {
        deleteMany: {},
        create: funnel.funnelSteps.map((step) => ({
          name: step.name,
          filters: {
            create: step.filters,
          },
        })),
      },
    },
  });
}
