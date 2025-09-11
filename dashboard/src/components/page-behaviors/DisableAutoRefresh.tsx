'use client';

import { useEffect } from 'react';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';

export function DisableAutoRefresh() {
  const { setAutoRefreshDisabled } = useTimeRangeContext();

  useEffect(() => {
    setAutoRefreshDisabled(true);
    return () => {
      setAutoRefreshDisabled(false);
    };
  }, [setAutoRefreshDisabled]);

  return null;
}

export default DisableAutoRefresh;
