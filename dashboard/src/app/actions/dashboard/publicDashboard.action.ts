'use server';

import { withDashboardAuthContext, withDashboardMutationAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/auth/authContext.entities';
import type {
  PublicDashboardPage,
  PublicDashboardSettings,
  PublicDashboardSlugCheck,
} from '@/entities/dashboard/publicDashboard.entities';
import * as PublicDashboardService from '@/services/dashboard/publicDashboard.service';

export const getPublicDashboardSettingsAction = withDashboardAuthContext(
  async (ctx: AuthContext): Promise<PublicDashboardSettings> => {
    return await PublicDashboardService.getPublicDashboardSettings(ctx.dashboardId);
  },
);

export const suggestPublicDashboardSlugAction = withDashboardAuthContext(
  async (ctx: AuthContext): Promise<string> => {
    return await PublicDashboardService.suggestPublicDashboardSlug(ctx.dashboardId);
  },
);

export const checkPublicDashboardSlugAction = withDashboardAuthContext(
  async (ctx: AuthContext, slug: string): Promise<PublicDashboardSlugCheck> => {
    return await PublicDashboardService.checkPublicDashboardSlug(ctx.dashboardId, slug);
  },
);

export const setPublicDashboardVisibilityAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, isPublic: boolean): Promise<PublicDashboardSettings> => {
    return await PublicDashboardService.setPublicDashboardVisibility(ctx.dashboardId, isPublic === true);
  },
  { permission: 'canManageSettings' },
);

export const setPublicDashboardSlugAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, slug: string): Promise<PublicDashboardSettings> => {
    return await PublicDashboardService.setPublicDashboardSlug(ctx.dashboardId, slug);
  },
  { permission: 'canManageSettings' },
);

export const setPublicDashboardPagesAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, pages: PublicDashboardPage[]): Promise<PublicDashboardSettings> => {
    return await PublicDashboardService.setPublicDashboardPages(ctx.dashboardId, pages);
  },
  { permission: 'canManageSettings' },
);
