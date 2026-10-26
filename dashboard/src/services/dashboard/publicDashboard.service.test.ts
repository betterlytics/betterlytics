import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  class PublicSlugTakenError extends Error {}
  return {
    flags: { enablePublicDashboards: true },
    env: { DEMO_DASHBOARD_ID: undefined as string | undefined },
    PublicSlugTakenError,
  };
});

vi.mock('@/lib/feature-flags', () => ({
  isFeatureEnabled: (flag: keyof typeof mocks.flags) => mocks.flags[flag],
}));
vi.mock('@/lib/env', () => ({ env: mocks.env }));
vi.mock('next-intl/server', () => ({ getTranslations: vi.fn(async () => (key: string) => key) }));
vi.mock('@/repositories/postgres/dashboard.repository', () => ({
  findDashboardById: vi.fn(),
  findPublicDashboardSettings: vi.fn(),
  findTakenPublicSlugs: vi.fn(),
  updatePublicDashboardSettings: vi.fn(),
  PublicSlugTakenError: mocks.PublicSlugTakenError,
}));

import {
  checkPublicDashboardSlug,
  getPublicDashboardSettings,
  setPublicDashboardPages,
  setPublicDashboardSlug,
  setPublicDashboardVisibility,
  suggestPublicDashboardSlug,
} from '@/services/dashboard/publicDashboard.service';
import {
  findDashboardById,
  findPublicDashboardSettings,
  findTakenPublicSlugs,
  updatePublicDashboardSettings,
} from '@/repositories/postgres/dashboard.repository';
import type { PublicDashboardSettings } from '@/entities/dashboard/publicDashboard.entities';

const findDashboard = vi.mocked(findDashboardById);
const findSettings = vi.mocked(findPublicDashboardSettings);
const findTaken = vi.mocked(findTakenPublicSlugs);
const update = vi.mocked(updatePublicDashboardSettings);

let takenSlugs: Set<string>;

function withDomain(domain: string) {
  findDashboard.mockResolvedValue({ id: 'dash-1', siteId: 'site-1', domain });
}

function withSettings(settings: Partial<PublicDashboardSettings>) {
  findSettings.mockResolvedValue({ isPublic: false, slug: null, enabledPages: ['overview'], ...settings });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.flags.enablePublicDashboards = true;
  mocks.env.DEMO_DASHBOARD_ID = undefined;
  takenSlugs = new Set();
  findTaken.mockImplementation(async (candidates) => candidates.filter((slug) => takenSlugs.has(slug)));
  update.mockImplementation(async (_id, updates) => ({
    isPublic: false,
    slug: null,
    enabledPages: ['overview'],
    ...updates,
  }));
  withDomain('betterlytics.io');
  withSettings({});
});

describe('getPublicDashboardSettings', () => {
  it('defaults to private, no slug and only Overview', async () => {
    findSettings.mockResolvedValue(null);
    await expect(getPublicDashboardSettings('dash-1')).resolves.toEqual({
      isPublic: false,
      slug: null,
      enabledPages: ['overview'],
    });
  });
});

describe('suggestPublicDashboardSlug', () => {
  it('derives the slug from the domain', async () => {
    await expect(suggestPublicDashboardSlug('dash-1')).resolves.toBe('betterlytics-io');
  });

  it('suffixes -2, -3 when taken', async () => {
    takenSlugs = new Set(['betterlytics-io', 'betterlytics-io-2']);
    await expect(suggestPublicDashboardSlug('dash-1')).resolves.toBe('betterlytics-io-3');
  });

  it('checks availability excluding the own dashboard', async () => {
    await suggestPublicDashboardSlug('dash-1');
    expect(findTaken).toHaveBeenCalledWith(expect.arrayContaining(['betterlytics-io']), 'dash-1');
  });

  it('keeps searching past the first batch', async () => {
    takenSlugs = new Set(['betterlytics-io', ...Array.from({ length: 30 }, (_, i) => `betterlytics-io-${i + 2}`)]);
    await expect(suggestPublicDashboardSlug('dash-1')).resolves.toBe('betterlytics-io-32');
  });

  it.each([
    ['a reserved name', 'api'],
    ['a demo prefix', 'demo.example.com'],
    ['too short a slug', 'ab'],
    ['no usable characters', '...'],
  ])('falls back to my-dashboard for %s', async (_label, domain) => {
    withDomain(domain);
    await expect(suggestPublicDashboardSlug('dash-1')).resolves.toBe('my-dashboard');
  });

  it('suffixes the fallback when taken', async () => {
    withDomain('api');
    takenSlugs = new Set(['my-dashboard']);
    await expect(suggestPublicDashboardSlug('dash-1')).resolves.toBe('my-dashboard-2');
  });

  it('keeps suffixed slugs within 63 characters', async () => {
    withDomain(`${'a'.repeat(60)}.com`);
    takenSlugs = new Set([`${'a'.repeat(60)}-co`, `${'a'.repeat(60)}-2`]);
    const slug = await suggestPublicDashboardSlug('dash-1');
    expect(slug).toBe(`${'a'.repeat(60)}-3`);
    expect(slug.length).toBeLessThanOrEqual(63);
  });

  it('never suggests the demo dashboard id', async () => {
    mocks.env.DEMO_DASHBOARD_ID = 'betterlytics-io';
    await expect(suggestPublicDashboardSlug('dash-1')).resolves.toBe('betterlytics-io-2');
  });
});

describe('checkPublicDashboardSlug', () => {
  it.each([
    ['ab', 'invalid'],
    ['my--site', 'invalid'],
    ['admin', 'reserved'],
    ['demosite', 'reserved'],
  ])('refuses %s as %s', async (slug, reason) => {
    await expect(checkPublicDashboardSlug('dash-1', slug)).resolves.toEqual({ available: false, reason });
  });

  it('refuses the demo dashboard id as reserved', async () => {
    mocks.env.DEMO_DASHBOARD_ID = 'cmdemo123abc';
    await expect(checkPublicDashboardSlug('dash-1', 'cmdemo123abc')).resolves.toEqual({
      available: false,
      reason: 'reserved',
    });
  });

  it('refuses a slug held by another dashboard', async () => {
    takenSlugs = new Set(['my-site']);
    await expect(checkPublicDashboardSlug('dash-1', 'my-site')).resolves.toEqual({
      available: false,
      reason: 'taken',
    });
    expect(findTaken).toHaveBeenCalledWith(['my-site'], 'dash-1');
  });

  it('accepts a free slug', async () => {
    await expect(checkPublicDashboardSlug('dash-1', 'My-Site')).resolves.toEqual({
      available: true,
      slug: 'my-site',
    });
  });
});

describe('with ENABLE_PUBLIC_DASHBOARDS off', () => {
  beforeEach(() => {
    mocks.flags.enablePublicDashboards = false;
  });

  it.each([
    ['turning public', () => setPublicDashboardVisibility('dash-1', true)],
    ['turning private', () => setPublicDashboardVisibility('dash-1', false)],
    ['changing the slug', () => setPublicDashboardSlug('dash-1', 'my-site')],
    ['changing the pages', () => setPublicDashboardPages('dash-1', ['overview', 'pages'])],
  ])('refuses %s and leaves stored settings alone', async (_label, write) => {
    await expect(write()).rejects.toThrow('publicDashboardsDisabled');
    expect(update).not.toHaveBeenCalled();
  });
});

describe('setPublicDashboardVisibility', () => {
  it('claims the suggested slug when turning public without one', async () => {
    takenSlugs = new Set(['betterlytics-io']);
    await setPublicDashboardVisibility('dash-1', true);
    expect(update).toHaveBeenCalledWith('dash-1', { isPublic: true, slug: 'betterlytics-io-2' });
  });

  it('keeps the stored slug when turning public', async () => {
    withSettings({ slug: 'my-site' });
    await setPublicDashboardVisibility('dash-1', true);
    expect(update).toHaveBeenCalledWith('dash-1', { isPublic: true });
  });

  it('only flips the flag when turning private, keeping slug and pages', async () => {
    withSettings({ isPublic: true, slug: 'my-site', enabledPages: ['overview', 'pages'] });
    await setPublicDashboardVisibility('dash-1', false);
    expect(update).toHaveBeenCalledWith('dash-1', { isPublic: false });
  });

  it('retries with a fresh suggestion when the slug is claimed concurrently', async () => {
    update.mockRejectedValueOnce(new mocks.PublicSlugTakenError());
    findTaken
      .mockImplementationOnce(async () => [])
      .mockImplementationOnce(async (candidates) => candidates.filter((slug) => slug === 'betterlytics-io'));
    await setPublicDashboardVisibility('dash-1', true);
    expect(update).toHaveBeenLastCalledWith('dash-1', { isPublic: true, slug: 'betterlytics-io-2' });
  });
});

describe('setPublicDashboardSlug', () => {
  it.each([
    ['ab', 'publicDashboardSlugInvalid'],
    ['status', 'publicDashboardSlugReserved'],
    ['demo-x', 'publicDashboardSlugReserved'],
  ])('refuses %s with a reason', async (slug, reason) => {
    await expect(setPublicDashboardSlug('dash-1', slug)).rejects.toThrow(reason);
    expect(update).not.toHaveBeenCalled();
  });

  it('refuses a slug taken by another dashboard', async () => {
    takenSlugs = new Set(['my-site']);
    await expect(setPublicDashboardSlug('dash-1', 'my-site')).rejects.toThrow('publicDashboardSlugTaken');
    expect(update).not.toHaveBeenCalled();
  });

  it('maps a unique-index conflict on save to taken', async () => {
    update.mockRejectedValueOnce(new mocks.PublicSlugTakenError());
    await expect(setPublicDashboardSlug('dash-1', 'my-site')).rejects.toThrow('publicDashboardSlugTaken');
  });

  it('saves a free slug', async () => {
    await expect(setPublicDashboardSlug('dash-1', 'my-site')).resolves.toMatchObject({ slug: 'my-site' });
    expect(update).toHaveBeenCalledWith('dash-1', { slug: 'my-site' });
  });
});

describe('setPublicDashboardPages', () => {
  it('refuses an empty list', async () => {
    await expect(setPublicDashboardPages('dash-1', [])).rejects.toThrow('publicDashboardPagesInvalid');
    expect(update).not.toHaveBeenCalled();
  });

  it('refuses unknown pages', async () => {
    await expect(setPublicDashboardPages('dash-1', ['overview', 'settings'])).rejects.toThrow(
      'publicDashboardPagesInvalid',
    );
  });

  it('saves the pages in canonical order', async () => {
    await setPublicDashboardPages('dash-1', ['errors', 'campaigns']);
    expect(update).toHaveBeenCalledWith('dash-1', { enabledPages: ['campaigns', 'errors'] });
  });
});
