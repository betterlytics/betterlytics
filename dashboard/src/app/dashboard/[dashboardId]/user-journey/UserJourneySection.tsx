'use client';

import { use } from 'react';
import { fetchUserJourneyAction } from '@/app/actions/userJourney';
import UserJourneyChart from '@/app/dashboard/[dashboardId]/user-journey/UserJourneyChart';
import { useTranslations } from 'next-intl';

type UserJourneySectionProps = {
  userJourneyPromise: ReturnType<typeof fetchUserJourneyAction>;
};

export default function UserJourneySection({ userJourneyPromise }: UserJourneySectionProps) {
  const t = useTranslations('components.userJourney');

  const journeyData = use(userJourneyPromise);

  return (
    <div className='relative mt-8 min-h-[400px] overflow-x-auto'>
      {journeyData && journeyData.nodes.length > 0 && (
        <div className='bg-card text-card-foreground min-w-5xl rounded-lg p-4 shadow'>
          <UserJourneyChart data={journeyData} />
        </div>
      )}

      {journeyData?.nodes.length === 0 && (
        <div className='bg-muted rounded-md p-8 text-center'>
          <p className='text-muted-foreground'>{t('noData')}</p>
        </div>
      )}
    </div>
  );
}
