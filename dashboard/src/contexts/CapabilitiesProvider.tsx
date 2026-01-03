'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getUserBillingData } from '@/actions/billing.action';
import {
  getCapabilitiesForTier,
  type PlanCapabilities,
  type MonitoringCapabilities,
  type DashboardCapabilities,
} from '@/lib/billing/capabilities';
import { TierName } from '@/lib/billing/plans';
import { useDashboardAuth } from './DashboardAuthProvider';

export type { PlanCapabilities, MonitoringCapabilities, DashboardCapabilities };

type CapabilitiesContextValue = {
  caps: PlanCapabilities;
  tier: TierName;
  isLoading: boolean;
  isPro: boolean;
};

const ENTERPRISE_CAPS = getCapabilitiesForTier('enterprise');
const GROWTH_CAPS = getCapabilitiesForTier('growth');

const CapabilitiesContext = createContext<CapabilitiesContextValue>({
  caps: GROWTH_CAPS,
  tier: 'growth',
  isLoading: true,
  isPro: false,
});

type CapabilitiesProviderProps = {
  children: React.ReactNode;
};

export function CapabilitiesProvider({ children }: CapabilitiesProviderProps) {
  const isDemo = useDashboardAuth().isDemo;
  const [tier, setTier] = useState<TierName>('growth');
  const [isLoading, setIsLoading] = useState(!isDemo);

  useEffect(() => {
    if (isDemo) return;

    const fetchTier = async () => {
      const result = await getUserBillingData();
      if (result.success) {
        setTier(result.data.subscription.tier);
      }
      setIsLoading(false);
    };

    fetchTier();
  }, [isDemo]);

  const value = useMemo<CapabilitiesContextValue>(() => {
    if (isDemo) {
      return {
        caps: ENTERPRISE_CAPS,
        tier: 'enterprise',
        isLoading: false,
        isPro: true,
      };
    }

    return {
      caps: getCapabilitiesForTier(tier),
      tier,
      isLoading,
      isPro: tier === 'professional' || tier === 'enterprise',
    };
  }, [isDemo, tier, isLoading]);

  return <CapabilitiesContext.Provider value={value}>{children}</CapabilitiesContext.Provider>;
}

export function useCapabilities(): CapabilitiesContextValue {
  return useContext(CapabilitiesContext);
}
