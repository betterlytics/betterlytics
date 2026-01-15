'use server';

import { CreateSavedFilterSchema } from '@/entities/analytics/savedFilters.entities';
import {
  getSavedFiltersForDashboard,
  createSavedFilterForDashboard,
  deleteSavedFilterFromDashboard,
  restoreSavedFilterFromDashboard,
  isSavedFiltersLimitReached,
} from '@/services/analytics/savedFilters.service';
import { withDashboardAuthContext, withDashboardMutationAuthContext } from '@/auth/auth-actions';
import { type AuthContext } from '@/entities/auth/authContext.entities';
import { type FilterColumn, type FilterOperator } from '@/entities/analytics/filter.entities';

type SavedFilterEntryInput = {
  column: FilterColumn;
  operator: FilterOperator;
  values: string[];
};

export const fetchSavedFiltersAction = withDashboardAuthContext(async (ctx: AuthContext) => {
  return getSavedFiltersForDashboard(ctx.dashboardId);
});

export const createSavedFilterAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, name: string, entries: SavedFilterEntryInput[]) => {
    const data = CreateSavedFilterSchema.parse({
      dashboardId: ctx.dashboardId,
      name,
      entries,
    });
    return createSavedFilterForDashboard(data);
  },
);

export const deleteSavedFilterAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, filterId: string) => {
    return deleteSavedFilterFromDashboard(ctx.dashboardId, filterId);
  },
);

export const restoreSavedFilterAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, filterId: string) => {
    return restoreSavedFilterFromDashboard(ctx.dashboardId, filterId);
  },
);

export const isSavedFiltersLimitReachedAction = withDashboardAuthContext(async (ctx: AuthContext) => {
  return isSavedFiltersLimitReached(ctx.dashboardId);
});
