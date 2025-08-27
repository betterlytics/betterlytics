'use client';
import { useUserJourneyFilter } from '@/contexts/UserJourneyFilterContextProvider';
import { useTranslations } from 'next-intl';

const STEP_OPTIONS = [1, 2, 3, 4, 5];
const JOURNEY_OPTIONS = [5, 10, 20, 50, 100];

export function UserJourneyFilters() {
  const { numberOfSteps, setNumberOfSteps, numberOfJourneys, setNumberOfJourneys } = useUserJourneyFilter();
  const t = useTranslations('components.userJourney');
  return (
    <>
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
    </>
  );
}
