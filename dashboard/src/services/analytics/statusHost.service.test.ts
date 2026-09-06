import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { STATUS_HOST_LIMITS as L } from './statusHost.service';

const findStatusPageByCustomDomain = vi.fn();

vi.mock('@/repositories/postgres/statusPage.repository', () => ({
  findStatusPageByCustomDomain: (domain: string) => findStatusPageByCustomDomain(domain),
}));

vi.mock('@/lib/feature-flags', () => ({
  isFeatureEnabled: () => true,
}));

type Service = typeof import('./statusHost.service');
type Classify = Service['classifyStatusHost'];

const ROW = { id: 'sp1', dashboardId: 'd1', slug: 'acme', isPublished: true };
const UNPUBLISHED_ROW = { ...ROW, isPublished: false };

async function loadService(): Promise<Service> {
  vi.resetModules();
  return import('./statusHost.service');
}

function pendingForever(): Promise<never> {
  return new Promise(() => {});
}

function flushPromises(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

function goStale(): void {
  vi.advanceTimersByTime(L.freshMs + 1);
}

function nextWindow(): void {
  vi.advanceTimersByTime(L.globalWindowMs + 1);
}

async function classifyColdHosts(classify: Classify, prefix: string, count: number): Promise<void> {
  for (let i = 0; i < count; i++) {
    if (i > 0 && i % L.globalMaxLookups === 0) nextWindow();
    await classify(`${prefix}-${i}.example.com`);
  }
}

describe('classifyStatusHost', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });
    findStatusPageByCustomDomain.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('classifies a row as status and no row as unknown, one query each', async () => {
    const { classifyStatusHost } = await loadService();
    findStatusPageByCustomDomain.mockResolvedValueOnce(ROW).mockResolvedValueOnce(null);

    expect(await classifyStatusHost('status.acme.com')).toBe('status');
    expect(await classifyStatusHost('other.com')).toBe('unknown');
    expect(await classifyStatusHost('status.acme.com')).toBe('status');
    expect(await classifyStatusHost('other.com')).toBe('unknown');
    expect(findStatusPageByCustomDomain).toHaveBeenCalledTimes(2);
  });

  it('treats an unpublished row as a status host', async () => {
    const { classifyStatusHost } = await loadService();
    findStatusPageByCustomDomain.mockResolvedValueOnce(UNPUBLISHED_ROW);

    expect(await classifyStatusHost('status.acme.com')).toBe('status');
  });

  it('coalesces concurrent lookups for one cold host', async () => {
    const { classifyStatusHost } = await loadService();
    findStatusPageByCustomDomain.mockResolvedValueOnce(ROW);

    const results = await Promise.all([classifyStatusHost('status.acme.com'), classifyStatusHost('status.acme.com')]);

    expect(results).toEqual(['status', 'status']);
    expect(findStatusPageByCustomDomain).toHaveBeenCalledTimes(1);
  });

  it('is unavailable on error without a prior answer and stale status with one', async () => {
    const { classifyStatusHost } = await loadService();
    findStatusPageByCustomDomain.mockRejectedValueOnce(new Error('db down'));
    expect(await classifyStatusHost('cold.com')).toBe('unavailable');

    findStatusPageByCustomDomain.mockResolvedValueOnce(ROW);
    expect(await classifyStatusHost('status.acme.com')).toBe('status');

    goStale();
    findStatusPageByCustomDomain.mockRejectedValueOnce(new Error('db down'));
    expect(await classifyStatusHost('status.acme.com')).toBe('status');
    await flushPromises();
    findStatusPageByCustomDomain.mockRejectedValueOnce(new Error('db down'));
    expect(await classifyStatusHost('status.acme.com')).toBe('status');
  });

  it('re-queries a status host once fresh expires and an unknown host once its ttl expires', async () => {
    const { classifyStatusHost } = await loadService();
    findStatusPageByCustomDomain.mockResolvedValue(ROW);
    await classifyStatusHost('status.acme.com');
    vi.advanceTimersByTime(L.freshMs - 1);
    await classifyStatusHost('status.acme.com');
    expect(findStatusPageByCustomDomain).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(2);
    await classifyStatusHost('status.acme.com');
    await flushPromises();
    expect(findStatusPageByCustomDomain).toHaveBeenCalledTimes(2);

    findStatusPageByCustomDomain.mockResolvedValue(null);
    await classifyStatusHost('other.com');
    vi.advanceTimersByTime(L.unknownTtlMs - 1);
    await classifyStatusHost('other.com');
    expect(findStatusPageByCustomDomain).toHaveBeenCalledTimes(3);
    vi.advanceTimersByTime(2);
    await classifyStatusHost('other.com');
    expect(findStatusPageByCustomDomain).toHaveBeenCalledTimes(4);
  });

  it('answers a stale known host immediately while a slow refresh is pending', async () => {
    const { classifyStatusHost } = await loadService();
    findStatusPageByCustomDomain.mockResolvedValueOnce(ROW);
    await classifyStatusHost('status.acme.com');

    goStale();
    findStatusPageByCustomDomain.mockImplementation(pendingForever);
    expect(await classifyStatusHost('status.acme.com')).toBe('status');
    expect(await classifyStatusHost('status.acme.com')).toBe('status');
    expect(findStatusPageByCustomDomain).toHaveBeenCalledTimes(2);
  });

  it('gives a cold host up after the deadline and keeps the single query running', async () => {
    const { classifyStatusHost } = await loadService();
    let resolveLookup: (row: typeof ROW) => void = () => {};
    findStatusPageByCustomDomain.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveLookup = resolve;
        }),
    );

    const first = classifyStatusHost('status.acme.com');
    await vi.advanceTimersByTimeAsync(L.lookupDeadlineMs);
    expect(await first).toBe('unavailable');

    const retry = classifyStatusHost('status.acme.com');
    await vi.advanceTimersByTimeAsync(L.lookupDeadlineMs);
    expect(await retry).toBe('unavailable');
    expect(findStatusPageByCustomDomain).toHaveBeenCalledTimes(1);

    resolveLookup(ROW);
    await flushPromises();
    expect(await classifyStatusHost('status.acme.com')).toBe('status');
    expect(findStatusPageByCustomDomain).toHaveBeenCalledTimes(1);
  });

  it('forgets a domain once the refresh finds no row', async () => {
    const { classifyStatusHost } = await loadService();
    findStatusPageByCustomDomain.mockResolvedValueOnce(ROW);
    await classifyStatusHost('status.acme.com');

    goStale();
    findStatusPageByCustomDomain.mockResolvedValueOnce(null);
    await classifyStatusHost('status.acme.com');
    await flushPromises();
    expect(await classifyStatusHost('status.acme.com')).toBe('unknown');

    vi.advanceTimersByTime(L.unknownTtlMs + 1);
    findStatusPageByCustomDomain.mockRejectedValueOnce(new Error('db down'));
    expect(await classifyStatusHost('status.acme.com')).toBe('unavailable');
  });

  it('drops a known host not refreshed within the retention period', async () => {
    const { classifyStatusHost } = await loadService();
    findStatusPageByCustomDomain.mockResolvedValueOnce(ROW);
    await classifyStatusHost('status.acme.com');

    vi.advanceTimersByTime(L.retainMs + 1);
    findStatusPageByCustomDomain.mockRejectedValueOnce(new Error('db down'));
    expect(await classifyStatusHost('status.acme.com')).toBe('unavailable');
  });

  it('evicts the oldest known host past the cap unless it was refreshed', async () => {
    const { classifyStatusHost } = await loadService();
    findStatusPageByCustomDomain.mockResolvedValue(ROW);

    await classifyColdHosts(classifyStatusHost, 'host', L.statusMaxEntries);
    goStale();
    await classifyStatusHost('host-0.example.com');
    await flushPromises();
    await classifyStatusHost(`host-${L.statusMaxEntries}.example.com`);

    findStatusPageByCustomDomain.mockRejectedValue(new Error('db down'));
    goStale();
    expect(await classifyStatusHost('host-0.example.com')).toBe('status');
    expect(await classifyStatusHost('host-1.example.com')).toBe('unavailable');
  });

  it('refuses cold hosts past the global lookup ceiling but keeps known ones', async () => {
    const { classifyStatusHost } = await loadService();
    findStatusPageByCustomDomain.mockResolvedValue(ROW);
    await classifyStatusHost('status.acme.com');

    findStatusPageByCustomDomain.mockResolvedValue(null);
    await classifyColdHosts(classifyStatusHost, 'spray', L.globalMaxLookups - 1);
    expect(await classifyStatusHost('spray-over.example.com')).toBe('unavailable');
    expect(findStatusPageByCustomDomain).toHaveBeenCalledTimes(L.globalMaxLookups);

    goStale();
    expect(await classifyStatusHost('status.acme.com')).toBe('status');
  });
});
