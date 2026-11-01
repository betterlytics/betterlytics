'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getDashboardOwnerBillingData } from '@/actions/billing.action';
import type {
  PlanCapabilities,
  MonitoringCapabilities,
  DashboardCapabilities,
} from '@/lib/billing/capabilities';
import {
  entitledPlan,
  freePlan,
  planThatUnlocks,
  selfHostedPlan,
  type PlanDefinition,
} from '@/lib/billing/catalog';
import { useDashboardAuth } from './DashboardAuthProvider';

export type { PlanCapabilities, MonitoringCapabilities, DashboardCapabilities };

type CapabilitiesContextValue = {
  caps: PlanCapabilities;
  isLoading: boolean;
};

const CapabilitiesContext = createContext<CapabilitiesContextValue>({
  caps: freePlan().capabilities,
  isLoading: true,
});

type CapabilitiesProviderProps = {
  dashboardId: string;
  children: React.ReactNode;
};

export function CapabilitiesProvider({ dashboardId, children }: CapabilitiesProviderProps) {
  const { isDemo } = useDashboardAuth();
  const [plan, setPlan] = useState<PlanDefinition>(freePlan);
  const [isLoading, setIsLoading] = useState(!isDemo);

  useEffect(() => {
    if (isDemo) return;

    setIsLoading(true);

    const fetchPlan = async () => {
      try {
        const billingData = await getDashboardOwnerBillingData(dashboardId);
        setPlan(entitledPlan(billingData.subscription));
      } catch (error) {
        console.error('Failed to fetch dashboard capabilities:', error);
      }
      setIsLoading(false);
    };

    fetchPlan();
  }, [isDemo, dashboardId]);

  const value = useMemo<CapabilitiesContextValue>(() => {
    const resolved = isDemo ? selfHostedPlan() : plan;
    return { caps: resolved.capabilities, isLoading: isDemo ? false : isLoading };
  }, [isDemo, plan, isLoading]);

  return <CapabilitiesContext.Provider value={value}>{children}</CapabilitiesContext.Provider>;
}

export function useCapabilities(): CapabilitiesContextValue {
  return useContext(CapabilitiesContext);
}

export function useUpgrade(unlocks: (capabilities: PlanCapabilities) => boolean): {
  locked: boolean;
  plan: PlanDefinition | null;
} {
  const { caps } = useCapabilities();
  const locked = !unlocks(caps);
  return { locked, plan: locked ? planThatUnlocks(unlocks) : null };
}
