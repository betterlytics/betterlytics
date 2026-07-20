import { TierName } from './plans';

export type DashboardCapabilities = {
  maxDashboards: number;
  maxMembers: number;
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

export type StatusPagesCapabilities = {
  maxStatusPages: number;
  customDomain: boolean;
  removeBranding: boolean;
};

export type PlanCapabilities = {
  dashboards: DashboardCapabilities;
  monitoring: MonitoringCapabilities;
  emailReports: EmailReportCapabilities;
  dataRetention: DataRetentionCapabilities;
  statusPages: StatusPagesCapabilities;
};

export const PLAN_CAPABILITIES: Record<TierName, PlanCapabilities> = {
  growth: {
    dashboards: { maxDashboards: 2, maxMembers: 3 },
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
    statusPages: { maxStatusPages: 1, customDomain: false, removeBranding: false },
  },
  professional: {
    dashboards: { maxDashboards: 50, maxMembers: 50 },
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
    statusPages: { maxStatusPages: 3, customDomain: true, removeBranding: true },
  },
  enterprise: {
    dashboards: { maxDashboards: 9999, maxMembers: 9999 },
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
    statusPages: { maxStatusPages: 9999, customDomain: true, removeBranding: true },
  },
};

export function getCapabilitiesForTier(tier: TierName): PlanCapabilities {
  return PLAN_CAPABILITIES[tier];
}

export function getDashboardLimitForTier(tier: TierName): number {
  return PLAN_CAPABILITIES[tier].dashboards.maxDashboards;
}

export function getMaxMembersForTier(tier: TierName): number {
  return PLAN_CAPABILITIES[tier].dashboards.maxMembers;
}

export function isEmailReportsEnabled(tier: TierName): boolean {
  return PLAN_CAPABILITIES[tier].emailReports.emailReportsEnabled;
}

export function getMaxRetentionDaysForTier(tier: TierName): number {
  return PLAN_CAPABILITIES[tier].dataRetention.maxDataRetentionDays;
}

export const MIN_DATA_RETENTION_DAYS = 180;
