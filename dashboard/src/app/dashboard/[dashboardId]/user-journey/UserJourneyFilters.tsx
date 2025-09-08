'use client';
import { useUserJourneyFilter } from '@/contexts/UserJourneyFilterContextProvider';
import { useTranslations } from 'next-intl';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const STEP_OPTIONS = [1, 2, 3, 4, 5];
const JOURNEY_OPTIONS = [5, 10, 20, 50, 100];

export function UserJourneyFilters() {
  const { numberOfSteps, setNumberOfSteps, numberOfJourneys, setNumberOfJourneys } = useUserJourneyFilter();
  const t = useTranslations('components.userJourney');
  return (
    <div className='flex items-center gap-2'>
      <Select value={String(numberOfSteps)} onValueChange={(v) => setNumberOfSteps(Number(v))}>
        <SelectTrigger
          id='steps-select'
          className='h-9 cursor-pointer border border-[--input] shadow-sm md:w-[200px]'
        >
          <SelectValue placeholder={`${t('steps')}: ${numberOfSteps}`} />
        </SelectTrigger>
        <SelectContent className='cursor-pointer'>
          {STEP_OPTIONS.map((steps) => (
            <SelectItem key={steps} value={String(steps)} className='cursor-pointer'>
              {steps} {t('steps')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={String(numberOfJourneys)} onValueChange={(v) => setNumberOfJourneys(Number(v))}>
        <SelectTrigger
          id='journeys-select'
          className='h-9 cursor-pointer border border-[--input] shadow-sm md:w-[200px]'
        >
          <SelectValue placeholder={t('topJourneys', { journeys: numberOfJourneys.toString() })} />
        </SelectTrigger>
        <SelectContent className='cursor-pointer'>
          {JOURNEY_OPTIONS.map((journeys) => (
            <SelectItem key={journeys} value={String(journeys)} className='cursor-pointer'>
              {t('topJourneys', { journeys: journeys.toString() })}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
