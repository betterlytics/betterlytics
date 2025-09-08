'use client';

import { useState, Suspense } from 'react';
import CampaignOverviewSection from './CampaignOverviewSection';
import CampaignUTMSection from './CampaignUTMSection';
import CampaignLandingPagesSection from './CampaignLandingPagesSection';
import { TableSkeleton, ChartSkeleton } from '@/components/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

  const renderTabs = () => (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)} className='h-8'>
      <TabsList className='bg-muted/30 inline-grid h-8 w-fit grid-cols-3 gap-1 px-3'>
        <TabsTrigger value='overview' className='hover:bg-accent cursor-pointer px-3 py-1 text-xs font-medium'>
          {t('overview')}
        </TabsTrigger>
        <TabsTrigger
          value='utmBreakdowns'
          className='hover:bg-accent cursor-pointer px-3 py-1 text-xs font-medium'
        >
          {t('utmBreakdowns')}
        </TabsTrigger>
        <TabsTrigger value='landingPages' className='hover:bg-accent cursor-pointer px-3 py-1 text-xs font-medium'>
          {t('landingPages')}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );

  return (
    <div>
      <div className='border-border border-b pb-3'>{renderTabs()}</div>

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
