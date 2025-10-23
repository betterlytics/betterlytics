'use server';

import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/authContext';
import { z } from 'zod';
import { FILTER_COLUMNS } from '@/entities/filter';
import { getFilterUIConfig, getDistinctValuesForFilterColumn } from '@/services/filters';

export const getFilterUIConfigAction = withDashboardAuthContext(async (_ctx: AuthContext) => {
  return getFilterUIConfig();
});

const DistinctValuesSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  column: z.enum(FILTER_COLUMNS),
  search: z.string().trim().max(128).optional(),
  limit: z.number().int().min(1).max(20).optional(),
});

export const getFilterOptionsAction = withDashboardAuthContext(
  async (ctx: AuthContext, params: z.infer<typeof DistinctValuesSchema>) => {
    const { startDate, endDate, column, search, limit } = DistinctValuesSchema.parse(params);
    return getDistinctValuesForFilterColumn({
      siteId: ctx.siteId,
      startDate,
      endDate,
      column,
      search,
      limit,
    });
  },
);

