import type { GlobalPropertyAggregate } from '@/services/analytics/globalProperties.service';

type MatchedPropertyValue = {
  value: string;
  current: { count: number };
  compare?: { count: number };
  change?: { count: number };
};

export type GlobalPropertyDataTableRow = {
  property_key: string;
  current: { count: number };
  compare?: { count: number };
  change?: { count: number };
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
        current: { count: v.count },
        compare: cv ? { count: cv.count } : undefined,
        change: computeChange ? { count: percentChange(v.count, cv?.count ?? 0) } : undefined,
      };
    });

    return {
      property_key: prop.property_key,
      current: { count: prop.count },
      compare: compareProp ? { count: compareProp.count } : undefined,
      change: computeChange ? { count: percentChange(prop.count, compareProp?.count ?? 0) } : undefined,
      children,
    };
  });
}
