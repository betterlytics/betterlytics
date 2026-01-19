import { type FunnelStep } from '@/entities/analytics/funnels.entities';
import { generateTempId } from '@/utils/temporaryId';
import { useCallback, useLayoutEffect, useState } from 'react';

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
    addFunnelStep({ column: 'url', operator: '=', values: [], name: '' });
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

  return {
    funnelSteps,
    addFunnelStep,
    addEmptyFunnelStep,
    removeFunnelStep,
    updateFunnelStep,
    setFunnelSteps,
  };
}
