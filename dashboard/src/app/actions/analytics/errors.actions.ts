'use server';

import {
  getErrorGroupForSite,
  getErrorGroupSidebarDataForSite,
  findReplaySessionForErrorGroup,
  upsertErrorGroupForSite,
  bulkUpsertErrorGroupForSite,
} from '@/services/analytics/errors.service';
import type { ErrorGroupSidebarData } from '@/entities/analytics/errors.entities';
import { withDashboardAuthContext, withDashboardMutationAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/auth/authContext.entities';
import { type ErrorGroupRow, ErrorGroupStatusValueSchema } from '@/entities/analytics/errors.entities';

export const fetchErrorGroupAction = withDashboardAuthContext(
  async (ctx: AuthContext, fingerprint: string): Promise<ErrorGroupRow | null> => {
    return getErrorGroupForSite(ctx.siteId, ctx.dashboardId, fingerprint);
  },
);

export const fetchErrorGroupSidebarAction = withDashboardAuthContext(
  async (ctx: AuthContext, fingerprint: string): Promise<ErrorGroupSidebarData> => {
    return getErrorGroupSidebarDataForSite(ctx.siteId, fingerprint);
  },
);

export const findReplaySessionForErrorAction = withDashboardAuthContext(
  async (ctx: AuthContext, fingerprint: string): Promise<string | null> => {
    return findReplaySessionForErrorGroup(ctx.siteId, fingerprint);
  },
);

export const upsertErrorGroupAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, fingerprint: string, status: string): Promise<void> => {
    const validatedStatus = ErrorGroupStatusValueSchema.parse(status);
    await upsertErrorGroupForSite(ctx.dashboardId, fingerprint, validatedStatus);
  },
);

export const bulkUpsertErrorGroupAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, fingerprints: string[], status: string): Promise<void> => {
    const validatedStatus = ErrorGroupStatusValueSchema.parse(status);
    await bulkUpsertErrorGroupForSite(ctx.dashboardId, fingerprints, validatedStatus);
  },
);
