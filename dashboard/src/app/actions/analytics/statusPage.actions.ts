'use server';

import { createHash } from 'crypto';
import { revalidatePath } from 'next/cache';
import { getMessages, getTranslations } from 'next-intl/server';
import z from 'zod';
import type { SupportedLanguages } from '@/constants/i18n';
import { withDashboardAuthContext, withDashboardMutationAuthContext } from '@/auth/auth-actions';
import { type AuthContext } from '@/entities/auth/authContext.entities';
import {
  defaultPublicMonitorName,
  StatusPageCreateSchema,
  StatusPageIncidentCreateSchema,
  StatusPageIncidentUpdateSchema,
  StatusPageSlugSchema,
  StatusPageUpdateSchema,
} from '@/entities/analytics/statusPage.entities';
import {
  addStatusPage,
  clearStatusPageLogo,
  getStatusPage,
  getStatusPagesForDashboard,
  isStatusPageSlugAvailable,
  publishStatusPage,
  removeStatusPage,
  saveStatusPage,
  saveStatusPageLogo,
} from '@/services/analytics/statusPage.service';
import {
  addStatusPageIncident,
  countActiveStatusPageIncidents,
  getIncidentsForStatusPage,
  getIncidentSuggestions,
  publishStatusPageIncident,
  removeStatusPageIncident,
  saveStatusPageIncident,
} from '@/services/analytics/statusPageIncident.service';
import { getStatusPagePreviewData } from '@/services/analytics/publicStatusPage.service';
import { STATUS_PAGE_LIMITS, STATUS_PAGE_LOGO_MIME } from '@/entities/analytics/statusPage.entities';
import { findDashboardById } from '@/repositories/postgres/dashboard.repository';
import { listMonitorChecks } from '@/repositories/postgres/monitoring.repository';
import { UserException } from '@/lib/exceptions';

function revalidateStatusPagePaths(dashboardId: string, ...slugs: Array<string | undefined>) {
  revalidatePath(`/dashboard/${dashboardId}/monitoring/status-pages`);
  for (const slug of new Set(slugs.filter(Boolean))) {
    revalidatePath(`/status/${slug}`);
  }
}

export const fetchStatusPagesAction = withDashboardAuthContext(async (ctx: AuthContext) => {
  return getStatusPagesForDashboard(ctx.dashboardId);
});

export const fetchStatusPageAction = withDashboardAuthContext(
  async (ctx: AuthContext, statusPageId: string) => await getStatusPage(ctx.dashboardId, statusPageId),
);

export const createStatusPageAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, input: z.input<typeof StatusPageCreateSchema>) => {
    const t = await getTranslations('validation');
    const payload = StatusPageCreateSchema.parse(input);

    if (!(await isStatusPageSlugAvailable(payload.slug))) {
      throw new UserException(t('statusPageSlugTaken'));
    }

    const created = await addStatusPage(ctx.dashboardId, payload);

    revalidateStatusPagePaths(ctx.dashboardId);
    return created;
  },
);

export const updateStatusPageAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, input: z.input<typeof StatusPageUpdateSchema>) => {
    const t = await getTranslations('validation');
    const payload = StatusPageUpdateSchema.parse(input);

    if (payload.slug != null && !(await isStatusPageSlugAvailable(payload.slug, payload.id))) {
      throw new UserException(t('statusPageSlugTaken'));
    }

    const result = await saveStatusPage(ctx.dashboardId, payload);
    // The old public URL must drop out of the cache when the slug changes
    if (result) revalidateStatusPagePaths(ctx.dashboardId, result.page.slug, result.previousSlug);
    return result?.page ?? null;
  },
);

export const setStatusPagePublishedAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, statusPageId: string, isPublished: boolean) => {
    const updated = await publishStatusPage(ctx.dashboardId, statusPageId, isPublished);

    revalidateStatusPagePaths(ctx.dashboardId, updated.slug);
    return updated;
  },
);

export const deleteStatusPageAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, statusPageId: string) => {
    const deletedSlug = await removeStatusPage(ctx.dashboardId, statusPageId);

    revalidateStatusPagePaths(ctx.dashboardId, deletedSlug ?? undefined);
  },
);

export const uploadStatusPageLogoAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, statusPageId: string, formData: FormData) => {
    const t = await getTranslations('validation');
    const file = formData.get('logo');

    if (!(file instanceof File) || file.size === 0) {
      throw new UserException(t('statusPageLogoInvalid'));
    }
    if (file.size > STATUS_PAGE_LIMITS.LOGO_MAX_BYTES) {
      throw new UserException(t('statusPageLogoTooLarge'));
    }
    if (!STATUS_PAGE_LOGO_MIME.has(file.type)) {
      throw new UserException(t('statusPageLogoBadType'));
    }

    const data = Buffer.from(await file.arrayBuffer());
    const hash = createHash('sha256').update(data).digest('hex').slice(0, 16);

    const slug = await saveStatusPageLogo(ctx.dashboardId, statusPageId, { data, mimeType: file.type, hash });

    revalidateStatusPagePaths(ctx.dashboardId, slug);
    return { logoUrl: `/status/${slug}/logo?v=${hash}` };
  },
);

export const removeStatusPageLogoAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, statusPageId: string) => {
    const slug = await clearStatusPageLogo(ctx.dashboardId, statusPageId);
    revalidateStatusPagePaths(ctx.dashboardId, slug);
  },
);

export const fetchStatusPagePreviewAction = withDashboardAuthContext(
  async (ctx: AuthContext, statusPageId: string) => getStatusPagePreviewData(ctx.dashboardId, statusPageId),
);

export const fetchPublicStatusPageMessagesAction = withDashboardAuthContext(
  async (_ctx: AuthContext, language: SupportedLanguages) => {
    const messages = await getMessages({ locale: language });
    return messages.publicStatusPage as Record<string, unknown>;
  },
);

function slugifyDomain(domain: string): string {
  return domain
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const createDraftStatusPageAction = withDashboardMutationAuthContext(async (ctx: AuthContext) => {
  const [dashboard, monitors] = await Promise.all([
    findDashboardById(ctx.dashboardId),
    listMonitorChecks(ctx.dashboardId),
  ]);

  const base = slugifyDomain(dashboard.domain) || 'my-status-page';
  const candidates = [base, `${base}-status`, ...Array.from({ length: 8 }, (_, i) => `${base}-${i + 2}`)];

  let slug: string | undefined;
  for (const candidate of candidates) {
    const parsed = StatusPageSlugSchema.safeParse(candidate);
    if (parsed.success && (await isStatusPageSlugAvailable(parsed.data))) {
      slug = parsed.data;
      break;
    }
  }
  if (!slug) {
    const t = await getTranslations('validation');
    throw new UserException(t('statusPageSlugTaken'));
  }

  const domainLabel = dashboard.domain.split('.')[0] || dashboard.domain;
  const name = `${domainLabel.charAt(0).toUpperCase()}${domainLabel.slice(1)} Status`;

  const created = await addStatusPage(ctx.dashboardId, {
    ...StatusPageCreateSchema.parse({ name, slug }),
    monitors: monitors.slice(0, STATUS_PAGE_LIMITS.MONITORS_MAX).map((monitor) => ({
      monitorCheckId: monitor.id,
      publicName: defaultPublicMonitorName(monitor),
    })),
  });

  revalidateStatusPagePaths(ctx.dashboardId);
  return created;
});

export const checkStatusPageSlugAction = withDashboardAuthContext(
  async (_ctx: AuthContext, slug: string, excludeStatusPageId?: string) => {
    const parsed = StatusPageSlugSchema.safeParse(slug);
    if (!parsed.success) {
      return { available: false, reason: 'invalid' as const };
    }
    if (!(await isStatusPageSlugAvailable(parsed.data, excludeStatusPageId))) {
      return { available: false, reason: 'taken' as const };
    }
    return { available: true as const };
  },
);

export const fetchStatusPageIncidentsAction = withDashboardAuthContext(
  async (ctx: AuthContext, statusPageId: string) => getIncidentsForStatusPage(ctx.dashboardId, statusPageId),
);

export const fetchIncidentSuggestionsAction = withDashboardAuthContext(
  async (ctx: AuthContext, statusPageId: string) => getIncidentSuggestions(ctx.dashboardId, statusPageId),
);

export const createStatusPageIncidentAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, input: z.input<typeof StatusPageIncidentCreateSchema>) => {
    const payload = StatusPageIncidentCreateSchema.parse(input);

    if ((await countActiveStatusPageIncidents(ctx.dashboardId, payload.statusPageId)) >= STATUS_PAGE_LIMITS.INCIDENTS_MAX) {
      throw new UserException((await getTranslations('validation'))('statusPageIncidentLimit'));
    }

    const { incident, slug } = await addStatusPageIncident(ctx.dashboardId, ctx.userId, payload);
    revalidateStatusPagePaths(ctx.dashboardId, payload.isPublished ? slug : undefined);
    return incident;
  },
);

export const updateStatusPageIncidentAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, input: z.input<typeof StatusPageIncidentUpdateSchema>) => {
    const payload = StatusPageIncidentUpdateSchema.parse(input);

    const result = await saveStatusPageIncident(ctx.dashboardId, payload);
    if (result) revalidateStatusPagePaths(ctx.dashboardId, result.slug);
    return result?.incident ?? null;
  },
);

export const setStatusPageIncidentPublishedAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, statusPageId: string, incidentId: string, isPublished: boolean) => {
    const result = await publishStatusPageIncident(ctx.dashboardId, statusPageId, incidentId, isPublished);
    if (result) revalidateStatusPagePaths(ctx.dashboardId, result.slug);
    return result?.incident ?? null;
  },
);

export const deleteStatusPageIncidentAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, statusPageId: string, incidentId: string) => {
    const slug = await removeStatusPageIncident(ctx.dashboardId, statusPageId, incidentId);
    if (slug) revalidateStatusPagePaths(ctx.dashboardId, slug);
  },
);
