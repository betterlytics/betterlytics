'use client';

import { use } from 'react';
import { ErrorCardList } from './ErrorCardList';
import { fetchErrorGroupsInitialAction } from '@/app/actions/analytics/errors.actions';

type ErrorGroupsSectionProps = {
  initialPagePromise: ReturnType<typeof fetchErrorGroupsInitialAction>;
  dashboardId: string;
  pageSize: number;
};

export function ErrorGroupsSection({ initialPagePromise, dashboardId, pageSize }: ErrorGroupsSectionProps) {
  const initialPage = use(initialPagePromise);
  return <ErrorCardList initialPage={initialPage} dashboardId={dashboardId} pageSize={pageSize} />;
}
