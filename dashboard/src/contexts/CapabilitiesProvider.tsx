'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getDashboardOwnerBillingData } from '@/actions/billing.action';
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
  dashboardId: string;
  children: React.ReactNode;
};

export function CapabilitiesProvider({ dashboardId, children }: CapabilitiesProviderProps) {
  const { isDemo } = useDashboardAuth();
  const [tier, setTier] = useState<TierName>('growth');
  const [isLoading, setIsLoading] = useState(!isDemo);

  useEffect(() => {
    if (isDemo) return;

    setIsLoading(true);

    const fetchTier = async () => {
      try {
        const billingData = await getDashboardOwnerBillingData(dashboardId);
        setTier(billingData.subscription.tier);
      } catch (error) {
        console.error('Failed to fetch dashboard capabilities:', error);
      }
      setIsLoading(false);
    };

    fetchTier();
  }, [isDemo, dashboardId]);

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
