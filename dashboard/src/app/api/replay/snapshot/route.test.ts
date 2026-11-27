import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth/api-auth', () => ({ resolveDashboardAuthResult: vi.fn() }));
vi.mock('@/services/analytics/sessionReplays.service', () => ({ openReplaySnapshotEvents: vi.fn() }));

import { NextRequest } from 'next/server';
import { resolveDashboardAuthResult } from '@/auth/api-auth';
import { openReplaySnapshotEvents } from '@/services/analytics/sessionReplays.service';
import { GET } from './route';

const resolveAuth = vi.mocked(resolveDashboardAuthResult);
const openEvents = vi.mocked(openReplaySnapshotEvents);

const EVENTS = '[{"type":2,"data":{}}]';
const QUERY = 'dashboardId=dash-1&sessionId=42&filename=1764000000000-abc.json&snapshotMs=1764000000000';

function get(query = QUERY) {
  return GET(new NextRequest(`http://localhost/api/replay/snapshot?${query}`));
}

function member(isDemo = false) {
  return { context: { dashboardId: 'dash-1', siteId: 'site-1', userId: 'user-1', role: 'viewer', isDemo } };
}

beforeEach(() => {
  vi.clearAllMocks();
  resolveAuth.mockResolvedValue(member() as Awaited<ReturnType<typeof resolveDashboardAuthResult>>);
});

describe('GET /api/replay/snapshot', () => {
  it('sends the events as a gzip payload, cached for a day once complete', async () => {
    openEvents.mockResolvedValue({ events: EVENTS, complete: true });

    const response = await get();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/gzip');
    expect(response.headers.get('Cache-Control')).toBe('private, max-age=86400, immutable');
    expect(await new Response(response.body!.pipeThrough(new DecompressionStream('gzip'))).text()).toBe(EVENTS);
  });

  it('caches briefly while the segment after the snapshot is still to come', async () => {
    openEvents.mockResolvedValue({ events: EVENTS, complete: false });

    expect((await get()).headers.get('Cache-Control')).toBe('private, max-age=60');
  });

  it('returns 404 for a segment that is gone', async () => {
    openEvents.mockResolvedValue(null);

    expect((await get()).status).toBe(404);
  });

  it('gives public views no replay layout', async () => {
    resolveAuth.mockResolvedValue(member(true) as Awaited<ReturnType<typeof resolveDashboardAuthResult>>);

    expect((await get()).status).toBe(404);
    expect(openEvents).not.toHaveBeenCalled();
  });

  it('refuses a filename that is not a segment', async () => {
    expect((await get(QUERY.replace('1764000000000-abc.json', '../x.json'))).status).toBe(400);
  });
});
