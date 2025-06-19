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
    const nextStep = stepVisitors[index + 1]
      ? stepVisitors[index + 1]
      : { visitors: visitorCount.max, filter: '' };
    const dropoffRatio = visitors ? 1 - nextStep.visitors / visitors : 0;
    return {
      filter,
      visitors,
      visitorsRatio: visitors / visitorCount.max,
      dropoffCount: visitors - nextStep.visitors,
      dropoffRatio: dropoffRatio,
      step: [filter, nextStep.filter],
    };
  });

  const biggestDropOff = steps.reduce((max, current) => {
    return current.dropoffRatio > max.dropoffRatio ? current : max;
  }, steps[0]);

  const conversionRate = visitorCount.min / (visitorCount.max || 1);

  return {
    visitorCount,
    steps,
    biggestDropOff,
    conversionRate,
  };
}
