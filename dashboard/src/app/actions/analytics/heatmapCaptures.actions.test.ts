import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DashboardRole } from '@prisma/client';

vi.mock('@/auth/api-auth', () => ({
  getCachedSession: vi.fn(),
  getCachedAuthorizedContext: vi.fn(),
  resolveDashboardAuthResult: vi.fn(),
  executeWithDemoCache: vi.fn(),
  getFnSignature: vi.fn(() => 'heatmapCaptures.actions'),
}));

vi.mock('@/services/analytics/heatmapCaptures.service', () => ({
  createCaptureLink: vi.fn(),
  deleteCapture: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  unstable_rethrow: vi.fn(),
}));

import { getCachedSession, getCachedAuthorizedContext } from '@/auth/api-auth';
import { createCaptureLink, deleteCapture } from '@/services/analytics/heatmapCaptures.service';
import {
  createHeatmapCaptureLinkAction,
  deleteHeatmapCaptureAction,
} from '@/app/actions/analytics/heatmapCaptures.actions';

const session = vi.mocked(getCachedSession);
const authorizedContext = vi.mocked(getCachedAuthorizedContext);
const createLink = vi.mocked(createCaptureLink);
const removeCapture = vi.mocked(deleteCapture);

const expiresAt = new Date('2030-01-01T00:15:00Z');

function asMember(role: DashboardRole) {
  session.mockResolvedValue({
    user: { id: 'user-1' },
    session: { token: 'session-token', expiresAt: new Date('2030-01-01') },
  } as Awaited<ReturnType<typeof getCachedSession>>);
  authorizedContext.mockResolvedValue({
    dashboardId: 'dash-1',
    siteId: 'site-1',
    userId: 'user-1',
    role,
    isDemo: false,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  createLink.mockResolvedValue({ token: 'bhc_plain', expiresAt });
  removeCapture.mockResolvedValue(undefined);
});

describe('heatmap capture actions', () => {
  it('refuses a capture link to a viewer', async () => {
    asMember('viewer');

    await expect(createHeatmapCaptureLinkAction('dash-1', { path: '/', device: 'mobile' })).rejects.toThrow(
      'You do not have permission to perform this action',
    );
    expect(createLink).not.toHaveBeenCalled();
  });

  it('refuses capture deletion to a viewer', async () => {
    asMember('viewer');

    await expect(deleteHeatmapCaptureAction('dash-1', 'capture-1')).rejects.toThrow(
      'You do not have permission to perform this action',
    );
    expect(removeCapture).not.toHaveBeenCalled();
  });

  it.each<DashboardRole>(['owner', 'admin', 'editor'])('gives role %s a capture link', async (role) => {
    asMember(role);

    await expect(
      createHeatmapCaptureLinkAction('dash-1', { path: '/pricing', device: 'tablet' }),
    ).resolves.toEqual({ token: 'bhc_plain', expiresAt });
    expect(createLink).toHaveBeenCalledWith(expect.objectContaining({ dashboardId: 'dash-1', userId: 'user-1' }), {
      path: '/pricing',
      device: 'tablet',
    });
  });

  it.each<DashboardRole>(['owner', 'admin', 'editor'])('lets role %s delete a capture', async (role) => {
    asMember(role);

    await deleteHeatmapCaptureAction('dash-1', 'capture-1');

    expect(removeCapture).toHaveBeenCalledWith(expect.objectContaining({ dashboardId: 'dash-1' }), 'capture-1');
  });

  it('passes the real page to capture on to the service', async () => {
    asMember('editor');
    const input = { path: '/profile/*/posts', device: 'desktop', capturePath: '/profile/betterlytics/posts?tab=new' } as const;

    await expect(createHeatmapCaptureLinkAction('dash-1', input)).resolves.toEqual({ token: 'bhc_plain', expiresAt });
    expect(createLink).toHaveBeenCalledWith(expect.objectContaining({ dashboardId: 'dash-1' }), input);
  });

  it.each(['/profile/betterlytics/posts#top', '/profile/*/posts', '//evil.example/profile/x/posts', '/\\evil.example'])(
    'refuses %s as a real page to capture',
    async (capturePath) => {
      asMember('editor');

      await expect(
        createHeatmapCaptureLinkAction('dash-1', { path: '/profile/*/posts', device: 'desktop', capturePath }),
      ).rejects.toThrow('An error occurred');
      expect(createLink).not.toHaveBeenCalled();
    },
  );

  it('rejects a link for a path that is not a page path', async () => {
    asMember('editor');

    await expect(
      createHeatmapCaptureLinkAction('dash-1', { path: 'https://evil.example/', device: 'mobile' }),
    ).rejects.toThrow();
    expect(createLink).not.toHaveBeenCalled();
  });
});
