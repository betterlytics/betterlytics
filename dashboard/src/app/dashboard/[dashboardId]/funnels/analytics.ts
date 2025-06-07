import { FunnelDetails, FunnelPreview } from '@/entities/funnels';
import { formatQueryFilter } from '@/utils/queryFilterFormatters';

export function analyzeFunnel(funnel: FunnelDetails | FunnelPreview) {
  const stepVisitors = funnel.queryFilters.map((filter, index) => ({
    filter: formatQueryFilter(filter),
    visitors: funnel.visitors[index],
  }));

  const visitorCount = {
    min: Math.min(...(funnel.visitors.length > 0 ? funnel.visitors : [1])),
    max: Math.max(...(funnel.visitors.length > 0 ? funnel.visitors : [1])),
  };

  const steps = stepVisitors.map(({ filter, visitors }, index) => {
    const previousStep =
      stepVisitors[index - 1] && stepVisitors[index - 1].visitors
        ? stepVisitors[index - 1]
        : { visitors: visitorCount.max || 1, filter: '' };
    return {
      filter,
      visitors,
      visitorsRatio: visitors / visitorCount.max,
      dropoffCount: (previousStep.visitors || visitorCount.max) - visitors,
      dropoffRatio: 1 - visitors / (previousStep.visitors || visitorCount.max),
      stepStep: [previousStep.filter, filter],
    };
  });

  const biggestDropOff = steps.reduce(
    (max, current) => {
      return current.dropoffRatio > max.dropoffRatio ? current : max;
    },
    steps[0] ?? {
      step: '/',
      visitors: visitorCount.max,
      visitorsRatio: 0,
      dropoffCount: 0,
      dropoffRatio: 0,
      stepStep: ['/', '/'],
    },
  );

  const conversionRate = visitorCount.min / (visitorCount.max || 1);

  return {
    visitorCount,
    steps,
    biggestDropOff,
    conversionRate,
  };
}
