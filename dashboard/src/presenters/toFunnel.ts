import { FunnelDetails, FunnelPreview, FunnelStep } from '@/entities/funnels';

export type PresentedFunnel = {
  id: string;
  visitorCount: {
    min: number;
    max: number;
  };
  steps: {
    step: FunnelStep;
    visitors: number;
    visitorsRatio: number;
    dropoffCount: number;
    dropoffRatio: number;
    stepFilters: FunnelStep[];
  }[];
  biggestDropOff: {
    step: FunnelStep;
    visitors: number;
    visitorsRatio: number;
    dropoffCount: number;
    dropoffRatio: number;
    stepFilters: FunnelStep[];
  };
  conversionRate: number;
  name: string;
};

export function toFunnel(funnel: FunnelDetails | FunnelPreview): PresentedFunnel {
  const stepVisitors = funnel.funnelSteps.map((step, index) => ({
    step: step,
    visitors: funnel.visitors[index],
  }));

  const visitorCount = {
    min: Math.min(...(funnel.visitors.length > 0 ? funnel.visitors : [1])),
    max: Math.max(...(funnel.visitors.length > 0 ? funnel.visitors : [1])),
  };

  const steps = stepVisitors.map(({ step, visitors }, index) => {
    const actualVisitors = visitors || 0;

    const nextStep = stepVisitors[index + 1]
      ? stepVisitors[index + 1]
      : { visitors: visitorCount.max, step: step };

    nextStep.visitors = nextStep.visitors || 0;
    const dropoffRatio = actualVisitors ? 1 - nextStep.visitors / (actualVisitors || 1) : 0;

    return {
      step,
      visitors,
      visitorsRatio: actualVisitors / (visitorCount.max || 1),
      dropoffCount: actualVisitors - nextStep.visitors,
      dropoffRatio: dropoffRatio,
      stepFilters: [step, nextStep.step],
    };
  });

  const biggestDropOff = steps.reduce((max, current) => {
    return current.dropoffRatio > max.dropoffRatio ? current : max;
  }, steps[0]);

  const conversionRate = visitorCount.min / (visitorCount.max || 1);

  const name = 'name' in funnel ? funnel.name : 'Funnel';

  return {
    id: 'id' in funnel ? funnel.id : '',
    visitorCount,
    steps,
    biggestDropOff,
    conversionRate,
    name,
  };
}
