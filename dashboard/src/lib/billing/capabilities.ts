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
  keywordValidation: boolean;
};

export type EmailReportCapabilities = {
  emailReportsEnabled: boolean;
};

export type DataRetentionCapabilities = {
  maxDataRetentionDays: number;
};

export type PlanCapabilities = {
  dashboards: DashboardCapabilities;
  monitoring: MonitoringCapabilities;
  emailReports: EmailReportCapabilities;
  dataRetention: DataRetentionCapabilities;
};

export const PLAN_CAPABILITIES: Record<TierName, PlanCapabilities> = {
  growth: {
    dashboards: { maxDashboards: 2 },
    monitoring: {
      maxMonitors: 1,
      minIntervalSeconds: 300,
      httpMethodConfigurable: false,
      customStatusCodes: false,
      customHeaders: false,
      keywordValidation: false,
    },
    emailReports: { emailReportsEnabled: false },
    dataRetention: { maxDataRetentionDays: 365 },
  },
  professional: {
    dashboards: { maxDashboards: 50 },
    monitoring: {
      maxMonitors: 50,
      minIntervalSeconds: 60,
      httpMethodConfigurable: true,
      customStatusCodes: true,
      customHeaders: true,
      keywordValidation: true,
    },
    emailReports: { emailReportsEnabled: true },
    dataRetention: { maxDataRetentionDays: 1095 },
  },
  enterprise: {
    dashboards: { maxDashboards: 9999 },
    monitoring: {
      maxMonitors: 9999,
      minIntervalSeconds: 30,
      httpMethodConfigurable: true,
      customStatusCodes: true,
      customHeaders: true,
      keywordValidation: true,
    },
    emailReports: { emailReportsEnabled: true },
    dataRetention: { maxDataRetentionDays: 1825 },
  },
};

export function getCapabilitiesForTier(tier: TierName): PlanCapabilities {
  return PLAN_CAPABILITIES[tier];
}

export function getDashboardLimitForTier(tier: TierName): number {
  return PLAN_CAPABILITIES[tier].dashboards.maxDashboards;
}

export function isEmailReportsEnabled(tier: TierName): boolean {
  return PLAN_CAPABILITIES[tier].emailReports.emailReportsEnabled;
}

export function getMaxRetentionDaysForTier(tier: TierName): number {
  return PLAN_CAPABILITIES[tier].dataRetention.maxDataRetentionDays;
}
