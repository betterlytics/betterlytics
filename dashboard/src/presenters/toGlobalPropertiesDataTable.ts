import type { GlobalPropertyAggregate } from '@/services/analytics/globalProperties.service';

type MatchedPropertyValue = {
  value: string;
  current: { visitors: number };
  compare?: { visitors: number };
  change?: { percentage: number };
};

export type GlobalPropertyDataTableRow = {
  property_key: string;
  current: { visitors: number };
  compare?: { visitors: number };
  change?: { percentage: number };
  children: MatchedPropertyValue[];
};

type ToGlobalPropertiesDataTableProps = {
  data: GlobalPropertyAggregate[];
  compare?: GlobalPropertyAggregate[] | null;
};

function percentChange(current: number, compare: number): number {
  return ((current - compare) / (compare || 1)) * 100;
}

export function toGlobalPropertiesDataTable({
  data,
  compare,
}: ToGlobalPropertiesDataTableProps): GlobalPropertyDataTableRow[] {
  const computeChange = compare && compare.length > 0;

  const compareMap = computeChange
    ? new Map(compare.map((p) => [p.property_key, p]))
    : undefined;

  return data.map((prop) => {
    const compareProp = compareMap?.get(prop.property_key);

    const compareValueMap = compareProp
      ? new Map(compareProp.values.map((v) => [v.value, v]))
      : undefined;

    const children: MatchedPropertyValue[] = prop.values.map((v) => {
      const cv = compareValueMap?.get(v.value);
      return {
        value: v.value,
        current: { visitors: v.visitors },
        compare: cv ? { visitors: cv.visitors } : undefined,
        change: computeChange ? { percentage: percentChange(v.visitors, cv?.visitors ?? 0) } : undefined,
      };
    });

    return {
      property_key: prop.property_key,
      current: { visitors: prop.visitors },
      compare: compareProp ? { visitors: compareProp.visitors } : undefined,
      change: computeChange ? { percentage: percentChange(prop.visitors, compareProp?.visitors ?? 0) } : undefined,
      children,
    };
  });
}
