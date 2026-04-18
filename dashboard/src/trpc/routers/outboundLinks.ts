import { createRouter, analyticsProcedure } from '@/trpc/init';
import {
  getOutboundLinksAnalyticsForSite,
  getDailyOutboundClicksForSite,
  getOutboundLinksDistributionForSite,
} from '@/services/analytics/outboundLinks.service';
import { toDataTable } from '@/presenters/toDataTable';
import { toAreaChart } from '@/presenters/toAreaChart';
import { toPieChart } from '@/presenters/toPieChart';
import { isEndBucketIncomplete, isStartBucketIncomplete } from '@/lib/ba-timerange';

export const outboundLinksRouter = createRouter({
  analytics: analyticsProcedure.query(async ({ ctx }) => {
    const { main, compare } = ctx;
    const [data, compareData] = await Promise.all([
      getOutboundLinksAnalyticsForSite(main),
      compare && getOutboundLinksAnalyticsForSite(compare),
    ]);
    return toDataTable({ data, compare: compareData, categoryKey: 'outbound_link_url' });
  }),

  clicksChart: analyticsProcedure.query(async ({ ctx }) => {
    const { main, compare } = ctx;
    const [data, compareData] = await Promise.all([
      getDailyOutboundClicksForSite(main),
      compare && getDailyOutboundClicksForSite(compare),
    ]);
    return toAreaChart({
      dataKey: 'outboundClicks', data, compare: compareData,
      granularity: main.granularity,
      dateRange: { start: main.startDate, end: main.endDate },
      compareDateRange: compare ? { start: compare.startDate, end: compare.endDate } : undefined,
      bucketIncomplete: main.endDate.getTime() > Date.now() || isEndBucketIncomplete(main.endDate, main.granularity, main.timezone),
      startBucketIncomplete: isStartBucketIncomplete(main.startDate, main.granularity, main.timezone),
    });
  }),

  distribution: analyticsProcedure.query(async ({ ctx }) => {
    const { main, compare } = ctx;
    const [data, compareData] = await Promise.all([
      getOutboundLinksDistributionForSite(main),
      compare && getOutboundLinksDistributionForSite(compare),
    ]);
    return toPieChart({ key: 'outbound_link_url', dataKey: 'clicks', data, compare: compareData });
  }),
});
