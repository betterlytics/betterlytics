'use client';

import { createContext, useContext } from 'react';
import type { SubdivisionDrilldownController } from './use-subdivision-drilldown';

export const SubdivisionPanelContext = createContext<SubdivisionDrilldownController | null>(null);

export function useSubdivisionPanel(): SubdivisionDrilldownController {
  const context = useContext(SubdivisionPanelContext);
  if (!context) {
    throw new Error('useSubdivisionPanel must be used within SubdivisionDrilldown');
  }
  return context;
}
