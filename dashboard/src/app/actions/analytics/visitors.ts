'use server';

import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/auth/authContext';
import { getActiveUsersForSite } from '@/services/analytics/visitors';

export const fetchActiveUsersAction = withDashboardAuthContext(async (ctx: AuthContext) => {
  return getActiveUsersForSite(ctx.siteId);
});
