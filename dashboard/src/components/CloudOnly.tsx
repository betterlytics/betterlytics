import type { ReactNode } from 'react';
import { isFeatureEnabled } from '@/lib/feature-flags';

export function CloudOnly({ children }: { children: ReactNode }) {
  return isFeatureEnabled('isCloud') ? children : null;
}
