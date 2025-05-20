'use client';

import { useState } from "react";
import { useQuery } from '@tanstack/react-query';
import {
  fetchCampaignPerformanceAction,
  fetchCampaignSourceBreakdownAction,
  fetchCampaignVisitorTrendAction,
  fetchCampaignMediumBreakdownAction,
  fetchCampaignContentBreakdownAction,
  fetchCampaignTermBreakdownAction,
  fetchCampaignLandingPagePerformanceAction,
} from "@/app/actions/campaigns";
import {
  CampaignPerformance,
  CampaignSourceBreakdownItem,
  PivotedCampaignVisitorTrendItem,
  CampaignMediumBreakdownItem,
  CampaignContentBreakdownItem,
  CampaignTermBreakdownItem,
  CampaignLandingPagePerformanceItem,
} from "@/entities/campaign";
import CampaignPerformanceTable from "@/components/analytics/CampaignPerformanceTable";
import CampaignVisitorTrendChart from "@/components/analytics/CampaignVisitorTrendChart";
import CampaignLandingPagePerformanceTable from "@/components/analytics/CampaignLandingPagePerformanceTable";
import { useTimeRangeContext } from "@/contexts/TimeRangeContextProvider";
import TimeRangeSelector from "@/components/TimeRangeSelector";
import CampaignPieChart, { CampaignDataKey } from "@/components/analytics/CampaignPieChart";
import CampaignEngagementTable from "@/components/analytics/CampaignEngagementTable";

type TabValue = "overview" | "utmBreakdowns" | "landingPages";

export default function CampaignClient() {
  const { startDate, endDate } = useTimeRangeContext();
  const [activeTab, setActiveTab] = useState<TabValue>("overview");

  const { data: campaignPerformance = [], isLoading: campaignPerformanceLoading } = useQuery<CampaignPerformance[]>({
    queryKey: ['campaignPerformance', 'default-site', startDate, endDate],
    queryFn: () => fetchCampaignPerformanceAction('default-site', startDate, endDate),
  });

  const { data: sourceBreakdown = [], isLoading: sourceBreakdownLoading } = useQuery<CampaignSourceBreakdownItem[]>({
    queryKey: ['campaignSourceBreakdown', 'default-site', startDate, endDate],
    queryFn: () => fetchCampaignSourceBreakdownAction('default-site', startDate, endDate),
  });

  const { data: visitorTrend = [], isLoading: visitorTrendLoading } = useQuery<PivotedCampaignVisitorTrendItem[]>({
    queryKey: ['campaignVisitorTrend', 'default-site', startDate, endDate],
    queryFn: () => fetchCampaignVisitorTrendAction('default-site', startDate, endDate),
  });

  const { data: mediumBreakdown = [], isLoading: mediumBreakdownLoading } = useQuery<CampaignMediumBreakdownItem[]>({
    queryKey: ['campaignMediumBreakdown', 'default-site', startDate, endDate],
    queryFn: () => fetchCampaignMediumBreakdownAction('default-site', startDate, endDate),
  });

  const { data: contentBreakdown = [], isLoading: contentBreakdownLoading } = useQuery<CampaignContentBreakdownItem[]>({
    queryKey: ['campaignContentBreakdown', 'default-site', startDate, endDate],
    queryFn: () => fetchCampaignContentBreakdownAction('default-site', startDate, endDate),
  });

  const { data: termBreakdown = [], isLoading: termBreakdownLoading } = useQuery<CampaignTermBreakdownItem[]>({
    queryKey: ['campaignTermBreakdown', 'default-site', startDate, endDate],
    queryFn: () => fetchCampaignTermBreakdownAction('default-site', startDate, endDate),
  });

  const { data: landingPagePerformance = [], isLoading: landingPagePerformanceLoading } = useQuery<CampaignLandingPagePerformanceItem[]>({
    queryKey: ['campaignLandingPagePerformance', 'default-site', startDate, endDate],
    queryFn: () => fetchCampaignLandingPagePerformanceAction('default-site', startDate, endDate),
  });

  const renderTabButton = (tabValue: TabValue, label: string) => (
    <button
      key={tabValue}
      onClick={() => setActiveTab(tabValue)}
      className={`px-4 py-2 font-medium text-sm rounded-md focus:outline-none transition-colors
        ${activeTab === tabValue
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
    >
      {label}
    </button>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Campaigns</h1>
          <p className="text-sm text-muted-foreground">Campaign performance analytics and insights</p>
        </div>
        <TimeRangeSelector />
      </div>

      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-4" aria-label="Tabs">
          {renderTabButton("overview", "Overview")}
          {renderTabButton("utmBreakdowns", "UTM Breakdowns")}
          {renderTabButton("landingPages", "Landing Pages")}
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <CampaignPerformanceTable
              data={campaignPerformance}
              isLoading={campaignPerformanceLoading}
            />
            <CampaignVisitorTrendChart
              data={visitorTrend}
              isLoading={visitorTrendLoading}
            />
          </div>
        )}

        {activeTab === "utmBreakdowns" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <CampaignEngagementTable
                  data={sourceBreakdown}
                  isLoading={sourceBreakdownLoading}
                  title="Source Engagement Metrics"
                  subtitle="Engagement details for each campaign source"
                  dataKey="source"
                />
              </div>
              <CampaignPieChart
                data={sourceBreakdown}
                isLoading={sourceBreakdownLoading}
                dataKey={CampaignDataKey.SOURCE}
                title="Campaign Traffic by Source"
                subtitle="Distribution of campaign visitors by source"
                emptyStateMessage="No source breakdown data available for campaigns."
              />
            </div>
            <hr className="my-6 border-border"/>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <CampaignEngagementTable
                  data={mediumBreakdown}
                  isLoading={mediumBreakdownLoading}
                  title="Medium Engagement Metrics"
                  subtitle="Engagement details for each campaign medium"
                  dataKey="medium"
                />
              </div>
              <CampaignPieChart
                data={mediumBreakdown}
                isLoading={mediumBreakdownLoading}
                dataKey={CampaignDataKey.MEDIUM}
                title="Campaign Traffic by Medium"
                subtitle="Distribution of campaign visitors by medium"
                emptyStateMessage="No medium breakdown data available for campaigns."
              />
            </div>
            <hr className="my-6 border-border"/>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <CampaignEngagementTable
                  data={contentBreakdown}
                  isLoading={contentBreakdownLoading}
                  title="Content Engagement Metrics"
                  subtitle="Engagement details for each campaign content"
                  dataKey="content"
                />
              </div>
              <CampaignPieChart
                data={contentBreakdown}
                isLoading={contentBreakdownLoading}
                dataKey={CampaignDataKey.CONTENT}
                title="Campaign Traffic by Content"
                subtitle="Distribution of campaign visitors by content"
                emptyStateMessage="No content breakdown data available for campaigns."
              />
            </div>
            <hr className="my-6 border-border"/>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <CampaignEngagementTable
                  data={termBreakdown}
                  isLoading={termBreakdownLoading}
                  title="Term/Keyword Engagement Metrics"
                  subtitle="Engagement details for each campaign term/keyword"
                  dataKey="term"
                />
              </div>
              <CampaignPieChart
                data={termBreakdown}
                isLoading={termBreakdownLoading}
                dataKey={CampaignDataKey.TERM}
                title="Campaign Traffic by Term/Keyword"
                subtitle="Distribution of campaign visitors by term/keyword"
                emptyStateMessage="No term breakdown data available for campaigns."
              />
            </div>
          </div>
        )}

        {activeTab === "landingPages" && (
          <div>
            <CampaignLandingPagePerformanceTable
              data={landingPagePerformance}
              isLoading={landingPagePerformanceLoading}
            />
          </div>
        )}
      </div>
    </div>
  );
}