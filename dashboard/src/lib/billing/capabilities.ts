import { TierName } from './plans';

export type DashboardCapabilities = {
  maxDashboards: number;
};

export type MonitoringCapabilities = {
  maxMonitors: number;
  minIntervalSeconds: number;
  httpMethodConfigurable: boolean;
  customStatusCodes: boolean;
  customHeaders: boolean;
};

export type PlanCapabilities = {
  dashboards: DashboardCapabilities;
  monitoring: MonitoringCapabilities;
};

export const PLAN_CAPABILITIES: Record<TierName, PlanCapabilities> = {
  growth: {
    dashboards: { maxDashboards: 2 },
    monitoring: {
      maxMonitors: 5,
      minIntervalSeconds: 300,
      httpMethodConfigurable: false,
      customStatusCodes: false,
      customHeaders: false,
    },
  },
  professional: {
    dashboards: { maxDashboards: 50 },
    monitoring: {
      maxMonitors: 50,
      minIntervalSeconds: 60,
      httpMethodConfigurable: true,
      customStatusCodes: true,
      customHeaders: true,
    },
  },
  enterprise: {
    dashboards: { maxDashboards: 9999 },
    monitoring: {
      maxMonitors: 9999,
      minIntervalSeconds: 30,
      httpMethodConfigurable: true,
      customStatusCodes: true,
      customHeaders: true,
    },
  },
};

export function getCapabilitiesForTier(tier: TierName): PlanCapabilities {
  return PLAN_CAPABILITIES[tier];
}

export function getDashboardLimitForTier(tier: TierName): number {
  return PLAN_CAPABILITIES[tier].dashboards.maxDashboards;
}
