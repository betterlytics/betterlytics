'use server';

import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/auth/authContext.entities';
import { z } from 'zod';
import { FILTER_COLUMNS } from '@/entities/analytics/filter.entities';
import { getDistinctValuesForFilterColumn } from '@/services/analytics/filters.service';
import { capitalizeFirstLetter } from '@/utils/formatters';
import { toFormatted } from '@/presenters/toFormatted';
import { BAAnalyticsQuery } from '@/entities/analytics/analyticsQuery.entities';
import { toSiteQuery } from '@/lib/toSiteQuery';

const FilterOptionsSchema = z.object({
  column: z.enum(FILTER_COLUMNS),
  search: z.string().trim().max(128).optional(),
  limit: z.number().int().min(1).max(5000).optional().default(200),
});

export const getFilterOptionsAction = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery, params: z.infer<typeof FilterOptionsSchema>) => {
    const { main } = toSiteQuery(ctx.siteId, query);
    const { column, search, limit } = FilterOptionsSchema.parse(params);
    const rows = await getDistinctValuesForFilterColumn(main, column, search, limit);

    return column === 'device_type' ? toFormatted(rows, capitalizeFirstLetter) : rows;
  },
);
