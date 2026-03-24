'use client';

import { use } from 'react';
import { ErrorTable } from './ErrorList';
import { ErrorsEmptyState } from './ErrorsEmptyState';
import type { ErrorGroupsResult } from '@/app/actions/analytics/errors.actions';

type ErrorGroupsSectionProps = {
  groupsPromise: Promise<ErrorGroupsResult>;
  dashboardId: string;
};

export function ErrorGroupsSection({ groupsPromise, dashboardId }: ErrorGroupsSectionProps) {
  const { hasAnyErrors, errorGroups, initialVolumeMap } = use(groupsPromise);

  if (!hasAnyErrors) {
    return <ErrorsEmptyState />;
  }

  return (
    <ErrorTable
      errorGroups={errorGroups}
      initialVolumeMap={initialVolumeMap}
      dashboardId={dashboardId}
    />
  );
}
