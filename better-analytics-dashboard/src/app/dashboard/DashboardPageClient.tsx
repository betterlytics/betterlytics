"use client";
import SummaryCard from "@/components/SummaryCard";
import PageviewsChart from "@/components/PageviewsChart";
import VisitorsChart from "@/components/VisitorsChart";
import TopPagesTable from '@/components/TopPagesTable';
import DeviceTypePieChart from '@/components/DeviceTypePieChart';
import TimeRangeSelector from "@/components/TimeRangeSelector";
import { useQuery } from '@tanstack/react-query';
import { formatDuration } from "@/utils/dateFormatters";
import { fetchDeviceTypeBreakdownAction } from "@/app/actions/devices";
import { fetchSummaryStatsAction, fetchTopPagesAction } from "@/app/actions/overview";
import { useTimeRangeContext } from "@/contexts/TimeRangeContextProvider";
import { useLocalization } from "@/hooks/useLocalization";
import { LocaleText } from "@/components/locale/LocaleText";

export default function DashboardPageClient() {
  const { granularity, startDate, endDate } = useTimeRangeContext();

  const siteId = 'default-site';

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['summaryStats', siteId, startDate, endDate],
    queryFn: () => fetchSummaryStatsAction(siteId, startDate, endDate),
  });

  const { data: topPages, isLoading: topPagesLoading } = useQuery({
    queryKey: ['topPages', siteId, startDate, endDate],
    queryFn: () => fetchTopPagesAction(siteId, startDate, endDate, 5),
  });

  const { data: deviceBreakdown, isLoading: deviceBreakdownLoading } = useQuery({
    queryKey: ['deviceTypeBreakdown', siteId, startDate, endDate],
    queryFn: () => fetchDeviceTypeBreakdownAction(siteId, startDate, endDate),
  });
  
  const [ t ] = useLocalization();

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-end mb-4 gap-4">
        <TimeRangeSelector />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title={t('dashboard.summary.uniqueVisitors')}
          value={summaryLoading ? '...' : summary?.uniqueVisitors?.toLocaleString() ?? '0'}
          changeText=""
          changeColor="text-green-600"
        />
        <SummaryCard
          title={t('dashboard.summary.totalPageViews')}
          value={summaryLoading ? '...' : summary?.pageviews?.toLocaleString() ?? '0'}
          changeText=""
          changeColor="text-red-600"
        />
        <SummaryCard
          title={t('dashboard.summary.bounceRate')}
          value={summaryLoading ? '...' : summary?.bounceRate !== undefined ? `${summary.bounceRate}%` : '0%'}
          changeText=""
        />
        <SummaryCard
          title={t('dashboard.summary.avgVisitDuration')}
          value={summaryLoading ? '...' : formatDuration(summary?.avgVisitDuration ?? 0)}
          changeText=""
          changeColor="text-green-600"
        />
      </div>      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-card rounded-lg p-6 border border-border shadow">
          <VisitorsChart siteId="default-site" startDate={startDate} endDate={endDate} granularity={granularity} />
        </div>
        <div className="bg-card rounded-lg p-6 border border-border shadow">
          <PageviewsChart siteId="default-site" startDate={startDate} endDate={endDate} granularity={granularity} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-card rounded-lg p-6 border border-border shadow">
          {topPagesLoading ? <LocaleText k="misc.loading" /> : <TopPagesTable pages={topPages ?? []} />}
        </div>
        <div className="bg-card rounded-lg p-6 border border-border shadow">
          {deviceBreakdownLoading ? <LocaleText k="misc.loading" /> : <DeviceTypePieChart breakdown={deviceBreakdown ?? []} />}
        </div>
      </div>
    </div>
  );
}

