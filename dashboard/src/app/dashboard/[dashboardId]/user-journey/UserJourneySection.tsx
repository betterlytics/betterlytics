'use client';

import { use } from 'react';
import { fetchUserJourneyAction } from '@/app/actions/userJourney';
import UserJourneyChart from '@/app/dashboard/[dashboardId]/user-journey/UserJourneyChart';
import { useUserJourneyFilter } from '@/contexts/UserJourneyFilterContextProvider';
import { useTranslations } from 'next-intl';

const STEP_OPTIONS = [1, 2, 3, 4, 5];
const JOURNEY_OPTIONS = [5, 10, 20, 50, 100];

type UserJourneySectionProps = {
  userJourneyPromise: ReturnType<typeof fetchUserJourneyAction>;
};

export default function UserJourneySection({ userJourneyPromise }: UserJourneySectionProps) {
  const { numberOfSteps, setNumberOfSteps, numberOfJourneys, setNumberOfJourneys } = useUserJourneyFilter();
  const t = useTranslations('components.userJourney');

  const journeyData = use(userJourneyPromise);

  return (
    <div className='space-y-6'>
      <div className='flex grow-1 flex-col justify-end gap-x-4 gap-y-1 md:flex-row'>
        <select
          id='steps-select'
          className='text-foreground bg-background focus:ring-ring h-9 grow-1 rounded border px-3 focus:ring-2 focus:outline-none md:w-[200px] md:grow-0'
          value={numberOfSteps}
          onChange={(e) => setNumberOfSteps(Number(e.target.value))}
        >
          {STEP_OPTIONS.map((steps) => (
            <option key={steps} value={steps}>
              {steps} {t('steps')}
            </option>
          ))}
        </select>
        <select
          id='journeys-select'
          className='text-foreground bg-background focus:ring-ring h-9 grow-1 rounded border px-3 focus:ring-2 focus:outline-none md:w-[200px] md:grow-0'
          value={numberOfJourneys}
          onChange={(e) => setNumberOfJourneys(Number(e.target.value))}
        >
          {JOURNEY_OPTIONS.map((journeys) => (
            <option key={journeys} value={journeys}>
              {t('topJourneys', { journeys: journeys.toString() })}
            </option>
          ))}
        </select>
      </div>

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
    </div>
  );
}
