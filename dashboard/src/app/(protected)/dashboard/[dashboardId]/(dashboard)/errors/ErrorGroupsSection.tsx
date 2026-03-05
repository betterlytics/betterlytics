'use client';

import { use, useMemo } from 'react';
import { ErrorCardList } from './ErrorCardList';
import { toGroupedBarCharts } from '@/presenters/toBarChart';
import type { ErrorGroupsResult } from '@/app/actions/analytics/errors.actions';
import type { BarChartPoint } from '@/presenters/toBarChart';

type ErrorGroupsSectionProps = {
  groupsPromise: Promise<ErrorGroupsResult>;
  timeBucketsPromise: Promise<BarChartPoint[]>;
  dashboardId: string;
};

export function ErrorGroupsSection({ groupsPromise, timeBucketsPromise, dashboardId }: ErrorGroupsSectionProps) {
  const { errorGroups, initialVolumeRows } = use(groupsPromise);
  const timeBuckets = use(timeBucketsPromise);

  const initialVolumeMap = useMemo(
    () =>
      toGroupedBarCharts({
        groupKey: 'error_fingerprint',
        dataKey: 'errorCount',
        timeBuckets,
        data: initialVolumeRows,
      }),
    [initialVolumeRows, timeBuckets],
  );

  return (
    <ErrorCardList
      errorGroups={errorGroups}
      initialVolumeMap={initialVolumeMap}
      timeBuckets={timeBuckets}
      dashboardId={dashboardId}
    />
  );
}
