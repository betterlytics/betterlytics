'use client';

import { useMutation } from '@tanstack/react-query';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import {
  createSavedFilterAction,
  deleteSavedFilterAction,
  restoreSavedFilterAction,
} from '@/app/actions/analytics/savedFilters.actions';
import { trpc } from '@/trpc/client';
import { type FilterColumn, type FilterOperator } from '@/entities/analytics/filter.entities';

type SavedFilterEntryInput = {
  column: FilterColumn;
  operator: FilterOperator;
  values: string[];
};

export function useSavedFilters() {
  const dashboardId = useDashboardId();
  return trpc.savedFilters.list.useQuery(
    { dashboardId },
    { staleTime: 5 * 60 * 1000, gcTime: 15 * 60 * 1000 },
  );
}

export function useSavedFiltersLimitReached() {
  const dashboardId = useDashboardId();
  return trpc.savedFilters.isLimitReached.useQuery(
    { dashboardId },
    { staleTime: 5 * 60 * 1000, gcTime: 15 * 60 * 1000 },
  );
}

export function useCreateSavedFilter() {
  const dashboardId = useDashboardId();
  const utils = trpc.useUtils();
  return useMutation({
    mutationFn: (data: { name: string; entries: SavedFilterEntryInput[] }) =>
      createSavedFilterAction(dashboardId, data.name, data.entries),
    onSuccess: () => {
      utils.savedFilters.list.invalidate({ dashboardId });
      utils.savedFilters.isLimitReached.invalidate({ dashboardId });
    },
  });
}

export function useDeleteSavedFilter() {
  const dashboardId = useDashboardId();
  const utils = trpc.useUtils();
  return useMutation({
    mutationFn: (filterId: string) => deleteSavedFilterAction(dashboardId, filterId),
    onSuccess: () => {
      utils.savedFilters.list.invalidate({ dashboardId });
      utils.savedFilters.isLimitReached.invalidate({ dashboardId });
    },
  });
}

export function useRestoreSavedFilter() {
  const dashboardId = useDashboardId();
  const utils = trpc.useUtils();
  return useMutation({
    mutationFn: (filterId: string) => restoreSavedFilterAction(dashboardId, filterId),
    onSuccess: () => {
      utils.savedFilters.list.invalidate({ dashboardId });
      utils.savedFilters.isLimitReached.invalidate({ dashboardId });
    },
  });
}
