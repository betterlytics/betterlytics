import { getTranslations } from 'next-intl/server';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { HeatmapsClient } from './HeatmapsClient';

export default async function HeatmapsPage() {
  const t = await getTranslations('dashboard.sidebar');
  return (
    <div className='container space-y-4 p-2 pt-4 sm:p-6'>
      <DashboardHeader title={t('heatmaps')}>
        <DashboardFilters showComparison={false} showQueryFilters={false} />
      </DashboardHeader>
      <HeatmapsClient />
    </div>
  );
}
