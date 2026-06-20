import { z } from 'zod';
import { createRouter, analyticsProcedure } from '@/trpc/init';
import { FilterColumnSchema } from '@/entities/analytics/filter.entities';
import { PROPERTY_SOURCE_KINDS } from '@/entities/analytics/propertySources';
import { getAvailablePropertyKeys, getDistinctValuesForFilterColumn } from '@/services/analytics/filters.service';
import { capitalizeFirstLetter } from '@/utils/formatters';
import { toFormatted } from '@/presenters/toFormatted';

export const filtersRouter = createRouter({
  getFilterOptions: analyticsProcedure
    .input(
      z.object({
        column: FilterColumnSchema,
        search: z.string().trim().max(128).optional(),
        limit: z.number().int().min(1).max(5000).optional().default(200),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { main } = ctx;
      const rows = await getDistinctValuesForFilterColumn(main, input.column, input.search, input.limit);
      return input.column === 'device_type' ? toFormatted(rows, capitalizeFirstLetter) : rows;
    }),
  getPropertyKeys: analyticsProcedure
    .input(
      z.object({
        source: z.enum(PROPERTY_SOURCE_KINDS),
        search: z.string().trim().max(128).optional(),
        limit: z.number().int().min(1).max(100).optional().default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { main } = ctx;
      return getAvailablePropertyKeys(main, input.source, input.search, input.limit);
    }),
});
