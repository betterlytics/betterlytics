'use server';

import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/auth/authContext.entities';
import { getActiveUsersForSite } from '@/services/analytics/visitors.service';

export const fetchActiveUsersAction = withDashboardAuthContext(async (ctx: AuthContext) => {
  return getActiveUsersForSite(ctx.siteId);
});
