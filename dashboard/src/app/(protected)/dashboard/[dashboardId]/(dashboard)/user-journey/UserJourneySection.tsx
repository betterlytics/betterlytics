'use client';

import { fetchUserJourneyAction } from '@/app/actions/analytics/userJourney.actions';
import { Card, CardContent } from '@/components/ui/card';
import UserJourneyChart from './UserJourneyChart';
import { useTranslations } from 'next-intl';
import { useBAQuery } from '@/hooks/useBAQuery';
import { QuerySection } from '@/components/QuerySection';
import { Spinner } from '@/components/ui/spinner';

export default function UserJourneySection() {
  const t = useTranslations('dashboard.emptyStates');
  const query = useBAQuery({
    queryKey: ['user-journey'],
    queryFn: (dashboardId, q) => fetchUserJourneyAction(dashboardId, q),
  });

  return (
    <QuerySection
      query={query}
      fallback={
        <div className='relative min-h-[400px]'>
          <div className='bg-background/70 absolute inset-0 flex items-center justify-center rounded-xl backdrop-blur-sm'>
            <div className='flex flex-col items-center'>
              <Spinner size='lg' className='mb-2' />
              <p className='text-muted-foreground'>Loading journey data...</p>
            </div>
          </div>
        </div>
      }
    >
      {(journeyData) => {
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
      }}
    </QuerySection>
  );
}
