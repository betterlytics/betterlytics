'use server';

import { withDashboardAuthContext } from '@/auth/auth-actions';
import { getAIInsights } from '@/services/aiInsights.service';

export const getDashboardAIInsights = withDashboardAuthContext(async (ctx) => {
  const aiInsights = await getAIInsights(ctx.siteId);

  return aiInsights;
});
