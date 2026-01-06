import {
  CreateSavedFilter,
  CreateSavedFilterSchema,
  SavedFilter,
  SavedFilterSchema,
} from '@/entities/analytics/savedFilters.entities';
import prisma from '@/lib/postgres';

export async function getSavedFiltersByDashboardId(dashboardId: string): Promise<SavedFilter[]> {
  const savedFilters = await prisma.savedFilter.findMany({
    where: { dashboardId, deletedAt: null, dashboard: { deletedAt: null } },
    include: {
      entries: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return savedFilters.map((filter) => SavedFilterSchema.parse(filter));
}

export async function getSavedFiltersCountByDashboardId(dashboardId: string): Promise<number> {
  return prisma.savedFilter.count({
    where: { dashboardId, deletedAt: null, dashboard: { deletedAt: null } },
  });
}

export async function createSavedFilter(filterData: CreateSavedFilter) {
  const { entries, ...filterDataWithoutEntries } = CreateSavedFilterSchema.parse(filterData);

  return await prisma.savedFilter.create({
    data: {
      ...filterDataWithoutEntries,
      entries: {
        create: entries,
      },
    },
  });
}

export async function deleteSavedFilterById(dashboardId: string, filterId: string): Promise<void> {
  await prisma.savedFilter.update({
    where: { id: filterId, dashboardId, dashboard: { deletedAt: null } },
    data: {
      deletedAt: new Date(),
    },
  });
}

export async function restoreSavedFilterById(dashboardId: string, filterId: string): Promise<void> {
  await prisma.savedFilter.update({
    where: { id: filterId, dashboardId, dashboard: { deletedAt: null } },
    data: {
      deletedAt: null,
    },
  });
}
