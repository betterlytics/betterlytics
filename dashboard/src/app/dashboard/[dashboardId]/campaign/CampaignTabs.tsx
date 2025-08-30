'use client';

import { useState, Suspense } from 'react';
import CampaignOverviewSection from './CampaignOverviewSection';
import CampaignUTMSection from './CampaignUTMSection';
import CampaignLandingPagesSection from './CampaignLandingPagesSection';
import { TableSkeleton, ChartSkeleton } from '@/components/skeleton';
import {
  fetchCampaignPerformanceAction,
  fetchCampaignVisitorTrendAction,
  fetchCampaignSourceBreakdownAction,
  fetchCampaignMediumBreakdownAction,
  fetchCampaignContentBreakdownAction,
  fetchCampaignTermBreakdownAction,
  fetchCampaignLandingPagePerformanceAction,
} from '@/app/actions';
import { useTranslations } from 'next-intl';

type TabValue = 'overview' | 'utmBreakdowns' | 'landingPages';

type CampaignTabsProps = {
  campaignPerformancePromise: ReturnType<typeof fetchCampaignPerformanceAction>;
  visitorTrendPromise: ReturnType<typeof fetchCampaignVisitorTrendAction>;
  sourceBreakdownPromise: ReturnType<typeof fetchCampaignSourceBreakdownAction>;
  mediumBreakdownPromise: ReturnType<typeof fetchCampaignMediumBreakdownAction>;
  contentBreakdownPromise: ReturnType<typeof fetchCampaignContentBreakdownAction>;
  termBreakdownPromise: ReturnType<typeof fetchCampaignTermBreakdownAction>;
  landingPagePerformancePromise: ReturnType<typeof fetchCampaignLandingPagePerformanceAction>;
};

export default function CampaignTabs({
  campaignPerformancePromise,
  visitorTrendPromise,
  sourceBreakdownPromise,
  mediumBreakdownPromise,
  contentBreakdownPromise,
  termBreakdownPromise,
  landingPagePerformancePromise,
}: CampaignTabsProps) {
  const [activeTab, setActiveTab] = useState<TabValue>('overview');
  const t = useTranslations('components.campaign.tabs');

  const renderTabButton = (tabValue: TabValue, label: string) => (
    <button
      key={tabValue}
      onClick={() => setActiveTab(tabValue)}
      className={`rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none ${
        activeTab === tabValue
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div className='border-border border-b'>
        <nav className='-mb-px flex space-x-4' aria-label='Tabs'>
          {renderTabButton('overview', t('overview'))}
          {renderTabButton('utmBreakdowns', t('utmBreakdowns'))}
          {renderTabButton('landingPages', t('landingPages'))}
        </nav>
      </div>

      <div className='mt-6'>
        {activeTab === 'overview' && (
          <Suspense
            fallback={
              <div className='space-y-3'>
                <TableSkeleton />
                <ChartSkeleton />
              </div>
            }
          >
            <CampaignOverviewSection
              campaignPerformancePromise={campaignPerformancePromise}
              visitorTrendPromise={visitorTrendPromise}
            />
          </Suspense>
        )}

        {activeTab === 'utmBreakdowns' && (
          <Suspense
            fallback={
              <div className='space-y-3'>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className='grid grid-cols-1 gap-3 lg:grid-cols-3'>
                    <div className='lg:col-span-2'>
                      <TableSkeleton />
                    </div>
                    <ChartSkeleton />
                  </div>
                ))}
              </div>
            }
          >
            <CampaignUTMSection
              sourceBreakdownPromise={sourceBreakdownPromise}
              mediumBreakdownPromise={mediumBreakdownPromise}
              contentBreakdownPromise={contentBreakdownPromise}
              termBreakdownPromise={termBreakdownPromise}
            />
          </Suspense>
        )}

        {activeTab === 'landingPages' && (
          <Suspense fallback={<TableSkeleton />}>
            <CampaignLandingPagesSection landingPagePerformancePromise={landingPagePerformancePromise} />
          </Suspense>
        )}
      </div>
    </div>
  );
}
