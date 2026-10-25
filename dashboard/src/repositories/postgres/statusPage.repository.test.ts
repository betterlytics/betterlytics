import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  findStatusPageByCustomDomain,
  getPublishedStatusPageByCustomDomain,
  getPublishedStatusPageBySlug,
  getStatusPageImageBySlug,
  releaseStatusPagesOfDeletedDashboards,
} from '@/repositories/postgres/statusPage.repository';

const prismaMock = vi.hoisted(() => ({
  statusPage: { findFirst: vi.fn(), updateManyAndReturn: vi.fn() },
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

  it('flags a live page whose dashboard is deleted', async () => {
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

describe('releaseStatusPagesOfDeletedDashboards', () => {
  it("soft-deletes only the dashboards' live pages, stamped with the dashboard's deletion time", async () => {
    const deletedAt = new Date('2026-10-25T10:00:00Z');
    prismaMock.statusPage.updateManyAndReturn.mockResolvedValue([{ slug: 'acme' }, { slug: 'acme-api' }]);

    const tx = prismaMock as unknown as Parameters<typeof releaseStatusPagesOfDeletedDashboards>[0];
    expect(await releaseStatusPagesOfDeletedDashboards(tx, ['d1', 'd2'], deletedAt)).toEqual(['acme', 'acme-api']);
    expect(prismaMock.statusPage.updateManyAndReturn).toHaveBeenCalledWith({
      where: { dashboardId: { in: ['d1', 'd2'] }, deletedAt: null },
      data: { deletedAt },
      select: { slug: true },
    });
  });
});
