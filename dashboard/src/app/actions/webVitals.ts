'use server';

import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/authContext';
import { QueryFilter } from '@/entities/filter';
import { getCoreWebVitalsSummaryForSite } from '@/services/webVitals';

export const fetchCoreWebVitalsSummaryAction = withDashboardAuthContext(
  async (ctx: AuthContext, startDate: Date, endDate: Date, queryFilters: QueryFilter[]) => {
    return getCoreWebVitalsSummaryForSite(ctx.siteId, startDate, endDate, queryFilters);
  },
);
