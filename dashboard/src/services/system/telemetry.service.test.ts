import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockEnv, repo } = vi.hoisted(() => ({
  mockEnv: {
    IS_CLOUD: false,
    APP_VERSION: 'v1.6.0',
    TELEMETRY_ENABLED: undefined as string | undefined,
    DO_NOT_TRACK: undefined as string | undefined,
    TELEMETRY_ENDPOINT: 'https://betterlytics.io/telemetry',
    BACKGROUND_JOBS_ENABLED: true,
  },
  repo: {
    getOrCreateTelemetryInstance: vi.fn(),
    findTelemetryInstance: vi.fn(),
    markTelemetryDelivered: vi.fn(),
  },
}));

vi.mock('@/lib/env', () => ({ env: mockEnv }));
vi.mock('@/repositories/postgres/telemetryInstance.repository', () => repo);

import { getTelemetryStatus, sendTelemetryPingIfDue } from './telemetry.service';

const INSTANCE_ID = '9b2f6c1e-3a4d-4e5f-8a6b-7c8d9e0f1a2b';
const NOW = new Date('2026-10-03T12:00:00Z');
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const fetchMock = vi.fn();

function instanceSentAgo(ms: number | null, createdAgo = 30 * DAY_MS) {
  return {
    instanceId: INSTANCE_ID,
    lastSentAt: ms === null ? null : new Date(NOW.getTime() - ms),
    createdAt: new Date(NOW.getTime() - createdAgo),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  Object.assign(mockEnv, {
    IS_CLOUD: false,
    APP_VERSION: 'v1.6.0',
    TELEMETRY_ENABLED: undefined,
    DO_NOT_TRACK: undefined,
    BACKGROUND_JOBS_ENABLED: true,
  });
  repo.getOrCreateTelemetryInstance.mockResolvedValue(instanceSentAgo(null));
  repo.findTelemetryInstance.mockResolvedValue(instanceSentAgo(null));
  fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('sendTelemetryPingIfDue', () => {
  it('skips without fetching when the policy is off', async () => {
    mockEnv.TELEMETRY_ENABLED = 'false';

    expect(await sendTelemetryPingIfDue(NOW)).toEqual({ outcome: 'skipped_policy' });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(repo.getOrCreateTelemetryInstance).not.toHaveBeenCalled();
  });

  it('skips without fetching when the version is invalid', async () => {
    mockEnv.APP_VERSION = 'v1.6';

    expect(await sendTelemetryPingIfDue(NOW)).toEqual({ outcome: 'invalid_version' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ['1h', HOUR_MS],
    ['23h29m', 23 * HOUR_MS + 29 * 60 * 1000],
  ])('skips when the last delivery was %s ago', async (_label, ago) => {
    repo.getOrCreateTelemetryInstance.mockResolvedValue(instanceSentAgo(ago));

    expect(await sendTelemetryPingIfDue(NOW)).toEqual({ outcome: 'skipped_recent' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('holds the first send until 24h after the ID was created', async () => {
    repo.getOrCreateTelemetryInstance.mockResolvedValue(instanceSentAgo(null, 23 * HOUR_MS));

    expect(await sendTelemetryPingIfDue(NOW)).toEqual({ outcome: 'skipped_first_day' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends the first report once 24h have passed since the ID was created', async () => {
    repo.getOrCreateTelemetryInstance.mockResolvedValue(instanceSentAgo(null, DAY_MS));

    expect(await sendTelemetryPingIfDue(NOW)).toEqual({ outcome: 'delivered' });
  });

  it('sends when the last delivery was 23h31m ago', async () => {
    repo.getOrCreateTelemetryInstance.mockResolvedValue(instanceSentAgo(23 * HOUR_MS + 31 * 60 * 1000));

    expect(await sendTelemetryPingIfDue(NOW)).toEqual({ outcome: 'delivered' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('marks the ping delivered on a 204', async () => {
    expect(await sendTelemetryPingIfDue(NOW)).toEqual({ outcome: 'delivered' });
    expect(repo.markTelemetryDelivered).toHaveBeenCalledWith(NOW);
  });

  it('reports an http_error and does not mark delivery on a 503', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 503 }));

    expect(await sendTelemetryPingIfDue(NOW)).toEqual({ outcome: 'http_error', status: 503 });
    expect(repo.markTelemetryDelivered).not.toHaveBeenCalled();
  });

  it('reports a network_error when fetch throws', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));

    expect(await sendTelemetryPingIfDue(NOW)).toEqual({ outcome: 'network_error' });
    expect(repo.markTelemetryDelivered).not.toHaveBeenCalled();
  });

  it('posts exactly the instance ID and version as JSON without following redirects', async () => {
    await sendTelemetryPingIfDue(NOW);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://betterlytics.io/telemetry');
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ 'content-type': 'application/json' });
    expect(init.redirect).toBe('error');
    expect(JSON.parse(init.body)).toEqual({ instance_id: INSTANCE_ID, version: 'v1.6.0' });
  });
});

describe('getTelemetryStatus', () => {
  it('makes no repository call on cloud', async () => {
    mockEnv.IS_CLOUD = true;

    const status = await getTelemetryStatus();

    expect(status.policy).toEqual({ enabled: false, reason: 'cloud' });
    expect(status.payload).toBeNull();
    expect(repo.getOrCreateTelemetryInstance).not.toHaveBeenCalled();
    expect(repo.findTelemetryInstance).not.toHaveBeenCalled();
  });

  it('only looks up an existing ID when disabled', async () => {
    mockEnv.TELEMETRY_ENABLED = 'false';
    repo.findTelemetryInstance.mockResolvedValue(null);

    const status = await getTelemetryStatus();

    expect(repo.findTelemetryInstance).toHaveBeenCalledTimes(1);
    expect(repo.getOrCreateTelemetryInstance).not.toHaveBeenCalled();
    expect(status.payload).toBeNull();
  });

  it('does not mint an ID when background jobs are off', async () => {
    mockEnv.BACKGROUND_JOBS_ENABLED = false;

    await getTelemetryStatus();

    expect(repo.getOrCreateTelemetryInstance).not.toHaveBeenCalled();
    expect(repo.findTelemetryInstance).toHaveBeenCalledTimes(1);
  });

  it('returns the exact payload when enabled', async () => {
    const status = await getTelemetryStatus();

    expect(repo.getOrCreateTelemetryInstance).toHaveBeenCalledTimes(1);
    expect(status.payload).toEqual({ instance_id: INSTANCE_ID, version: 'v1.6.0' });
  });
});
