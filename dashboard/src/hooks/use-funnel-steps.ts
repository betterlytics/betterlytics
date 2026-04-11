import { type FunnelStep } from '@/entities/analytics/funnels.entities';
import { type QueryFilter } from '@/entities/analytics/filter.entities';
import { generateTempId } from '@/utils/temporaryId';
import { useCallback, useLayoutEffect, useState } from 'react';

function createEmptyStep(): FunnelStep {
  return {
    id: generateTempId(),
    name: '',
    filters: [{ id: generateTempId(), column: 'url', operator: '=', values: [] }],
  };
}

export function useFunnelSteps(initialSteps?: FunnelStep[]) {
  const [funnelSteps, setFunnelSteps] = useState<FunnelStep[]>(initialSteps || []);

  const addFunnelStep = useCallback((funnelStep: FunnelStep | Omit<FunnelStep, 'id'>) => {
    const step = {
      ...funnelStep,
      id: 'id' in funnelStep ? funnelStep.id : generateTempId(),
    };
    setFunnelSteps((steps) => [...steps, step]);
  }, []);

  const addEmptyFunnelStep = useCallback(() => {
    addFunnelStep(createEmptyStep());
  }, [addFunnelStep]);

  useLayoutEffect(() => {
    if (funnelSteps.length < 2) {
      addEmptyFunnelStep();
    }
  }, [funnelSteps.length, addEmptyFunnelStep]);

  const removeFunnelStep = useCallback((id: string) => {
    setFunnelSteps((steps) => steps.filter((step) => step.id !== id));
  }, []);

  const updateFunnelStep = useCallback((funnelStep: FunnelStep) => {
    setFunnelSteps((steps) =>
      steps.with(
        steps.findIndex((step) => step.id === funnelStep.id),
        funnelStep,
      ),
    );
  }, []);

  const addFilterToStep = useCallback((stepId: string, filter: QueryFilter) => {
    setFunnelSteps((steps) =>
      steps.map((step) =>
        step.id === stepId ? { ...step, filters: [...step.filters, filter] } : step,
      ),
    );
  }, []);

  const updateFilterInStep = useCallback((stepId: string, filter: QueryFilter) => {
    setFunnelSteps((steps) =>
      steps.map((step) =>
        step.id === stepId
          ? { ...step, filters: step.filters.map((f) => (f.id === filter.id ? filter : f)) }
          : step,
      ),
    );
  }, []);

  const removeFilterFromStep = useCallback((stepId: string, filterId: string) => {
    setFunnelSteps((steps) =>
      steps.map((step) =>
        step.id === stepId
          ? { ...step, filters: step.filters.filter((f) => f.id !== filterId) }
          : step,
      ),
    );
  }, []);

  return {
    funnelSteps,
    addFunnelStep,
    addEmptyFunnelStep,
    removeFunnelStep,
    updateFunnelStep,
    setFunnelSteps,
    addFilterToStep,
    updateFilterInStep,
    removeFilterFromStep,
  };
}
