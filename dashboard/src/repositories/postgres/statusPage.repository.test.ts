import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  findStatusPageByCustomDomain,
  getPublishedStatusPageByCustomDomain,
  getPublishedStatusPageBySlug,
  getStatusPageImageBySlug,
} from '@/repositories/postgres/statusPage.repository';

const prismaMock = vi.hoisted(() => ({
  statusPage: { findFirst: vi.fn() },
  statusPageImage: { findFirst: vi.fn() },
}));

vi.mock('@/lib/postgres', () => ({ default: prismaMock }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('public status page lookups', () => {
  it('only resolves a published page by slug on a live dashboard', async () => {
    prismaMock.statusPage.findFirst.mockResolvedValue(null);

    expect(await getPublishedStatusPageBySlug('acme')).toBeNull();
    expect(prismaMock.statusPage.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: 'acme', isPublished: true, deletedAt: null, dashboard: { deletedAt: null } },
      }),
    );
  });

  it('only resolves a published page by custom domain on a live dashboard', async () => {
    prismaMock.statusPage.findFirst.mockResolvedValue(null);

    expect(await getPublishedStatusPageByCustomDomain('status.acme.com')).toBeNull();
    expect(prismaMock.statusPage.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          customDomain: 'status.acme.com',
          isPublished: true,
          deletedAt: null,
          dashboard: { deletedAt: null },
        },
      }),
    );
  });

  it('only serves images of pages on a live dashboard', async () => {
    prismaMock.statusPageImage.findFirst.mockResolvedValue(null);

    expect(await getStatusPageImageBySlug('acme', 'logo')).toBeNull();
    expect(prismaMock.statusPageImage.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { kind: 'logo', statusPage: { slug: 'acme', deletedAt: null, dashboard: { deletedAt: null } } },
      }),
    );
  });
});

describe('findStatusPageByCustomDomain', () => {
  const row = { id: 'sp1', dashboardId: 'd1', slug: 'acme', isPublished: true };

  it('still resolves the page of a deleted dashboard, flagged, so its host keeps routing to the status page', async () => {
    prismaMock.statusPage.findFirst.mockResolvedValue({ ...row, dashboard: { deletedAt: new Date() } });

    expect(await findStatusPageByCustomDomain('status.acme.com')).toEqual({ ...row, isDashboardDeleted: true });
    expect(prismaMock.statusPage.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { customDomain: 'status.acme.com', deletedAt: null } }),
    );
  });

  it('flags the page of a live dashboard as not deleted', async () => {
    prismaMock.statusPage.findFirst.mockResolvedValue({ ...row, dashboard: { deletedAt: null } });

    expect(await findStatusPageByCustomDomain('status.acme.com')).toEqual({ ...row, isDashboardDeleted: false });
  });

  it('returns null when no live page claims the domain', async () => {
    prismaMock.statusPage.findFirst.mockResolvedValue(null);

    expect(await findStatusPageByCustomDomain('status.acme.com')).toBeNull();
  });
});
