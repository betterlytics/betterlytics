import {
  CreateSavedFilter,
  CreateSavedFilterSchema,
  SavedFilter,
  SavedFilterSchema,
} from '@/entities/analytics/savedFilters.entities';
import prisma from '@/lib/postgres';

export async function getSavedFiltersByDashboardId(dashboardId: string): Promise<SavedFilter[]> {
  const savedFilters = await prisma.savedFilter.findMany({
    where: { dashboardId, deletedAt: null },
    include: {
      entries: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return savedFilters.map((filter) => SavedFilterSchema.parse(filter));
}

export async function getSavedFilterById(id: string): Promise<SavedFilter | null> {
  const savedFilter = await prisma.savedFilter.findUnique({
    where: { id, deletedAt: null },
    include: {
      entries: true,
    },
  });
  if (savedFilter === null) {
    return null;
  }
  return SavedFilterSchema.parse(savedFilter);
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
    where: { id: filterId, dashboardId },
    data: {
      deletedAt: new Date(),
    },
  });
}
