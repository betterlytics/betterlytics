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

/** Count limits at or above this read as unlimited. */
export const UNLIMITED_COUNT = 9999;

export function isUnlimitedCount(count: number): boolean {
  return count >= UNLIMITED_COUNT;
}

export function retentionYears(days: number): number {
  return Math.floor(days / 365);
}

export function checkIntervalMinutes(seconds: number): number {
  return seconds / 60;
}

export const MIN_DATA_RETENTION_DAYS = 180;

export const UNLIMITED_DATA_RETENTION_DAYS = -1;
