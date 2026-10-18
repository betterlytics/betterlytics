import 'server-only';

import { env } from '@/lib/env';
import type { TelemetryPolicy, TelemetryStatus } from '@/entities/system/telemetry.entities';
import { buildTelemetryPayload, isValidTelemetryVersion, resolveTelemetryPolicy } from '@/lib/telemetry-policy';
import {
  findTelemetryInstance,
  getOrCreateTelemetryInstance,
  markTelemetryDelivered,
} from '@/repositories/postgres/telemetryInstance.repository';

const RESEND_AFTER_MS = 23.5 * 60 * 60 * 1000;
const SEND_TIMEOUT_MS = 5000;

export type TelemetrySendOutcome =
  | { outcome: 'skipped_policy' | 'skipped_recent' | 'delivered' | 'network_error' | 'invalid_version' }
  | { outcome: 'http_error'; status: number };

export function resolveCurrentTelemetryPolicy(): TelemetryPolicy {
  return resolveTelemetryPolicy({
    isCloud: env.IS_CLOUD,
    appVersion: env.APP_VERSION,
    telemetryEnabled: env.TELEMETRY_ENABLED,
    doNotTrack: env.DO_NOT_TRACK,
  });
}

export async function sendTelemetryPingIfDue(now: Date = new Date()): Promise<TelemetrySendOutcome> {
  if (!resolveCurrentTelemetryPolicy().enabled) return { outcome: 'skipped_policy' };
  if (!isValidTelemetryVersion(env.APP_VERSION)) return { outcome: 'invalid_version' };

  const instance = await getOrCreateTelemetryInstance();
  if (instance.lastSentAt && now.getTime() - instance.lastSentAt.getTime() < RESEND_AFTER_MS) {
    return { outcome: 'skipped_recent' };
  }

  let response: Response;
  try {
    response = await fetch(env.TELEMETRY_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(buildTelemetryPayload(instance.instanceId, env.APP_VERSION)),
      redirect: 'error',
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
  } catch {
    return { outcome: 'network_error' };
  }

  if (!response.ok) return { outcome: 'http_error', status: response.status };

  await markTelemetryDelivered(now);
  return { outcome: 'delivered' };
}

export async function getTelemetryStatus(): Promise<TelemetryStatus> {
  const policy = resolveCurrentTelemetryPolicy();
  const base = { policy, backgroundJobsEnabled: env.BACKGROUND_JOBS_ENABLED, endpoint: env.TELEMETRY_ENDPOINT };

  if (!policy.enabled && policy.reason === 'cloud') return { ...base, payload: null, lastSentAt: null };

  // Never mint an ID while telemetry is off
  const instance = policy.enabled ? await getOrCreateTelemetryInstance() : await findTelemetryInstance();

  return {
    ...base,
    payload: instance ? buildTelemetryPayload(instance.instanceId, env.APP_VERSION) : null,
    lastSentAt: instance?.lastSentAt ?? null,
  };
}
