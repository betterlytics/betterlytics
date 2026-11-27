import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth/api-auth', () => ({ resolveDashboardAuthResult: vi.fn() }));
vi.mock('@/services/analytics/heatmapCaptures.service', () => ({
  HeatmapCapturesForbiddenError: class extends Error {},
  openCaptureSnapshot: vi.fn(),
}));

import { gzipSync } from 'node:zlib';
import { NextRequest } from 'next/server';
import { resolveDashboardAuthResult } from '@/auth/api-auth';
import { openCaptureSnapshot } from '@/services/analytics/heatmapCaptures.service';
import { GET } from './route';

const resolveAuth = vi.mocked(resolveDashboardAuthResult);
const openSnapshot = vi.mocked(openCaptureSnapshot);

const EVENTS = '[{"type":4,"data":{"href":"https://example.com/"}}]';

function get(captureId = 'cap-1') {
  const request = new NextRequest(`http://localhost/api/heatmap/captures/${captureId}?dashboardId=dash-1`);
  return GET(request, { params: Promise.resolve({ captureId }) });
}

beforeEach(() => {
  vi.clearAllMocks();
  resolveAuth.mockResolvedValue({
    context: { dashboardId: 'dash-1', siteId: 'site-1', userId: 'user-1', role: 'viewer', isDemo: false },
  });
});

describe('GET /api/heatmap/captures/[captureId]', () => {
  it('sends a gzipped S3 snapshot as a gzip payload, since Next drops a Content-Encoding', async () => {
    openSnapshot.mockResolvedValue({ body: new Blob([gzipSync(EVENTS)]).stream(), contentEncoding: 'gzip' });

    const response = await get();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/gzip');
    expect(response.headers.get('Content-Encoding')).toBeNull();
    expect(await new Response(response.body!.pipeThrough(new DecompressionStream('gzip'))).text()).toBe(EVENTS);
  });

  it('compresses a snapshot stored as text in ClickHouse', async () => {
    openSnapshot.mockResolvedValue({ body: EVENTS });

    const response = await get();

    expect(response.headers.get('Content-Type')).toBe('application/gzip');
    expect(await new Response(response.body!.pipeThrough(new DecompressionStream('gzip'))).text()).toBe(EVENTS);
  });

  it('sends a plain S3 snapshot stream as JSON', async () => {
    openSnapshot.mockResolvedValue({ body: new Blob([EVENTS]).stream() });

    const response = await get();

    expect(response.headers.get('Content-Type')).toBe('application/json');
    expect(await response.text()).toBe(EVENTS);
  });

  it('refuses a user loading too many snapshots at once', async () => {
    let open = () => {};
    const gate = new Promise<void>((resolve) => (open = resolve));
    openSnapshot.mockImplementation(async () => {
      await gate;
      return { body: EVENTS };
    });

    const pending = [get(), get(), get()];
    await vi.waitFor(() => expect(openSnapshot).toHaveBeenCalledTimes(3));
    expect((await get()).status).toBe(429);

    open();
    expect((await Promise.all(pending)).map((response) => response.status)).toEqual([200, 200, 200]);
    expect((await get()).status).toBe(200);
  });

  it('returns 404 for a capture that is gone', async () => {
    openSnapshot.mockResolvedValue(null);

    expect((await get()).status).toBe(404);
  });
});
