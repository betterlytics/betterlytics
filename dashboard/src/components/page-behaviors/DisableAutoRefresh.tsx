'use client';

import { useEffect } from 'react';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';

export function DisableAutoRefresh() {
  const { setAutoRefreshInterval } = useTimeRangeContext();

  useEffect(() => {
    setAutoRefreshInterval('off');
    return () => {
      setAutoRefreshInterval('off');
    };
  }, [setAutoRefreshInterval]);

  return null;
}

export default DisableAutoRefresh;
