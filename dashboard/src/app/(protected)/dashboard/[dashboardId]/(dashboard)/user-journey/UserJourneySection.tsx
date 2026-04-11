'use client';

import { Card, CardContent } from '@/components/ui/card';
import UserJourneyChart from './UserJourneyChart';
import { useTranslations } from 'next-intl';
import { useBAQueryParams } from '@/trpc/hooks';
import { trpc } from '@/trpc/client';
import { QuerySection } from '@/components/QuerySection';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';

export default function UserJourneySection() {
  const t = useTranslations('dashboard.emptyStates');
  const { input, options } = useBAQueryParams();
  const query = trpc.userJourney.journey.useQuery(input, options);

  return (
    <QuerySection
      query={query}
      fallback={
        <div className='flex h-[60svh] items-center justify-center overflow-hidden'>
          <Spinner size='xl' />
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
