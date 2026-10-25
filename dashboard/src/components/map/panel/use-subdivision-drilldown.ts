'use client';

import { useEffect, useMemo, useState } from 'react';
import { useReplaceStateParam } from '@/hooks/use-replace-state-param';
import { SUBDIVISION_COUNTRY_PARAM, SUBDIVISION_REGION_PARAM } from '@/constants/subdivisionPanel';
import {
  clearRegion,
  drilldownFromParams,
  sameDrilldown,
  toggleCountry,
  toggleRegion,
  type Drilldown,
} from '@/components/map/panel/drilldown-state';

export type SubdivisionDrilldownController = Drilldown & {
  toggleCountry: (code: string) => void;
  clearCountry: () => void;
  toggleRegion: (code: string) => void;
  clearRegion: () => void;
};

// Local state leads; the URL mirrors it and only wins on a soft navigation
export function useSubdivisionDrilldown(): SubdivisionDrilldownController {
  const [urlCountry, writeUrlCountry] = useReplaceStateParam(SUBDIVISION_COUNTRY_PARAM);
  const [urlRegion, writeUrlRegion] = useReplaceStateParam(SUBDIVISION_REGION_PARAM);
  const [state, setState] = useState(() => drilldownFromParams(urlCountry, urlRegion));

  useEffect(() => {
    writeUrlCountry(state.countryCode);
    writeUrlRegion(state.regionCode);
  }, [state, writeUrlCountry, writeUrlRegion]);

  useEffect(() => {
    const next = drilldownFromParams(urlCountry, urlRegion);
    setState((prev) => (sameDrilldown(prev, next) ? prev : next));
  }, [urlCountry, urlRegion]);

  const actions = useMemo(
    () => ({
      toggleCountry: (code: string) => setState((prev) => toggleCountry(prev, code)),
      clearCountry: () => setState({}),
      toggleRegion: (code: string) => setState((prev) => toggleRegion(prev, code)),
      clearRegion: () => setState((prev) => clearRegion(prev)),
    }),
    [],
  );

  return useMemo(() => ({ ...state, ...actions }), [state, actions]);
}
