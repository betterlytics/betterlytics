import { FunnelDetails, FunnelPreview } from '@/entities/funnels';
import { QueryFilter } from '@/entities/filter';

export type PresentedFunnel = {
  visitorCount: {
    min: number;
    max: number;
  };
  steps: {
    queryFilter: QueryFilter;
    visitors: number;
    visitorsRatio: number;
    dropoffCount: number;
    dropoffRatio: number;
    stepFilters: QueryFilter[];
  }[];
  biggestDropOff: {
    queryFilter: QueryFilter;
    visitors: number;
    visitorsRatio: number;
    dropoffCount: number;
    dropoffRatio: number;
    stepFilters: QueryFilter[];
  };
  conversionRate: number;
  name: string;
};

export function toFunnel(funnel: FunnelDetails | FunnelPreview): PresentedFunnel {
  const stepVisitors = funnel.queryFilters.map((filter, index) => ({
    queryFilter: filter,
    visitors: funnel.visitors[index],
  }));

  const visitorCount = {
    min: Math.min(...(funnel.visitors.length > 0 ? funnel.visitors : [1])),
    max: Math.max(...(funnel.visitors.length > 0 ? funnel.visitors : [1])),
  };

  const steps = stepVisitors.map(({ queryFilter, visitors }, index) => {
    const actualVisitors = visitors || 0;

    const nextStep = stepVisitors[index + 1]
      ? stepVisitors[index + 1]
      : { visitors: visitorCount.max, queryFilter: queryFilter };

    nextStep.visitors = nextStep.visitors || 0;
    const dropoffRatio = actualVisitors ? 1 - nextStep.visitors / (actualVisitors || 1) : 0;

    return {
      queryFilter,
      visitors,
      visitorsRatio: actualVisitors / (visitorCount.max || 1),
      dropoffCount: actualVisitors - nextStep.visitors,
      dropoffRatio: dropoffRatio,
      stepFilters: [queryFilter, nextStep.queryFilter],
    };
  });

  const biggestDropOff = steps.reduce((max, current) => {
    return current.dropoffRatio > max.dropoffRatio ? current : max;
  }, steps[0]);

  const conversionRate = visitorCount.min / (visitorCount.max || 1);

  const name = 'name' in funnel ? funnel.name : 'Funnel';

  return {
    visitorCount,
    steps,
    biggestDropOff,
    conversionRate,
    name,
  };
}
