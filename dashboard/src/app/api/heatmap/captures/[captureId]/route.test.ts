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

  it('sends a plain snapshot as JSON', async () => {
    openSnapshot.mockResolvedValue({ body: EVENTS });

    const response = await get();

    expect(response.headers.get('Content-Type')).toBe('application/json');
    expect(await response.text()).toBe(EVENTS);
  });

  it('returns 404 for a capture that is gone', async () => {
    openSnapshot.mockResolvedValue(null);

    expect((await get()).status).toBe(404);
  });
});
