'use client';

import { Card, CardContent } from '@/components/ui/card';
import UserJourneyChart from './UserJourneyChart';
import { useTranslations } from 'next-intl';
import { useBAQueryParams } from '@/trpc/hooks';
import { trpc } from '@/trpc/client';
import { QuerySection } from '@/components/QuerySection';
import { Spinner } from '@/components/ui/spinner';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useUserJourneyFilter } from '@/contexts/UserJourneyFilterContextProvider';
import { UserJourneyStepBand } from './UserJourneyStepBand';

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
        const nodes = journeyData?.nodes ?? [];
        const isEmpty = nodes.length === 0;

        const emptyState = (
          <div className='flex h-[300px] items-center justify-center text-center'>
            <div>
              <p className='text-muted-foreground mb-1'>{t('noUserJourneyData')}</p>
              <p className='text-muted-foreground/70 text-xs'>{t('adjustTimeRange')}</p>
            </div>
          </div>
        );

        if (isEmpty && !hasStepFilters) {
          return (
            <Card className='mt-6'>
              <CardContent className='p-8'>{emptyState}</CardContent>
            </Card>
          );
        }

        const renderedColumnCount = isEmpty ? 0 : Math.max(...nodes.map((node) => node.depth)) + 1;

        return (
          <ScrollArea className='max-h-[70svh] w-full flex-1 rounded-md border'>
            <div className='min-w-[1000px]'>
              <UserJourneyStepBand renderedColumnCount={renderedColumnCount} />
              {isEmpty ? (
                emptyState
              ) : (
                <div className='px-4 pt-2 pb-4'>
                  <UserJourneyChart data={journeyData} />
                </div>
              )}
            </div>
            <ScrollBar orientation='horizontal' />
          </ScrollArea>
        );
      }}
    </QuerySection>
  );
}
