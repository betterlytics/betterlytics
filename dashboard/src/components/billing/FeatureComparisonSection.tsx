'use client';

import { ComparisonTable } from '@/components/public/comparison-table';
import { usePlanComparison } from './usePlanComparison';

export function FeatureComparisonSection() {
  return <ComparisonTable {...usePlanComparison()} />;
}
