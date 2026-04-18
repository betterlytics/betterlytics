import { z } from 'zod';
import { createRouter, analyticsProcedure, dashboardProcedure } from '@/trpc/init';
import {
  getCoreWebVitalsSummaryForSite,
  getHasCoreWebVitalsData,
  getAllCoreWebVitalPercentilesTimeseries,
  getCoreWebVitalsPreparedByDimension,
} from '@/services/analytics/webVitals.service';
import { toWebVitalsPercentileChart } from '@/presenters/toMultiLine';
import { toDataTable } from '@/presenters/toDataTable';

export const webVitalsRouter = createRouter({
  summary: analyticsProcedure.query(async ({ ctx }) => {
    const { main } = ctx;
    return getCoreWebVitalsSummaryForSite(main);
  }),

  hasData: dashboardProcedure.query(async ({ ctx }) => {
    return getHasCoreWebVitalsData(ctx.authContext.siteId);
  }),

  chartData: analyticsProcedure.query(async ({ ctx }) => {
    const { main } = ctx;
    const rows = await getAllCoreWebVitalPercentilesTimeseries(main);
    return toWebVitalsPercentileChart(rows);
  }),

  byDimension: analyticsProcedure
    .input(z.object({ dimension: z.enum(['device_type', 'country_code', 'url', 'browser', 'os']) }))
    .query(async ({ ctx, input }) => {
      const { main } = ctx;
      const prepared = await getCoreWebVitalsPreparedByDimension(main, input.dimension);
      return toDataTable({ categoryKey: 'key', data: prepared });
    }),
});
