'use server';

import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/auth/authContext';
import { z } from 'zod';
import { FILTER_COLUMNS } from '@/entities/analytics/filter';
import { getDistinctValuesForFilterColumn } from '@/services/analytics/filters.service';
import { capitalizeFirstLetter } from '@/utils/formatters';
import { toFormatted } from '@/presenters/toFormatted';

const DistinctValuesSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  column: z.enum(FILTER_COLUMNS),
  search: z.string().trim().max(128).optional(),
  limit: z.number().int().min(1).max(5000).optional().default(200),
});

export const getFilterOptionsAction = withDashboardAuthContext(
  async (ctx: AuthContext, params: z.infer<typeof DistinctValuesSchema>) => {
    const { startDate, endDate, column, search, limit } = DistinctValuesSchema.parse(params);
    const rows = await getDistinctValuesForFilterColumn(ctx.siteId, startDate, endDate, column, search, limit);

    return column === 'device_type' ? toFormatted(rows, capitalizeFirstLetter) : rows;
  },
);
