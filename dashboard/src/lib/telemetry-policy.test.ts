import { describe, it, expect } from 'vitest';
import type { TelemetryStatus } from '@/entities/system/telemetry.entities';
import {
  buildTelemetryPayload,
  describeTelemetryState,
  isValidTelemetryVersion,
  resolveTelemetryPolicy,
} from './telemetry-policy';

const SELF_HOST = { isCloud: false, appVersion: 'v1.6.0', telemetryEnabled: 'true' };

describe('resolveTelemetryPolicy', () => {
  it('is off on cloud regardless of the other inputs', () => {
    expect(
      resolveTelemetryPolicy({ isCloud: true, appVersion: 'v1.6.0', telemetryEnabled: 'true', doNotTrack: '' }),
    ).toEqual({ enabled: false, reason: 'cloud' });
    expect(resolveTelemetryPolicy({ isCloud: true, appVersion: 'dev' })).toEqual({
      enabled: false,
      reason: 'cloud',
    });
  });

  it('is off for dev builds', () => {
    expect(resolveTelemetryPolicy({ isCloud: false, appVersion: 'dev', telemetryEnabled: 'true' })).toEqual({
      enabled: false,
      reason: 'dev_build',
    });
  });

  it.each(['1', 'true', 'yes'])('is off when DO_NOT_TRACK=%s', (doNotTrack) => {
    expect(resolveTelemetryPolicy({ ...SELF_HOST, telemetryEnabled: 'true', doNotTrack })).toEqual({
      enabled: false,
      reason: 'do_not_track',
    });
  });

  it.each(['0', 'false', ''])('stays on when DO_NOT_TRACK=%j', (doNotTrack) => {
    expect(resolveTelemetryPolicy({ ...SELF_HOST, doNotTrack })).toEqual({ enabled: true });
  });

  it('is on only when TELEMETRY_ENABLED is exactly "true"', () => {
    expect(resolveTelemetryPolicy(SELF_HOST)).toEqual({ enabled: true });
  });

  it.each([undefined, '', 'false', 'TRUE', 'True', '1', 'yes', ' true'])(
    'is off when TELEMETRY_ENABLED=%j',
    (telemetryEnabled) => {
      expect(resolveTelemetryPolicy({ ...SELF_HOST, telemetryEnabled })).toEqual({
        enabled: false,
        reason: 'not_enabled',
      });
    },
  );

  it('is off when APP_VERSION is not a release version, so it never reports Enabled without sending', () => {
    expect(resolveTelemetryPolicy({ ...SELF_HOST, appVersion: 'v1.6' })).toEqual({
      enabled: false,
      reason: 'invalid_version',
    });
  });
});

describe('isValidTelemetryVersion', () => {
  it.each(['v1.5.1', '1.5.1', 'v1.5.1-rc.1', 'v1.3.0-hotfix-1.0'])('accepts %s', (version) => {
    expect(isValidTelemetryVersion(version)).toBe(true);
  });

  it.each(['dev', 'v1.5', 'v١.٢.٣', `v1.0.0-${'a'.repeat(42)}`])('rejects %s', (version) => {
    expect(isValidTelemetryVersion(version)).toBe(false);
  });

  it('rejects a 49-character value', () => {
    const version = `v1.0.0-${'a'.repeat(42)}`;
    expect(version).toHaveLength(49);
    expect(isValidTelemetryVersion(version)).toBe(false);
  });
});

describe('buildTelemetryPayload', () => {
  it('returns exactly the instance ID and version', () => {
    const payload = buildTelemetryPayload('9b2f6c1e-3a4d-4e5f-8a6b-7c8d9e0f1a2b', 'v1.6.0');
    expect(Object.keys(payload)).toEqual(['instance_id', 'version']);
    expect(payload).toEqual({ instance_id: '9b2f6c1e-3a4d-4e5f-8a6b-7c8d9e0f1a2b', version: 'v1.6.0' });
  });
});

describe('describeTelemetryState', () => {
  const payload = { instance_id: '9b2f6c1e-3a4d-4e5f-8a6b-7c8d9e0f1a2b', version: 'v1.6.0' };
  const base: TelemetryStatus = {
    policy: { enabled: true },
    backgroundJobsEnabled: true,
    endpoint: 'https://telemetry.betterlytics.io/v1/ping',
    payload,
  };

  it('prints the exact payload and endpoint when enabled', () => {
    const text = describeTelemetryState(base);
    expect(text).toContain(JSON.stringify(payload));
    expect(text).toContain('https://telemetry.betterlytics.io/v1/ping');
    expect(text).toContain('TELEMETRY_ENABLED=false');
    expect(text).toContain('24 hours');
    expect(text).toContain('https://betterlytics.io/privacy');
    expect(text.split('\n')).toHaveLength(4);
  });

  it('shows an existing instance ID when disabled, for deletion requests', () => {
    expect(describeTelemetryState({ ...base, policy: { enabled: false, reason: 'not_enabled' } })).toBe(
      '[telemetry] Disabled (TELEMETRY_ENABLED is not "true"). Nothing is sent.\n' +
        `[telemetry] Instance ID for deletion requests: ${payload.instance_id}`,
    );
  });

  it('says nothing is sent when background jobs are off', () => {
    expect(describeTelemetryState({ ...base, backgroundJobsEnabled: false })).toBe(
      '[telemetry] Enabled but inactive: BACKGROUND_JOBS_ENABLED=false stops the daily ping. Nothing is sent.',
    );
  });

  it.each([
    ['not_enabled', '[telemetry] Disabled (TELEMETRY_ENABLED is not "true"). Nothing is sent.'],
    ['do_not_track', '[telemetry] Disabled (DO_NOT_TRACK is set). Nothing is sent.'],
    ['dev_build', '[telemetry] Disabled for development builds (APP_VERSION=dev). Nothing is sent.'],
  ] as const)('describes %s', (reason, expected) => {
    expect(describeTelemetryState({ ...base, payload: null, policy: { enabled: false, reason } })).toBe(expected);
  });
});
