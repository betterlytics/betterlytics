'use client';

import { use } from 'react';
import { ErrorCardList } from './ErrorCardList';
import { fetchErrorGroupsAction, fetchErrorGroupVolumesAction } from '@/app/actions/analytics/errors.actions';

type ErrorGroupsSectionProps = {
  errorGroupsPromise: ReturnType<typeof fetchErrorGroupsAction>;
  volumeMapPromise: ReturnType<typeof fetchErrorGroupVolumesAction>;
};

export function ErrorGroupsSection({ errorGroupsPromise, volumeMapPromise }: ErrorGroupsSectionProps) {
  const errors = use(errorGroupsPromise);
  const volumeMap = use(volumeMapPromise);
  return <ErrorCardList errors={errors} volumeMap={volumeMap} />;
}
