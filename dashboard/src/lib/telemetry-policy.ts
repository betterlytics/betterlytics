import {
  TELEMETRY_MAX_VERSION_LENGTH,
  TELEMETRY_VERSION_REGEX,
  type TelemetryPayload,
  type TelemetryPolicy,
  type TelemetryStatus,
} from '@/entities/system/telemetry.entities';

const TRUE_VALUES = new Set(['true', '1', 'yes', 'on']);
const FALSE_VALUES = new Set(['false', '0', 'no', 'off']);

export const TELEMETRY_DOCS_URL = 'https://betterlytics.io/docs/installation/self-hosting#telemetry';

export type TelemetryPolicyInput = {
  isCloud: boolean;
  appVersion: string;
  telemetryEnabled?: string;
  doNotTrack?: string;
};

export function resolveTelemetryPolicy(input: TelemetryPolicyInput): TelemetryPolicy {
  if (input.isCloud) return { enabled: false, reason: 'cloud' };
  if (input.appVersion === 'dev') return { enabled: false, reason: 'dev_build' };

  const doNotTrack = input.doNotTrack?.trim().toLowerCase();
  if (doNotTrack && doNotTrack !== '0' && doNotTrack !== 'false')
    return { enabled: false, reason: 'do_not_track' };

  const raw = input.telemetryEnabled?.trim().toLowerCase();
  if (!raw || TRUE_VALUES.has(raw)) return { enabled: true };
  if (FALSE_VALUES.has(raw)) return { enabled: false, reason: 'disabled_by_env' };
  return { enabled: false, reason: 'invalid_value' };
}

export function isValidTelemetryVersion(version: string): boolean {
  return version.length <= TELEMETRY_MAX_VERSION_LENGTH && TELEMETRY_VERSION_REGEX.test(version);
}

export function buildTelemetryPayload(instanceId: string, appVersion: string): TelemetryPayload {
  return { instance_id: instanceId, version: appVersion };
}

export function describeTelemetryState(status: TelemetryStatus): string {
  const { policy } = status;

  if (policy.enabled) {
    if (!status.backgroundJobsEnabled) {
      return '[telemetry] Enabled but inactive: BACKGROUND_JOBS_ENABLED=false stops the daily ping. Nothing is sent.';
    }
    return [
      `[telemetry] Enabled. Once a day this instance sends ${JSON.stringify(status.payload)} to ${status.endpoint}.`,
      '[telemetry] No IP address or other data is stored. To turn it off set TELEMETRY_ENABLED=false in .env and restart.',
      `[telemetry] Details: ${TELEMETRY_DOCS_URL}`,
    ].join('\n');
  }

  switch (policy.reason) {
    case 'disabled_by_env':
      return '[telemetry] Disabled (TELEMETRY_ENABLED=false). Nothing is sent.';
    case 'do_not_track':
      return '[telemetry] Disabled (DO_NOT_TRACK is set). Nothing is sent.';
    case 'invalid_value':
      return '[telemetry] Disabled: TELEMETRY_ENABLED has an unrecognised value; use true or false. Nothing is sent.';
    case 'dev_build':
      return '[telemetry] Disabled for development builds (APP_VERSION=dev). Nothing is sent.';
    case 'cloud':
      return '[telemetry] Disabled on Betterlytics Cloud. Nothing is sent.';
  }
}
