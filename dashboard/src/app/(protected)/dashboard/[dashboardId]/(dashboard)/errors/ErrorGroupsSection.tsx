'use client';

import { use } from 'react';
import { ErrorCardList } from './ErrorCardList';
import type { ErrorGroupsResult } from '@/app/actions/analytics/errors.actions';

type ErrorGroupsSectionProps = {
  groupsPromise: Promise<ErrorGroupsResult>;
  dashboardId: string;
};

export function ErrorGroupsSection({ groupsPromise, dashboardId }: ErrorGroupsSectionProps) {
  const { errorGroups, timeBuckets, initialVolumeMap } = use(groupsPromise);

  return (
    <ErrorCardList
      errorGroups={errorGroups}
      initialVolumeMap={initialVolumeMap}
      timeBuckets={timeBuckets}
      dashboardId={dashboardId}
    />
  );
}
