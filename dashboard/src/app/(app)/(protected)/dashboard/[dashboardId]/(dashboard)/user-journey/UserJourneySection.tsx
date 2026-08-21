'use client';

import { Card, CardContent } from '@/components/ui/card';
import UserJourneyChart from './UserJourneyChart';
import { UserJourneyStepBand } from './UserJourneyStepBand';
import { useTranslations } from 'next-intl';
import { useBAQueryParams } from '@/trpc/hooks';
import { trpc } from '@/trpc/client';
import { QuerySection } from '@/components/QuerySection';
import { Spinner } from '@/components/ui/spinner';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useUserJourneyFilter } from '@/contexts/UserJourneyFilterContextProvider';
import { FilterXIcon } from 'lucide-react';

export default function UserJourneySection() {
  const t = useTranslations('dashboard.emptyStates');
  const tJourney = useTranslations('components.userJourney');
  const { input, options } = useBAQueryParams();
  const { stepFilters, numberOfSteps } = useUserJourneyFilter();
  const query = trpc.userJourney.journey.useQuery(input, options);
  const hasStepFilters = Object.keys(stepFilters).length > 0;

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
        const isEmpty = journeyData?.nodes.length === 0;
        const failingSlot = journeyData?.failingSlot ?? null;

        const emptyState = (
          <Card className={hasStepFilters ? 'm-4' : 'mt-6'}>
            <CardContent className='p-8'>
              <div className='flex h-[300px] items-center justify-center text-center'>
                {failingSlot !== null ? (
                  <div className='text-muted-foreground flex flex-col items-center gap-2'>
                    <FilterXIcon className='size-5' />
                    <p>{tJourney('stepFilterNoMatches', { number: failingSlot + 1 })}</p>
                  </div>
                ) : (
                  <div>
                    <p className='text-muted-foreground mb-1'>{t('noUserJourneyData')}</p>
                    <p className='text-muted-foreground/70 text-xs'>{t('adjustTimeRange')}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );

        if (isEmpty && !hasStepFilters) {
          return emptyState;
        }

        return (
          <ScrollArea className='-mr-1 max-h-[70svh]'>
            <div className='min-w-[1000px] pr-1'>
              <UserJourneyStepBand failingSlot={failingSlot} />
              {isEmpty ? emptyState : <UserJourneyChart data={journeyData} numberOfSteps={numberOfSteps} />}
            </div>
            <ScrollBar orientation='horizontal' />
          </ScrollArea>
        );
      }}
    </QuerySection>
  );
}
