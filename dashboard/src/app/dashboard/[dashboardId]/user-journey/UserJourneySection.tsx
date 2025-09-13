'use client';

import { use } from 'react';
import { fetchUserJourneyAction } from '@/app/actions/userJourney';
import UserJourneyChart from '@/app/dashboard/[dashboardId]/user-journey/UserJourneyChart';
import { useTranslations } from 'next-intl';

type UserJourneySectionProps = {
  userJourneyPromise: ReturnType<typeof fetchUserJourneyAction>;
};

export default function UserJourneySection({ userJourneyPromise }: UserJourneySectionProps) {
  const t = useTranslations('dashboard.emptyStates');

  const journeyData = use(userJourneyPromise);

  return (
    <div className='relative mt-8 min-h-[400px] overflow-x-auto'>
      {journeyData && journeyData.nodes.length > 0 && (
        <div className='bg-card text-card-foreground min-w-5xl rounded-xl p-4 shadow'>
          <UserJourneyChart data={journeyData} />
        </div>
      )}

      {journeyData?.nodes.length === 0 && (
        <div className='bg-muted rounded-xl p-8 text-center'>
          <div className='flex h-[300px] items-center justify-center'>
            <div className='text-center'>
              <p className='text-muted-foreground mb-1'>{t('noUserJourneyData')}</p>
              <p className='text-muted-foreground/70 text-xs'>{t('adjustTimeRange')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
