'server-only';

import { type CreateSavedFilter, type SavedFilter } from '@/entities/analytics/savedFilters.entities';
import * as SavedFiltersRepository from '@/repositories/postgres/savedFilters.repository';

const MAX_SAVED_FILTERS = 10;

export async function getSavedFiltersForDashboard(dashboardId: string): Promise<SavedFilter[]> {
  return SavedFiltersRepository.getSavedFiltersByDashboardId(dashboardId);
}

export async function isSavedFiltersLimitReached(dashboardId: string): Promise<boolean> {
  const count = await SavedFiltersRepository.getSavedFiltersCountByDashboardId(dashboardId);
  return count >= MAX_SAVED_FILTERS;
}

export async function createSavedFilterForDashboard(filterData: CreateSavedFilter) {
  const limitReached = await isSavedFiltersLimitReached(filterData.dashboardId);
  if (limitReached) {
    throw new Error('Saved filters limit reached');
  }
  return SavedFiltersRepository.createSavedFilter(filterData);
}

export async function deleteSavedFilterFromDashboard(dashboardId: string, filterId: string): Promise<void> {
  return SavedFiltersRepository.deleteSavedFilterById(dashboardId, filterId);
}

export async function restoreSavedFilterFromDashboard(dashboardId: string, filterId: string): Promise<void> {
  return SavedFiltersRepository.restoreSavedFilterById(dashboardId, filterId);
}
