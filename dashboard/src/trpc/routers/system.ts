import { createRouter, publicProcedure } from '@/trpc/init';
import { getPublicEnvironmentVariables } from '@/services/system/environment.service';

export const systemRouter = createRouter({
  publicEnvironmentVariables: publicProcedure.query(async () => {
    return getPublicEnvironmentVariables();
  }),
});
