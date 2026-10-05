'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useReplaceStateParam } from '@/hooks/use-replace-state-param';
import { parseCountryParam, SUBDIVISION_COUNTRY_PARAM } from './params';

export type SubdivisionDrilldownController = {
  countryCode: string | undefined;
  open: (code: string) => void;
  close: () => void;
  toggle: (code: string) => void;
};

// Local state is the source of truth so the panel opens in the same frame as the map click; the URL only mirrors it
export function useSubdivisionDrilldown(): SubdivisionDrilldownController {
  const [urlValue, writeUrlValue] = useReplaceStateParam(SUBDIVISION_COUNTRY_PARAM);
  const [countryCode, setCountryCode] = useState(() => parseCountryParam(urlValue));

  useEffect(() => {
    writeUrlValue(countryCode);
  }, [countryCode, writeUrlValue]);

  const open = useCallback((code: string) => setCountryCode(code), []);
  const close = useCallback(() => setCountryCode(undefined), []);
  const toggle = useCallback((code: string) => setCountryCode((prev) => (prev === code ? undefined : code)), []);

  return useMemo(() => ({ countryCode, open, close, toggle }), [countryCode, open, close, toggle]);
}
