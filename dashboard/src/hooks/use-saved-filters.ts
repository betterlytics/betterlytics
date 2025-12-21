'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import {
  fetchSavedFiltersAction,
  createSavedFilterAction,
  deleteSavedFilterAction,
  restoreSavedFilterAction,
  isSavedFiltersLimitReachedAction,
} from '@/app/actions/analytics/savedFilters.actions';
import { type FilterColumn, type FilterOperator } from '@/entities/analytics/filter.entities';
import { type SavedFilter } from '@/entities/analytics/savedFilters.entities';

type SavedFilterEntryInput = {
  column: FilterColumn;
  operator: FilterOperator;
  value: string;
};

export function useSavedFilters() {
  const dashboardId = useDashboardId();
  return useQuery<SavedFilter[]>({
    queryKey: ['saved-filters', dashboardId],
    queryFn: () => fetchSavedFiltersAction(dashboardId),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

export function useSavedFiltersLimitReached() {
  const dashboardId = useDashboardId();
  return useQuery<boolean>({
    queryKey: ['saved-filters-limit', dashboardId],
    queryFn: () => isSavedFiltersLimitReachedAction(dashboardId),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

export function useCreateSavedFilter() {
  const dashboardId = useDashboardId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; entries: SavedFilterEntryInput[] }) =>
      createSavedFilterAction(dashboardId, data.name, data.entries),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-filters', dashboardId] });
      queryClient.invalidateQueries({ queryKey: ['saved-filters-limit', dashboardId] });
    },
  });
}

export function useDeleteSavedFilter() {
  const dashboardId = useDashboardId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (filterId: string) => deleteSavedFilterAction(dashboardId, filterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-filters', dashboardId] });
      queryClient.invalidateQueries({ queryKey: ['saved-filters-limit', dashboardId] });
    },
  });
}

export function useRestoreSavedFilter() {
  const dashboardId = useDashboardId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (filterId: string) => restoreSavedFilterAction(dashboardId, filterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-filters', dashboardId] });
      queryClient.invalidateQueries({ queryKey: ['saved-filters-limit', dashboardId] });
    },
  });
}
