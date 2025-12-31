'use client';

import { useBillingData } from './useBillingData';
import {
  getCapabilitiesForTier,
  type PlanCapabilities,
  type MonitoringCapabilities,
  type DashboardCapabilities,
} from '@/lib/billing/capabilities';

export type { PlanCapabilities, MonitoringCapabilities, DashboardCapabilities };

export function useCapabilities() {
  const { billingData, isLoading } = useBillingData();

  const tier = billingData?.subscription.tier ?? 'growth';
  const caps = getCapabilitiesForTier(tier);

  return {
    caps,
    tier,
    isLoading,
    isPro: tier === 'professional' || tier === 'enterprise',
  };
}
