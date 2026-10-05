'use client';

import SubdivisionPanel from './SubdivisionPanel';
import { SubdivisionPanelContext } from './use-subdivision-panel';
import type { SubdivisionDrilldownController } from './use-subdivision-drilldown';

export default function SubdivisionDrilldown({ drilldown }: { drilldown: SubdivisionDrilldownController }) {
  return (
    <SubdivisionPanelContext.Provider value={drilldown}>
      <SubdivisionPanel />
    </SubdivisionPanelContext.Provider>
  );
}
