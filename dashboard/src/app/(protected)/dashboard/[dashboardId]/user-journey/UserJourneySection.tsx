'use client';

import { use } from 'react';
import { fetchUserJourneyAction } from '@/app/actions/analytics/userJourney.actions';
import { Card, CardContent } from '@/components/ui';
import UserJourneyChart from '@/app/(protected)/dashboard/[dashboardId]/user-journey/UserJourneyChart';
import { useTranslations } from 'next-intl';
import { Text } from '@/components/text';
import { Stack } from '@/components/layout';

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
            <Stack gap='content-md'>
              <Text variant='description'>{t('noUserJourneyData')}</Text>
              <Text variant='caption' className='opacity-70'>
                {t('adjustTimeRange')}
              </Text>
            </Stack>
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
