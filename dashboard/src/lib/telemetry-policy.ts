import {
  TELEMETRY_MAX_VERSION_LENGTH,
  TELEMETRY_VERSION_REGEX,
  type TelemetryDisabledReason,
  type TelemetryPayload,
  type TelemetryPolicy,
  type TelemetryStatus,
} from '@/entities/system/telemetry.entities';

const TRUE_VALUES = new Set(['true', '1', 'yes', 'on']);
const FALSE_VALUES = new Set(['false', '0', 'no', 'off']);

export const TELEMETRY_DOCS_URL = 'https://betterlytics.io/docs/installation/self-hosting#telemetry';
export const TELEMETRY_PRIVACY_URL = 'https://betterlytics.io/privacy';

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
  if (FALSE_VALUES.has(raw ?? '')) return { enabled: false, reason: 'disabled_by_env' };
  if (raw && !TRUE_VALUES.has(raw)) return { enabled: false, reason: 'invalid_value' };
  if (!isValidTelemetryVersion(input.appVersion)) return { enabled: false, reason: 'invalid_version' };
  return { enabled: true };
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
      `[telemetry] Enabled. Once a day this instance sends ${JSON.stringify(status.payload)} to ${status.endpoint}, so Betterlytics can count installs and versions.`,
      '[telemetry] The first report goes out 24 hours after telemetry was first enabled. Your IP address is not stored.',
      '[telemetry] To turn it off set TELEMETRY_ENABLED=false in .env and run: docker compose up -d --wait',
      `[telemetry] Details: ${TELEMETRY_DOCS_URL} Privacy: ${TELEMETRY_PRIVACY_URL}`,
    ].join('\n');
  }

  const disabled = describeDisabledReason(policy.reason);
  if (!status.payload) return disabled;
  return `${disabled}\n[telemetry] Instance ID for deletion requests: ${status.payload.instance_id}`;
}

function describeDisabledReason(reason: TelemetryDisabledReason): string {
  switch (reason) {
    case 'disabled_by_env':
      return '[telemetry] Disabled (TELEMETRY_ENABLED=false). Nothing is sent.';
    case 'do_not_track':
      return '[telemetry] Disabled (DO_NOT_TRACK is set). Nothing is sent.';
    case 'invalid_value':
      return '[telemetry] Disabled: TELEMETRY_ENABLED has an unrecognised value; use true or false. Nothing is sent.';
    case 'dev_build':
      return '[telemetry] Disabled for development builds (APP_VERSION=dev). Nothing is sent.';
    case 'invalid_version':
      return '[telemetry] Disabled: APP_VERSION is not a release version. Nothing is sent.';
    case 'cloud':
      return '[telemetry] Disabled on Betterlytics Cloud. Nothing is sent.';
  }
}
