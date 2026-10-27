import 'server-only';

import { env } from '@/lib/env';
import type { AvailableUpdate, UpdateCheckPolicy } from '@/entities/system/updateCheck.entities';
import {
  UPDATE_CHECK_LATEST_RELEASE_URL,
  resolveAvailableUpdate,
  resolveUpdateCheckPolicy,
} from '@/lib/update-check-policy';

const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;
// Shorter after a failure, so an air-gapped host doesn't wait a day after GitHub comes back nor retry every page load
const RETRY_AFTER_FAILURE_MS = 60 * 60 * 1000;
const CHECK_TIMEOUT_MS = 3000;

type UpdateCheckState = {
  entry?: { update: AvailableUpdate | null; expiresAt: number };
  inflight?: Promise<AvailableUpdate | null>;
};

// On globalThis so every route bundle shares one cache and one in-flight request
const globalForUpdateCheck = globalThis as unknown as { _updateCheckState?: UpdateCheckState };

export function resolveCurrentUpdateCheckPolicy(): UpdateCheckPolicy {
  return resolveUpdateCheckPolicy({
    isCloud: env.IS_CLOUD,
    appVersion: env.APP_VERSION,
    updateCheckEnabled: env.UPDATE_CHECK_ENABLED,
  });
}

export async function getAvailableUpdate(): Promise<AvailableUpdate | null> {
  if (!resolveCurrentUpdateCheckPolicy().enabled) return null;

  const state = (globalForUpdateCheck._updateCheckState ??= {});
  if (state.entry && Date.now() < state.entry.expiresAt) return state.entry.update;

  state.inflight ??= fetchAvailableUpdate()
    .then(({ update, ok }) => {
      state.entry = { update, expiresAt: Date.now() + (ok ? CHECK_INTERVAL_MS : RETRY_AFTER_FAILURE_MS) };
      return update;
    })
    .finally(() => {
      state.inflight = undefined;
    });

  return state.inflight;
}

async function fetchAvailableUpdate(): Promise<{ update: AvailableUpdate | null; ok: boolean }> {
  try {
    const response = await fetch(UPDATE_CHECK_LATEST_RELEASE_URL, {
      headers: {
        accept: 'application/vnd.github+json',
        'user-agent': 'Betterlytics-Update-Check',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
    });
    if (!response.ok) return { update: null, ok: false };
    return { update: resolveAvailableUpdate(await response.json(), env.APP_VERSION), ok: true };
  } catch {
    return { update: null, ok: false };
  }
}
