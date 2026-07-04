'use server';

import { createHash } from 'crypto';
import { revalidatePath } from 'next/cache';
import { getMessages, getTranslations } from 'next-intl/server';
import z from 'zod';
import { withDashboardAuthContext, withDashboardMutationAuthContext } from '@/auth/auth-actions';
import { type AuthContext } from '@/entities/auth/authContext.entities';
import {
  StatusPageCreateSchema,
  StatusPageSlugSchema,
  StatusPageUpdateSchema,
  type StatusPageImagesInput,
} from '@/entities/analytics/statusPage/statusPage.entities';
import {
  StatusPageIncidentCreateSchema,
  StatusPageIncidentUpdateSchema,
  StatusPageIncidentUpdateDeleteSchema,
  StatusPageIncidentUpdateEditSchema,
  StatusPageIncidentUpdatePostSchema,
} from '@/entities/analytics/statusPage/statusPageIncident.entities';
import { defaultPublicMonitorName } from '@/entities/analytics/statusPage/statusPage.helpers';
import {
  addStatusPage,
  countStatusPagesForDashboard,
  getStatusPage,
  getStatusPagesForDashboard,
  isStatusPageCustomDomainAvailable,
  isStatusPageSlugAvailable,
  publishStatusPage,
  removeStatusPage,
  saveStatusPage,
  type StatusPageImageWrites,
} from '@/services/analytics/statusPage.service';
import { getDashboardCapabilities } from '@/lib/billing/capabilityAccess';
import { statusPageValidator } from '@/lib/billing/validators';
import {
  addStatusPageIncident,
  addStatusPageIncidentUpdates,
  countActiveStatusPageIncidents,
  countIncidentUpdates,
  editStatusPageIncidentUpdateMessage,
  getIncidentsForStatusPage,
  getIncidentSuggestions,
  getStatusPageIncidentTimeline,
  getStatusPageMonitorCheckIds,
  removeStatusPageIncident,
  removeStatusPageIncidentUpdate,
  saveStatusPageIncident,
} from '@/services/analytics/statusPageIncident.service';
import {
  getStatusPagePreviewData,
  getStatusPagePreviewDataForDashboard,
} from '@/services/analytics/publicStatusPage.service';
import { STATUS_PAGE_LIMITS } from '@/entities/analytics/statusPage/statusPage.entities';
import { inspectStatusPageImage } from '@/lib/statusPageImage';
import { findDashboardById } from '@/repositories/postgres/dashboard.repository';
import { getMonitorChecksWithStatus } from '@/services/analytics/monitoring.service';
import { type MonitorUptimeBucket } from '@/entities/analytics/monitoring.entities';
import { getUserTimezone } from '@/lib/cookies';
import { UserException } from '@/lib/exceptions';

function revalidateStatusPagePaths(dashboardId: string, ...slugs: Array<string | undefined>) {
  revalidatePath(`/dashboard/${dashboardId}/status-pages`);
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

/** Validate the staged branding images and turn them into storable writes (sniffed MIME + content hash). */
async function prepareImageWrites(images?: StatusPageImagesInput): Promise<StatusPageImageWrites | undefined> {
  if (!images) return undefined;
  const t = await getTranslations('validation');

  const prepare = (bytes: Uint8Array | null | undefined) => {
    if (bytes === undefined) return undefined;
    if (bytes === null) return null;
    if (bytes.byteLength === 0) throw new UserException(t('statusPageImageInvalid'));
    if (bytes.byteLength > STATUS_PAGE_LIMITS.IMAGE_MAX_BYTES) {
      throw new UserException(t('statusPageImageTooLarge'));
    }

    const inspected = inspectStatusPageImage(bytes);
    if (!inspected) throw new UserException(t('statusPageImageBadType'));
    const data = Buffer.from(bytes);
    const hash = createHash('sha256').update(data).digest('hex').slice(0, 16);
    return { data, mimeType: inspected.mimeType, hash };
  };

  return { logo: prepare(images.logo), favicon: prepare(images.favicon) };
}

export const createStatusPageAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, input: z.input<typeof StatusPageCreateSchema>, images?: StatusPageImagesInput) => {
    const t = await getTranslations('validation');
    const payload = StatusPageCreateSchema.parse(input);
    const imageWrites = await prepareImageWrites(images);

    const [caps, slugAvailable, domainAvailable] = await Promise.all([
      getDashboardCapabilities(ctx.dashboardId),
      isStatusPageSlugAvailable(payload.slug),
      payload.customDomain != null
        ? isStatusPageCustomDomainAvailable(payload.customDomain)
        : Promise.resolve(true),
    ]);
    await (
      await statusPageValidator(caps.statusPages)
    )
      .statusPageLimit(() => countStatusPagesForDashboard(ctx.dashboardId))
      .customDomain(payload.customDomain)
      .removeBranding(payload.hideBranding)
      .validate();

    if (!slugAvailable) {
      throw new UserException(t('statusPageSlugTaken'));
    }
    if (payload.customDomain != null && !domainAvailable) {
      throw new UserException(t('statusPageDomainTaken'));
    }

    const created = await addStatusPage(ctx.dashboardId, payload, imageWrites);

    revalidateStatusPagePaths(ctx.dashboardId);
    return created;
  },
);

export const updateStatusPageAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, input: z.input<typeof StatusPageUpdateSchema>, images?: StatusPageImagesInput) => {
    const t = await getTranslations('validation');
    const payload = StatusPageUpdateSchema.parse(input);
    const imageWrites = await prepareImageWrites(images);

    const [caps, slugAvailable, domainAvailable] = await Promise.all([
      getDashboardCapabilities(ctx.dashboardId),
      payload.slug != null ? isStatusPageSlugAvailable(payload.slug, payload.id) : Promise.resolve(true),
      payload.customDomain != null
        ? isStatusPageCustomDomainAvailable(payload.customDomain, payload.id)
        : Promise.resolve(true),
    ]);
    await (await statusPageValidator(caps.statusPages))
      .customDomain(payload.customDomain)
      .removeBranding(payload.hideBranding)
      .validate();

    if (payload.slug != null && !slugAvailable) {
      throw new UserException(t('statusPageSlugTaken'));
    }
    if (payload.customDomain != null && !domainAvailable) {
      throw new UserException(t('statusPageDomainTaken'));
    }

    const result = await saveStatusPage(ctx.dashboardId, payload, imageWrites);
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

export const fetchStatusPagePreviewAction = withDashboardAuthContext(
  async (ctx: AuthContext, statusPageId: string) => getStatusPagePreviewData(ctx.dashboardId, statusPageId),
);

/** Live-preview payload + messages for the create wizard (no persisted page yet). */
export const fetchStatusPageDraftPreviewAction = withDashboardAuthContext(async (ctx: AuthContext) => {
  const [payload, messages] = await Promise.all([
    getStatusPagePreviewDataForDashboard(ctx.dashboardId, ctx.siteId),
    getMessages({ locale: 'en' }),
  ]);
  return {
    payload,
    messages: messages.publicStatusPage as Record<string, unknown>,
  };
});

function slugifyDomain(domain: string): string {
  return domain
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function averageUptimePercent(buckets: MonitorUptimeBucket[]): number | null {
  const valid = buckets.filter((bucket) => bucket.upRatio != null);
  if (valid.length === 0) return null;
  return (valid.reduce((sum, bucket) => sum + (bucket.upRatio ?? 0), 0) / valid.length) * 100;
}

async function computeStatusPageDefaults(dashboardId: string) {
  const dashboard = await findDashboardById(dashboardId);

  const slug =
    slugifyDomain(dashboard.domain).slice(0, STATUS_PAGE_LIMITS.SLUG_MAX).replace(/-+$/, '') || 'my-status-page';

  const domainLabel = dashboard.domain.split('.')[0] || dashboard.domain;
  const name = `${domainLabel.charAt(0).toUpperCase()}${domainLabel.slice(1)} Status`;

  return { name, slug };
}

export const suggestStatusPageDefaultsAction = withDashboardAuthContext(async (ctx: AuthContext) => {
  const timezone = await getUserTimezone();
  const [{ name, slug }, monitors] = await Promise.all([
    computeStatusPageDefaults(ctx.dashboardId),
    getMonitorChecksWithStatus(ctx.dashboardId, ctx.siteId, timezone),
  ]);
  return {
    name,
    slug,
    monitors: monitors.slice(0, STATUS_PAGE_LIMITS.MONITORS_MAX).map((monitor) => ({
      monitorCheckId: monitor.id,
      name: monitor.name ?? null,
      url: monitor.url,
      publicName: defaultPublicMonitorName(monitor),
      operationalState: monitor.operationalState,
      uptimePercent: averageUptimePercent(monitor.uptimeBuckets),
    })),
  };
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

export const fetchIncidentTimelineAction = withDashboardAuthContext(
  async (ctx: AuthContext, statusPageId: string, incidentId: string) =>
    getStatusPageIncidentTimeline(ctx.dashboardId, statusPageId, incidentId),
);

// Dedupe the affected monitors and reject any that aren't attached to this page (the field is
// FK-less, so this is the only thing keeping it honest). Returns the cleaned list. Empty = page-wide.
async function validateAffectedMonitors(
  dashboardId: string,
  statusPageId: string,
  monitorCheckIds: string[],
): Promise<string[]> {
  const unique = [...new Set(monitorCheckIds)];
  if (unique.length === 0) return [];

  const valid = new Set(await getStatusPageMonitorCheckIds(dashboardId, statusPageId));
  if (unique.some((id) => !valid.has(id))) {
    throw new UserException((await getTranslations('validation'))('statusPageIncidentInvalidMonitor'));
  }
  return unique;
}

export const createStatusPageIncidentAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, input: z.input<typeof StatusPageIncidentCreateSchema>) => {
    const payload = StatusPageIncidentCreateSchema.parse(input);
    payload.monitorCheckIds = await validateAffectedMonitors(
      ctx.dashboardId,
      payload.statusPageId,
      payload.monitorCheckIds,
    );

    if (
      (await countActiveStatusPageIncidents(ctx.dashboardId, payload.statusPageId)) >=
      STATUS_PAGE_LIMITS.INCIDENTS_MAX
    ) {
      throw new UserException((await getTranslations('validation'))('statusPageIncidentLimit'));
    }

    const { incident, slug } = await addStatusPageIncident(ctx.dashboardId, ctx.userId, payload);
    revalidateStatusPagePaths(ctx.dashboardId, slug);
    return incident;
  },
);

// Metadata only (title / impact / affected monitor). Status & timeline are changed via the update
// actions below.
export const updateStatusPageIncidentAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, input: z.input<typeof StatusPageIncidentUpdateSchema>) => {
    const payload = StatusPageIncidentUpdateSchema.parse(input);
    if (payload.monitorCheckIds) {
      payload.monitorCheckIds = await validateAffectedMonitors(
        ctx.dashboardId,
        payload.statusPageId,
        payload.monitorCheckIds,
      );
    }

    const result = await saveStatusPageIncident(ctx.dashboardId, payload);
    if (result) revalidateStatusPagePaths(ctx.dashboardId, result.slug);
    return result?.incident ?? null;
  },
);

export const postStatusPageIncidentUpdatesAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, input: z.input<typeof StatusPageIncidentUpdatePostSchema>) => {
    const payload = StatusPageIncidentUpdatePostSchema.parse(input);

    if (
      (await countIncidentUpdates(payload.incidentId)) + payload.updates.length >
      STATUS_PAGE_LIMITS.INCIDENT_UPDATES_MAX
    ) {
      throw new UserException((await getTranslations('validation'))('statusPageIncidentUpdateLimit'));
    }

    const result = await addStatusPageIncidentUpdates(ctx.dashboardId, ctx.userId, payload);
    if (result) revalidateStatusPagePaths(ctx.dashboardId, result.slug);
    return result?.incident ?? null;
  },
);

// Edit an existing update's message (text body only).
export const editStatusPageIncidentUpdateAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, input: z.input<typeof StatusPageIncidentUpdateEditSchema>) => {
    const payload = StatusPageIncidentUpdateEditSchema.parse(input);

    const result = await editStatusPageIncidentUpdateMessage(ctx.dashboardId, payload);
    if (result) revalidateStatusPagePaths(ctx.dashboardId, result.slug);
    return result?.incident ?? null;
  },
);

// Remove a timeline update. An incident must keep at least one update, so the last one can't go.
export const deleteStatusPageIncidentUpdateAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, input: z.input<typeof StatusPageIncidentUpdateDeleteSchema>) => {
    const payload = StatusPageIncidentUpdateDeleteSchema.parse(input);

    if ((await countIncidentUpdates(payload.incidentId)) <= 1) {
      throw new UserException((await getTranslations('validation'))('statusPageIncidentUpdateLast'));
    }

    const result = await removeStatusPageIncidentUpdate(ctx.dashboardId, payload);
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
