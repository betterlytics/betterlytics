import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockEnv } = vi.hoisted(() => ({
  mockEnv: {
    IS_CLOUD: false,
    APP_VERSION: 'v1.5.1',
    UPDATE_CHECK_ENABLED: undefined as string | undefined,
  },
}));

vi.mock('@/lib/env', () => ({ env: mockEnv }));

import { getAvailableUpdate } from './updateCheck.service';

const NOW = new Date('2026-10-27T12:00:00Z');
const HOUR_MS = 60 * 60 * 1000;
const fetchMock = vi.fn();

function releaseResponse(tag: string) {
  return new Response(JSON.stringify({ tag_name: tag, draft: false, prerelease: false }), { status: 200 });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  delete (globalThis as { _updateCheckState?: unknown })._updateCheckState;
  Object.assign(mockEnv, { IS_CLOUD: false, APP_VERSION: 'v1.5.1', UPDATE_CHECK_ENABLED: undefined });
  fetchMock.mockImplementation(async () => releaseResponse('v1.6.0'));
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('getAvailableUpdate', () => {
  it('returns the newer release', async () => {
    await expect(getAvailableUpdate()).resolves.toMatchObject({ version: 'v1.6.0' });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/repos/betterlytics/betterlytics/releases/latest',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it.each([
    ['cloud', { IS_CLOUD: true }],
    ['a dev build', { APP_VERSION: 'dev' }],
    ['UPDATE_CHECK_ENABLED=false', { UPDATE_CHECK_ENABLED: 'false' }],
  ])('never fetches on %s', async (_label, overrides) => {
    Object.assign(mockEnv, overrides);
    await expect(getAvailableUpdate()).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('checks at most once a day', async () => {
    await getAvailableUpdate();
    vi.setSystemTime(NOW.getTime() + 23 * HOUR_MS);
    await getAvailableUpdate();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    vi.setSystemTime(NOW.getTime() + 24 * HOUR_MS + 1);
    await getAvailableUpdate();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('shares one request between concurrent callers', async () => {
    await Promise.all([getAvailableUpdate(), getAvailableUpdate(), getAvailableUpdate()]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('caches "no update" too', async () => {
    fetchMock.mockImplementation(async () => releaseResponse('v1.5.1'));
    await expect(getAvailableUpdate()).resolves.toBeNull();
    await getAvailableUpdate();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['a network error', () => Promise.reject(new TypeError('fetch failed'))],
    ['a rate limit', async () => new Response('{}', { status: 403 })],
    ['invalid JSON', async () => new Response('not json', { status: 200 })],
  ])('shows nothing after %s and waits a day before retrying', async (_label, impl) => {
    fetchMock.mockImplementation(impl);
    await expect(getAvailableUpdate()).resolves.toBeNull();

    vi.setSystemTime(NOW.getTime() + 23 * HOUR_MS);
    await getAvailableUpdate();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fetchMock.mockImplementation(async () => releaseResponse('v1.6.0'));
    vi.setSystemTime(NOW.getTime() + 24 * HOUR_MS + 1);
    await expect(getAvailableUpdate()).resolves.toMatchObject({ version: 'v1.6.0' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
