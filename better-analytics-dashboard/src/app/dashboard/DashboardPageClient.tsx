"use client";
import SummaryCard from "@/components/SummaryCard";
import PageviewsChart from "@/components/PageviewsChart";
import VisitorsChart from "@/components/VisitorsChart";
import TopPagesTable from '@/components/TopPagesTable';
import DeviceTypePieChart from '@/components/DeviceTypePieChart';
import { useMemo, useState } from "react";
import { TIME_RANGE_PRESETS, getRangeForValue, TimeRangeValue } from "@/utils/timeRanges";
import { useQuery } from '@tanstack/react-query';
import { formatDuration } from "@/utils/dateFormatters";
import { fetchDeviceTypeBreakdownAction } from "@/app/actions/devices";
import { fetchSummaryStatsAction, fetchTopPagesAction } from "@/app/actions/overview";
import { useTimeRangeContext } from "@/contexts/TimeRangeContextProvider";
import { GRANULARITY_RANGE_PRESETS, GranularityRangeValues } from "@/utils/granularityRanges";
import { useLocalization } from "@/hooks/useLocalization";
import { LocaleText } from "@/components/locale/LocaleText";

export default function DashboardPageClient() {
  const { range, setRange } = useTimeRangeContext();

  const [ granularity, setGranularity ] = useState<GranularityRangeValues>("day");

  const { startDate, endDate } = useMemo(() => getRangeForValue(range), [range]);

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['summaryStats', 'default-site', startDate, endDate],
    queryFn: () => fetchSummaryStatsAction('default-site', startDate, endDate),
  });

  const { data: topPages, isLoading: topPagesLoading } = useQuery({
    queryKey: ['topPages', 'default-site', startDate, endDate],
    queryFn: () => fetchTopPagesAction('default-site', startDate, endDate, 5),
  });

  const { data: deviceBreakdown, isLoading: deviceBreakdownLoading } = useQuery({
    queryKey: ['deviceTypeBreakdown', 'default-site', startDate, endDate],
    queryFn: () => fetchDeviceTypeBreakdownAction('default-site', startDate, endDate),
  });
  
  const [ t ] = useLocalization();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-end mb-4 gap-4">
          <div className="relative inline-block text-left">
            <select
              className="border rounded px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={range}
              onChange={e => setRange(e.target.value as TimeRangeValue)}
            >
              {TIME_RANGE_PRESETS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div className="relative inline-block text-left">
            <select
              className="border rounded px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={granularity}
              onChange={e => setGranularity(e.target.value as GranularityRangeValues)}
            >
              {GRANULARITY_RANGE_PRESETS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
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
          <VisitorsChart siteId="default-site" startDate={startDate} endDate={endDate} granularity={granularity} />
          <PageviewsChart siteId="default-site" startDate={startDate} endDate={endDate} granularity={granularity} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            {topPagesLoading ? <LocaleText k="misc.loading" /> : <TopPagesTable pages={topPages ?? []} />}
          </div>
          <div>
            {deviceBreakdownLoading ? <LocaleText k="misc.loading" /> : <DeviceTypePieChart breakdown={deviceBreakdown ?? []} />}
          </div>
        </div>
      </div>
    </div>
  );
}

