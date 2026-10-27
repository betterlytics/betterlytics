import { createRouter, authedProcedure, publicProcedure } from '@/trpc/init';
import { getPublicEnvironmentVariables } from '@/services/system/environment.service';
import { resolveAdminActor } from '@/auth/admin-auth';
import { getAvailableUpdate } from '@/services/system/updateCheck.service';

export const systemRouter = createRouter({
  publicEnvironmentVariables: publicProcedure.query(async () => {
    return getPublicEnvironmentVariables();
  }),
  availableUpdate: authedProcedure.query(async ({ ctx }) => {
    if (resolveAdminActor(ctx.session)?.edition !== 'selfhost') return null;
    return getAvailableUpdate();
  }),
});
