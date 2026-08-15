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

export default function UserJourneySection() {
  const t = useTranslations('dashboard.emptyStates');
  const { input, options } = useBAQueryParams();
  const { stepFilters } = useUserJourneyFilter();
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
        const maxRenderedDepth = isEmpty ? 0 : Math.max(0, ...journeyData.nodes.map((node) => node.depth));

        const emptyState = (
          <Card className={hasStepFilters ? 'm-4' : 'mt-6'}>
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

        if (isEmpty && !hasStepFilters) {
          return emptyState;
        }

        return (
          <ScrollArea className='max-h-[70svh] w-full rounded-md border'>
            <div className='min-w-[1000px]'>
              <UserJourneyStepBand maxRenderedDepth={maxRenderedDepth} />
              {isEmpty ? emptyState : <UserJourneyChart data={journeyData} />}
            </div>
            <ScrollBar orientation='horizontal' />
          </ScrollArea>
        );
      }}
    </QuerySection>
  );
}
