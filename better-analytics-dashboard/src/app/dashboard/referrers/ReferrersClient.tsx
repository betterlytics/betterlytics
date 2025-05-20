'use client';

import { useState, useEffect } from "react";
import SummaryCard from "@/components/SummaryCard";
import ReferrerDistributionChart from '@/components/charts/ReferrerDistributionChart';
import ReferrerTrafficTrendChart from '@/components/charts/ReferrerTrafficTrendChart';
import ReferrerTable from '@/components/charts/ReferrerTable';
import TimeRangeSelector from "@/components/TimeRangeSelector";
import { 
  fetchReferrerSourceAggregationDataForSite, 
  fetchReferrerSummaryDataForSite,
  fetchReferrerTableDataForSite,
  fetchReferrerTrafficTrendBySourceDataForSite
} from "@/app/actions/referrers";
import { 
  ReferrerSourceAggregation, 
  ReferrerSummary,
  ReferrerTableRow,
  ReferrerTrafficBySourceRow 
} from "@/entities/referrers";
import { useTimeRangeContext } from "@/contexts/TimeRangeContextProvider";
import { formatPercentage } from "@/utils/formatters";

export default function ReferrersClient() {
  const [distributionData, setDistributionData] = useState<ReferrerSourceAggregation[] | undefined>(undefined);
  const [trendBySourceData, setTrendBySourceData] = useState<ReferrerTrafficBySourceRow[] | undefined>(undefined);
  const [summaryData, setSummaryData] = useState<ReferrerSummary | undefined>(undefined);
  const [tableData, setTableData] = useState<ReferrerTableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { granularity, startDate, endDate } = useTimeRangeContext();
  
  const siteId = 'default-site';

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [distributionResult, trendBySourceResult, summaryResult, tableResult] = await Promise.all([
          fetchReferrerSourceAggregationDataForSite(siteId, startDate, endDate),
          fetchReferrerTrafficTrendBySourceDataForSite(siteId, startDate, endDate, granularity),
          fetchReferrerSummaryDataForSite(siteId, startDate, endDate),
          fetchReferrerTableDataForSite(siteId, startDate, endDate)
        ]);
        
        setDistributionData(distributionResult.data);
        setTrendBySourceData(trendBySourceResult.data);
        setSummaryData(summaryResult.data);
        setTableData(tableResult.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [startDate, endDate, granularity, siteId]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Referrers</h1>
            <p className="text-sm text-muted-foreground">Analytics and insights for your website</p>
          </div>
          <div className="flex gap-4">
            <TimeRangeSelector />
          </div>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <SummaryCard
            title="Total Referrers"
            value={(loading || !summaryData) ? "-" : summaryData.totalReferrers.toString()}
            changeText=""
          />
          <SummaryCard
            title="Referral Traffic"
            value={(loading || !summaryData) ? "-" : summaryData.referralTraffic.toString()}
            changeText=""
          />
          <SummaryCard
            title="Avg. Bounce Rate"
            value={(loading || !summaryData) ? "-" : formatPercentage(summaryData.avgBounceRate)}
            changeText=""
          />
        </div>
        
        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-card rounded-lg p-4 shadow border border-border">
            <div className="font-medium mb-2 text-foreground">Referrer Distribution</div>
            <p className="text-xs text-muted-foreground mb-4">Traffic sources by category</p>
            <ReferrerDistributionChart data={distributionData} loading={loading} />
          </div>
          <div className="bg-card rounded-lg p-4 shadow border border-border">
            <div className="font-medium mb-2 text-foreground">Referral Traffic Trends</div>
            <p className="text-xs text-muted-foreground mb-4">Traffic by source over time</p>
            <ReferrerTrafficTrendChart data={trendBySourceData} loading={loading} />
          </div>
        </div>
        
        {/* Referrer Table */}
        <div className="bg-card rounded-lg p-4 shadow border border-border">
          <div className="font-medium mb-2 text-foreground">Referrer Details</div>
          <p className="text-xs text-muted-foreground mb-4">Detailed breakdown of traffic sources</p>
          <ReferrerTable data={tableData} loading={loading} />
        </div>
      </div>
    </div>
  );
} 