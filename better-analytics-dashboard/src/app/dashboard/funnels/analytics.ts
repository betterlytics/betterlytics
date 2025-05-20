import { FunnelDetails } from "@/entities/funnels";


export function analyzeFunnel(funnel: FunnelDetails) {

  const pageVisitors = funnel.pages.map((page, index) => ({ page, visitors: funnel.visitors[index] }));

  const visitorCount = {
    min: Math.min(...(funnel.visitors.length > 0 ? funnel.visitors : [1])),
    max: Math.max(...(funnel.visitors.length > 0 ? funnel.visitors : [1]))
  }

  const steps = pageVisitors
    .map(({ page, visitors }, index) => {
      const previousPage = pageVisitors[index - 1] ?? { visitors: visitorCount.max, page: '' };
      return {
        page,
        visitors,
        visitorsRatio: visitors / visitorCount.max,
        dropoffCount: (previousPage.visitors || visitorCount.max) - visitors,
        dropoffRatio: 1 - (visitors / (previousPage.visitors || visitorCount.max)),
        pageStep: [previousPage.page, page],
      }
    });

  const biggestDropOff = steps.reduce((max, current) => {
      return current.dropoffRatio > max.dropoffRatio ? current : max;
    },
    steps[0] ?? { page: '/', visitors: visitorCount.max, visitorsRatio: 0, dropoffCount: 0, dropoffRatio: 0, pageStep: ['/', '/'] }
  );

  const conversionRate = visitorCount.min / visitorCount.max;

  return {
    id: funnel.id,
    name: funnel.name,
    visitorCount,
    steps,
    biggestDropOff,
    conversionRate
  }
}