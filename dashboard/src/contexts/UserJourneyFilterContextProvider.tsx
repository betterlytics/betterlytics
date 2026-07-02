'use client';

import React, { createContext, useCallback, useContext, useMemo, useState, Dispatch, SetStateAction } from 'react';
import type { QueryFilter } from '@/entities/analytics/filter.entities';
import { pruneStepFilters, setStepFiltersAt, type JourneyStepFilters } from '@/utils/journeyStepFilters';

type UserJourneyFilterContextType = {
  numberOfSteps: number;
  numberOfJourneys: number;
  stepFilters: JourneyStepFilters;
  setNumberOfSteps: (steps: number) => void;
  setNumberOfJourneys: Dispatch<SetStateAction<number>>;
  setStepFilters: (position: number, filters: QueryFilter[]) => void;
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
};

export function UserJourneyFilterProvider({ children, initialNumberOfSteps, initialNumberOfJourneys }: Props) {
  const [numberOfSteps, setNumberOfStepsState] = useState<number>(initialNumberOfSteps ?? 3);
  const [numberOfJourneys, setNumberOfJourneys] = useState<number>(initialNumberOfJourneys ?? 10);
  const [stepFilters, setStepFiltersState] = useState<JourneyStepFilters>({});

  const setNumberOfSteps = useCallback((steps: number) => {
    setNumberOfStepsState(steps);
    setStepFiltersState((previous) => pruneStepFilters(previous, steps));
  }, []);

  const setStepFilters = useCallback((position: number, filters: QueryFilter[]) => {
    setStepFiltersState((previous) => setStepFiltersAt(previous, position, filters));
  }, []);

  const value = useMemo(
    () => ({ numberOfSteps, setNumberOfSteps, numberOfJourneys, setNumberOfJourneys, stepFilters, setStepFilters }),
    [numberOfSteps, setNumberOfSteps, numberOfJourneys, stepFilters, setStepFilters],
  );

  return <UserJourneyFilterContext.Provider value={value}>{children}</UserJourneyFilterContext.Provider>;
}