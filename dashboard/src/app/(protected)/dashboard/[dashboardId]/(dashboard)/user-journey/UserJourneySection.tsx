'use client';

import { use } from 'react';
import { fetchUserJourneyAction } from '@/app/actions/analytics/userJourney.actions';
import { Card, CardContent } from '@/components/ui/card';
import UserJourneyChart from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/user-journey/UserJourneyChart';
import { useTranslations } from 'next-intl';

type UserJourneySectionProps = {
  userJourneyPromise: ReturnType<typeof fetchUserJourneyAction>;
};

export default function UserJourneySection({ userJourneyPromise }: UserJourneySectionProps) {
  const t = useTranslations('dashboard.emptyStates');
  const journeyData = use(userJourneyPromise);

  if (journeyData?.nodes.length === 0) {
    return (
      <Card className='mt-6'>
        <CardContent className='p-8'>
          <div className='flex h-[300px] items-center justify-center text-center'>
            <div>
              <p className='text-muted-foreground mb-1'>{t('noUserJourneyData')}</p>
              <p className='text-muted-foreground/70 text-xs'>{t('adjustTimeRange')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='w-full flex-1 overflow-x-auto'>
      <div className='h-full w-full min-w-[1000px]'>
        <UserJourneyChart data={journeyData} />
      </div>
    </div>
  );
}
