import UserJourneySection from './UserJourneySection';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { UserJourneyFilters } from './UserJourneyFilters';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { getTranslations } from 'next-intl/server';

export default async function UserJourneyPage() {
  const t = await getTranslations('dashboard.sidebar');
  return (
    <div className='container flex flex-col space-y-3 overflow-y-auto p-2 pt-4 pb-0 sm:p-6'>
      <DashboardHeader title={t('userJourney')}>
        <DashboardFilters showComparison={false}>
          <div className='hidden 2xl:inline-block'>
            <UserJourneyFilters />
          </div>
        </DashboardFilters>
      </DashboardHeader>

      <div className='flex justify-end 2xl:hidden'>
        <UserJourneyFilters />
      </div>

      <UserJourneySection />
    </div>
  );
}
