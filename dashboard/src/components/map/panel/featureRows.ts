import type { ReactElement } from 'react';
import type { GeoFeatureVisitor } from '@/entities/analytics/geography.entities';
import type { ProgressBarData } from '@/components/ProgressBarList';

type FeatureRowsArgs = {
  visitorData: GeoFeatureVisitor[];
  compareData: GeoFeatureVisitor[];
  compareEnabled: boolean;
  labelOf: (code: string) => string;
  icon?: ReactElement;
};

/** Same value/trend shape toDataTable produces for the dashboard geo tabs, so the rows render identically */
export function featureVisitorsToProgressRows({
  visitorData,
  compareData,
  compareEnabled,
  labelOf,
  icon,
}: FeatureRowsArgs): ProgressBarData[] {
  const compareByCode = new Map(compareData.map((d) => [d.code, d.visitors]));
  return [...visitorData]
    .sort((a, b) => b.visitors - a.visitors)
    .map((d) => {
      const compareVisitors = compareByCode.get(d.code);
      const baseline = compareVisitors ?? 0;
      return {
        key: d.code || 'unknown',
        label: labelOf(d.code),
        value: d.visitors,
        comparisonValue: compareEnabled ? compareVisitors : undefined,
        trendPercentage: compareEnabled ? (100 * (d.visitors - baseline)) / (baseline || 1) : undefined,
        icon,
      };
    });
}
