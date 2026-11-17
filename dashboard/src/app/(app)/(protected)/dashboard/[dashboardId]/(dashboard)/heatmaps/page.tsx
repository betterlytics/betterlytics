import { getTranslations } from 'next-intl/server';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import {
  QueryFilterColumnsVisibilityProvider,
  type ExcludableFilterColumn,
} from '@/contexts/QueryFilterColumnsVisibilityProvider';
import { FILTER_COLUMNS } from '@/entities/analytics/filter.entities';
import { PROPERTY_SOURCE_KINDS } from '@/entities/analytics/propertySources';
import { HeatmapsBanner } from './HeatmapsBanner';
import { HeatmapsClient } from './HeatmapsClient';

const EXCLUDED_FILTER_COLUMNS: ExcludableFilterColumn[] = [...FILTER_COLUMNS, ...PROPERTY_SOURCE_KINDS];

export default async function HeatmapsPage() {
  const t = await getTranslations('dashboard.sidebar');
  return (
    <QueryFilterColumnsVisibilityProvider exclude={EXCLUDED_FILTER_COLUMNS}>
      <div className='container space-y-4 p-2 pt-4 sm:p-6'>
        <DashboardHeader title={t('heatmaps')}>
          <DashboardFilters showComparison={false} />
        </DashboardHeader>
        <HeatmapsBanner />
        <HeatmapsClient />
      </div>
    </QueryFilterColumnsVisibilityProvider>
  );
}
