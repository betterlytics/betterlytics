'server-only';

import { type CreateSavedFilter, type SavedFilter } from '@/entities/analytics/savedFilters.entities';
import * as SavedFiltersRepository from '@/repositories/postgres/savedFilters.repository';

export async function getSavedFiltersForDashboard(dashboardId: string): Promise<SavedFilter[]> {
  return SavedFiltersRepository.getSavedFiltersByDashboardId(dashboardId);
}

export async function createSavedFilterForDashboard(filterData: CreateSavedFilter) {
  return SavedFiltersRepository.createSavedFilter(filterData);
}

export async function deleteSavedFilterFromDashboard(dashboardId: string, filterId: string): Promise<void> {
  return SavedFiltersRepository.deleteSavedFilterById(dashboardId, filterId);
}
