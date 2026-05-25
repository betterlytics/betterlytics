import DashboardFilters from '@/components/dashboard/DashboardFilters';
import SummaryAndChartSection from './SummaryAndChartSection';
import PagesAnalyticsSection from './PagesAnalyticsSection';
import GeographySection from './GeographySection';
import DevicesSection from './DevicesSection';
import TrafficSourcesSection from './TrafficSourcesSection';
import CustomEventsSection from './CustomEventsSection';
import WeeklyHeatmapSection from './WeeklyHeatmapSection';
import { getEnabledGeoLevels } from '@/lib/geoLevels';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { getTranslations } from 'next-intl/server';
import { LazySection } from '@/components/LazySection';
import { MultiProgressTableCardSkeleton, WeeklyHeatmapCardSkeleton } from '@/components/skeleton';
import { FilterPreservingLink } from '@/components/ui/FilterPreservingLink';
import { ArrowRight } from 'lucide-react';

export default async function DashboardPage() {
  const enabledLevels = getEnabledGeoLevels();
  const t = await getTranslations('dashboard');

  return (
    <div className='container space-y-4 p-2 sm:p-6'>
      <DashboardHeader title={t('sidebar.overview')}>
        <DashboardFilters />
      </DashboardHeader>

      <SummaryAndChartSection />

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        <PagesAnalyticsSection />
        {enabledLevels.length > 0 && <GeographySection enabledLevels={enabledLevels} />}
        <LazySection
          fallback={
            <MultiProgressTableCardSkeleton
              title={t('sections.devicesBreakdown')}
              tabs={[t('tabs.browsers'), t('tabs.operatingSystems'), t('tabs.devices')]}
              footer={
                <FilterPreservingLink
                  href='devices'
                  className='text-muted-foreground inline-flex items-center gap-1 text-xs hover:underline'
                >
                  <span>{t('goTo', { section: t('sidebar.devices') })}</span>
                  <ArrowRight className='h-3.5 w-3.5' />
                </FilterPreservingLink>
              }
            />
          }
        >
          <DevicesSection />
        </LazySection>
        <LazySection
          fallback={
            <MultiProgressTableCardSkeleton
              title={t('sections.trafficSources')}
              tabs={[t('tabs.referrers'), t('tabs.channels')]}
              footer={
                <FilterPreservingLink
                  href='referrers'
                  className='text-muted-foreground inline-flex items-center gap-1 text-xs hover:underline'
                >
                  <span>{t('goTo', { section: t('sidebar.referrers') })}</span>
                  <ArrowRight className='h-3.5 w-3.5' />
                </FilterPreservingLink>
              }
            />
          }
        >
          <TrafficSourcesSection />
        </LazySection>
        <LazySection
          fallback={
            <MultiProgressTableCardSkeleton
              title={t('sections.events')}
              tabs={[t('tabs.events')]}
              footer={
                <FilterPreservingLink
                  href='events'
                  className='text-muted-foreground inline-flex items-center gap-1 text-xs hover:underline'
                >
                  <span>{t('goTo', { section: t('sidebar.events') })}</span>
                  <ArrowRight className='h-3.5 w-3.5' />
                </FilterPreservingLink>
              }
            />
          }
        >
          <CustomEventsSection />
        </LazySection>
        <LazySection
          fallback={
            <WeeklyHeatmapCardSkeleton
              title={t('sections.weeklyTrends')}
              initialMetricLabel={t('metrics.uniqueVisitors')}
            />
          }
        >
          <WeeklyHeatmapSection />
        </LazySection>
      </div>
    </div>
  );
}
