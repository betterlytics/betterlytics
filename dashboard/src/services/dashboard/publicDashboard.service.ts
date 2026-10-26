import 'server-only';

import { getTranslations } from 'next-intl/server';
import { env } from '@/lib/env';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { UserException } from '@/lib/exceptions';
import {
  DEFAULT_PUBLIC_DASHBOARD_PAGES,
  isReservedPublicDashboardSlug,
  PUBLIC_DASHBOARD_SLUG_FALLBACK,
  PublicDashboardPagesSchema,
  type PublicDashboardSettings,
  type PublicDashboardSlugCheck,
  type PublicDashboardSlugRejection,
} from '@/entities/dashboard/publicDashboard.entities';
import { PUBLIC_SLUG_LIMITS, PublicSlugFormatSchema, slugifyDomain } from '@/entities/system/publicSlug.entities';
import {
  findDashboardById,
  findPublicDashboardSettings,
  findTakenPublicSlugs,
  PublicSlugTakenError,
  updatePublicDashboardSettings,
} from '@/repositories/postgres/dashboard.repository';

const SUGGESTION_BATCH_SIZE = 20;
const CLAIM_ATTEMPTS = 3;

const DEFAULT_PUBLIC_DASHBOARD_SETTINGS: PublicDashboardSettings = {
  isPublic: false,
  slug: null,
  enabledPages: DEFAULT_PUBLIC_DASHBOARD_PAGES,
};

const SLUG_REJECTION_KEYS = {
  invalid: 'publicDashboardSlugInvalid',
  reserved: 'publicDashboardSlugReserved',
  taken: 'publicDashboardSlugTaken',
} as const satisfies Record<PublicDashboardSlugRejection, string>;

async function slugRejection(reason: PublicDashboardSlugRejection): Promise<UserException> {
  const t = await getTranslations('validation');
  return new UserException(t(SLUG_REJECTION_KEYS[reason]));
}

async function assertPublicDashboardsEnabled() {
  if (!isFeatureEnabled('enablePublicDashboards')) {
    const t = await getTranslations('validation');
    throw new UserException(t('publicDashboardsDisabled'));
  }
}

function isDemoDashboardId(slug: string): boolean {
  return Boolean(env.DEMO_DASHBOARD_ID) && slug === env.DEMO_DASHBOARD_ID?.toLowerCase();
}

function isValidSlug(slug: string): boolean {
  return PublicSlugFormatSchema.safeParse(slug).success && !isReservedPublicDashboardSlug(slug);
}

function withSuffix(base: string, n: number): string {
  if (n === 1) return base;
  const suffix = `-${n}`;
  return `${base.slice(0, PUBLIC_SLUG_LIMITS.MAX - suffix.length).replace(/-+$/, '')}${suffix}`;
}

export async function getPublicDashboardSettings(dashboardId: string): Promise<PublicDashboardSettings> {
  return (await findPublicDashboardSettings(dashboardId)) ?? DEFAULT_PUBLIC_DASHBOARD_SETTINGS;
}

export async function checkPublicDashboardSlug(
  dashboardId: string,
  input: string,
): Promise<PublicDashboardSlugCheck> {
  const parsed = PublicSlugFormatSchema.safeParse(input);
  if (!parsed.success) return { available: false, reason: 'invalid' };

  const slug = parsed.data;
  if (isReservedPublicDashboardSlug(slug) || isDemoDashboardId(slug))
    return { available: false, reason: 'reserved' };

  const taken = await findTakenPublicSlugs([slug], dashboardId);
  if (taken.length > 0) return { available: false, reason: 'taken' };

  return { available: true, slug };
}

/** A valid slug from the dashboard domain, free at the time of the call, suffixed `-2`, `-3`, ... when taken. */
export async function suggestPublicDashboardSlug(dashboardId: string): Promise<string> {
  const dashboard = await findDashboardById(dashboardId);
  const fromDomain = slugifyDomain(dashboard.domain);
  const base = isValidSlug(fromDomain) ? fromDomain : PUBLIC_DASHBOARD_SLUG_FALLBACK;

  for (let start = 1; ; start += SUGGESTION_BATCH_SIZE) {
    const candidates = Array.from({ length: SUGGESTION_BATCH_SIZE }, (_, i) => withSuffix(base, start + i)).filter(
      (candidate) => isValidSlug(candidate) && !isDemoDashboardId(candidate),
    );
    const taken = new Set(await findTakenPublicSlugs(candidates, dashboardId));
    const free = candidates.find((candidate) => !taken.has(candidate));
    if (free) return free;
  }
}

export async function setPublicDashboardVisibility(
  dashboardId: string,
  isPublic: boolean,
): Promise<PublicDashboardSettings> {
  await assertPublicDashboardsEnabled();

  const current = await getPublicDashboardSettings(dashboardId);
  if (!isPublic || current.slug) {
    return updatePublicDashboardSettings(dashboardId, { isPublic });
  }

  // Another dashboard can claim the suggestion between suggesting and saving; the unique index catches it
  for (let attempt = 1; ; attempt++) {
    const slug = await suggestPublicDashboardSlug(dashboardId);
    try {
      return await updatePublicDashboardSettings(dashboardId, { isPublic, slug });
    } catch (error) {
      if (!(error instanceof PublicSlugTakenError)) throw error;
      if (attempt >= CLAIM_ATTEMPTS) throw await slugRejection('taken');
    }
  }
}

export async function setPublicDashboardSlug(
  dashboardId: string,
  input: string,
): Promise<PublicDashboardSettings> {
  await assertPublicDashboardsEnabled();

  const check = await checkPublicDashboardSlug(dashboardId, input);
  if (!check.available) {
    throw await slugRejection(check.reason);
  }

  try {
    return await updatePublicDashboardSettings(dashboardId, { slug: check.slug });
  } catch (error) {
    if (error instanceof PublicSlugTakenError) {
      throw await slugRejection('taken');
    }
    throw error;
  }
}

export async function setPublicDashboardPages(
  dashboardId: string,
  pages: unknown,
): Promise<PublicDashboardSettings> {
  await assertPublicDashboardsEnabled();

  const parsed = PublicDashboardPagesSchema.safeParse(pages);
  if (!parsed.success) {
    const t = await getTranslations('validation');
    throw new UserException(t('publicDashboardPagesInvalid'));
  }

  return updatePublicDashboardSettings(dashboardId, { enabledPages: parsed.data });
}
