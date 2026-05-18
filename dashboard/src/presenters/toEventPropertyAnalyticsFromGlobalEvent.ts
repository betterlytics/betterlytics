import { EventPropertyAnalytics } from '@/entities/analytics/events.entities';
import { calculatePercentage } from '@/utils/mathUtils';

export type GlobalPropertyForEventAggregate = {
  property_key: string;
  event_count: number;
  unique_value_count: number;
  values: { value: string; event_count: number }[];
};

export function toEventPropertyAnalyticsFromGlobalEvent(
  aggregate: GlobalPropertyForEventAggregate[],
): EventPropertyAnalytics[] {
  return aggregate.map((entry) => {
    const denominator = entry.event_count;
    return {
      propertyName: entry.property_key,
      uniqueValueCount: entry.unique_value_count,
      totalOccurrences: denominator,
      topValues: entry.values.map((v) => {
        const ratio = denominator > 0 ? calculatePercentage(v.event_count, denominator) : 0;
        return {
          value: v.value,
          count: v.event_count,
          percentage: ratio,
          relativePercentage: ratio,
        };
      }),
    };
  });
}
