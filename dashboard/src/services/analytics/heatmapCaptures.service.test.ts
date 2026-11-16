import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AuthContext } from '@/entities/auth/authContext.entities';

vi.mock('next-intl/server', () => ({ getTranslations: vi.fn(async () => (key: string) => key) }));
vi.mock('@/lib/env', () => ({ replayStorage: 'clickhouse', s3Env: { enabled: false, bucket: undefined } }));
vi.mock('@/services/auth/auth.service', () => ({ isPublicDashboardId: vi.fn(() => false) }));
vi.mock('@/repositories/postgres/heatmapCaptures.repository', () => ({
  createHeatmapCaptureLink: vi.fn(),
  deleteHeatmapCaptureRow: vi.fn(),
  findHeatmapCaptureLocation: vi.fn(),
  findHeatmapCaptures: vi.fn(),
}));
vi.mock('@/repositories/heatmapCaptureSnapshots.repository', () => ({ captureSnapshotStoreFor: vi.fn() }));

import { createHeatmapCaptureLink } from '@/repositories/postgres/heatmapCaptures.repository';
import { createCaptureLink } from '@/services/analytics/heatmapCaptures.service';

const createLinkRow = vi.mocked(createHeatmapCaptureLink);

const ctx: AuthContext = {
  dashboardId: 'dash-1',
  siteId: 'site-1',
  userId: 'user-1',
  role: 'editor',
  isDemo: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  createLinkRow.mockResolvedValue({ expiresAt: new Date('2030-01-01T00:15:00Z') });
});

describe('createCaptureLink', () => {
  it('binds a plain page path link to that page', async () => {
    await createCaptureLink(ctx, { path: '/pricing', device: 'desktop' });

    expect(createLinkRow).toHaveBeenCalledWith(
      'dash-1',
      'user-1',
      { path: '/pricing', device: 'desktop', capturePath: '/pricing' },
      expect.any(String),
    );
  });

  it('binds a wildcard page path link to the real page picked, without its query string', async () => {
    await createCaptureLink(ctx, {
      path: '/profile/*/posts',
      device: 'desktop',
      capturePath: '/profile/betterlytics/posts?tab=new',
    });

    expect(createLinkRow).toHaveBeenCalledWith(
      'dash-1',
      'user-1',
      { path: '/profile/*/posts', device: 'desktop', capturePath: '/profile/betterlytics/posts' },
      expect.any(String),
    );
  });

  it('asks for a real page when the page path has a wildcard', async () => {
    await expect(createCaptureLink(ctx, { path: '/profile/*/posts', device: 'desktop' })).rejects.toThrow(
      'capturePathRequired',
    );
    expect(createLinkRow).not.toHaveBeenCalled();
  });

  it.each([
    ['/profile/*/posts', '/settings'],
    ['/pricing', '/about'],
  ])('refuses %s captured from %s', async (path, capturePath) => {
    await expect(createCaptureLink(ctx, { path, device: 'desktop', capturePath })).rejects.toThrow('pageMismatch');
    expect(createLinkRow).not.toHaveBeenCalled();
  });
});
