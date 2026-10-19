'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useReplaceStateParam } from '@/hooks/use-replace-state-param';
import { SUBDIVISION_COUNTRY_PARAM } from '@/constants/subdivisionPanel';
import { parseCountryParam } from '@/components/map/panel/params';

export type SubdivisionDrilldownController = {
  countryCode: string | undefined;
  close: () => void;
  toggle: (code: string) => void;
};

// Local state leads; the URL mirrors it and only wins on back, forward or a soft navigation
export function useSubdivisionDrilldown(): SubdivisionDrilldownController {
  const [urlValue, writeUrlValue] = useReplaceStateParam(SUBDIVISION_COUNTRY_PARAM);
  const [countryCode, setCountryCode] = useState(() => parseCountryParam(urlValue));

  useEffect(() => {
    writeUrlValue(countryCode);
  }, [countryCode, writeUrlValue]);

  useEffect(() => {
    setCountryCode(parseCountryParam(urlValue));
  }, [urlValue]);

  const close = useCallback(() => setCountryCode(undefined), []);
  const toggle = useCallback((code: string) => setCountryCode((prev) => (prev === code ? undefined : code)), []);

  return useMemo(() => ({ countryCode, close, toggle }), [countryCode, close, toggle]);
}
