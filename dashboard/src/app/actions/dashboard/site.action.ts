'use server';
import { AuthContext } from '@/entities/auth/authContext';
import { withDashboardAuthContext } from '@/auth/auth-actions';

export const fetchSiteId = withDashboardAuthContext(async (ctx: AuthContext): Promise<string> => {
  return ctx.siteId;
});
