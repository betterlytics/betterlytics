import { z } from 'zod';
import { createRouter, analyticsProcedure } from '@/trpc/init';
import { FILTER_COLUMNS } from '@/entities/analytics/filter.entities';
import { getDistinctValuesForFilterColumn } from '@/services/analytics/filters.service';
import { capitalizeFirstLetter } from '@/utils/formatters';
import { toFormatted } from '@/presenters/toFormatted';

export const filtersRouter = createRouter({
  getFilterOptions: analyticsProcedure
    .input(z.object({
      column: z.enum(FILTER_COLUMNS),
      search: z.string().trim().max(128).optional(),
      limit: z.number().int().min(1).max(5000).optional().default(200),
    }))
    .query(async ({ ctx, input }) => {
      const { main } = ctx;
      const rows = await getDistinctValuesForFilterColumn(main, input.column, input.search, input.limit);
      return input.column === 'device_type' ? toFormatted(rows, capitalizeFirstLetter) : rows;
    }),
});
