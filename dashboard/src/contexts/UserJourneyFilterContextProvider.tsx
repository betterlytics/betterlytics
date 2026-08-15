'use client';

import React, { createContext, useCallback, useContext, useMemo, useState, Dispatch, SetStateAction } from 'react';
import { type QueryFilter } from '@/entities/analytics/filter.entities';
import { pruneStepFilters, type StepFiltersBySlot } from '@/entities/analytics/stepFilters.entities';

type UserJourneyFilterContextType = {
  numberOfSteps: number;
  numberOfJourneys: number;
  stepFilters: StepFiltersBySlot;
  setNumberOfSteps: Dispatch<SetStateAction<number>>;
  setNumberOfJourneys: Dispatch<SetStateAction<number>>;
  setStepFilters: (slot: number, filters: QueryFilter[]) => void;
  replaceStepFilters: (next: StepFiltersBySlot) => void;
};

const UserJourneyFilterContext = createContext<UserJourneyFilterContextType | undefined>(undefined);

export function useUserJourneyFilter() {
  const context = useContext(UserJourneyFilterContext);
  if (!context) throw new Error('useUserJourneyFilter must be used within UserJourneyFilterProvider');
  return context;
}

type Props = {
  children: React.ReactNode;
  initialNumberOfSteps?: number;
  initialNumberOfJourneys?: number;
  initialStepFilters?: StepFiltersBySlot;
};

export function UserJourneyFilterProvider({
  children,
  initialNumberOfSteps,
  initialNumberOfJourneys,
  initialStepFilters,
}: Props) {
  const [numberOfSteps, setNumberOfStepsState] = useState<number>(initialNumberOfSteps ?? 3);
  const [numberOfJourneys, setNumberOfJourneys] = useState<number>(initialNumberOfJourneys ?? 10);
  const [stepFilters, setStepFiltersState] = useState<StepFiltersBySlot>(initialStepFilters ?? {});

  const setNumberOfSteps: Dispatch<SetStateAction<number>> = useCallback((next) => {
    setNumberOfStepsState((previous) => {
      const resolved = typeof next === 'function' ? next(previous) : next;
      setStepFiltersState((filters) => pruneStepFilters(filters, resolved));
      return resolved;
    });
  }, []);

  const setStepFilters = useCallback((slot: number, filters: QueryFilter[]) => {
    setStepFiltersState((previous) => {
      if (filters.length === 0) {
        const { [slot]: _removed, ...rest } = previous;
        return rest;
      }
      return { ...previous, [slot]: filters };
    });
  }, []);

  const replaceStepFilters = useCallback((next: StepFiltersBySlot) => {
    setStepFiltersState(next);
  }, []);

  const value = useMemo(
    () => ({
      numberOfSteps,
      numberOfJourneys,
      stepFilters,
      setNumberOfSteps,
      setNumberOfJourneys,
      setStepFilters,
      replaceStepFilters,
    }),
    [numberOfSteps, numberOfJourneys, stepFilters, setNumberOfSteps, setStepFilters, replaceStepFilters],
  );

  return <UserJourneyFilterContext.Provider value={value}>{children}</UserJourneyFilterContext.Provider>;
}
