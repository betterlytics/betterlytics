'use client';

import SubdivisionPanel from '@/components/map/panel/SubdivisionPanel';
import type { SubdivisionDrilldownController } from '@/components/map/panel/use-subdivision-drilldown';
import { useMapInstance } from '@/components/map/MapProvider';
import { useEffect, useState } from 'react';

export default function SubdivisionDrilldown({ drilldown }: { drilldown: SubdivisionDrilldownController }) {
  const map = useMapInstance();
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (map) setMapReady(true);
  }, [map]);

  if (!mapReady) return null;

  return <SubdivisionPanel drilldown={drilldown} />;
}
