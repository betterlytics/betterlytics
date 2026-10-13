'use client';

import SubdivisionPanel from './SubdivisionPanel';
import { SubdivisionPanelContext } from './use-subdivision-panel';
import type { SubdivisionDrilldownController } from './use-subdivision-drilldown';
import { useMapInstance } from '@/components/map/MapProvider';
import { useEffect, useState } from 'react';

export default function SubdivisionDrilldown({ drilldown }: { drilldown: SubdivisionDrilldownController }) {
  const map = useMapInstance();
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (map) setMapReady(true);
  }, [map]);

  if (!mapReady) return null;

  return (
    <SubdivisionPanelContext.Provider value={drilldown}>
      <SubdivisionPanel />
    </SubdivisionPanelContext.Provider>
  );
}
