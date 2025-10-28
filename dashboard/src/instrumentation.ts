'use server';

import { reconcileAllDashboardConfigs } from '@/services/dashboard';
import { env } from '@/lib/env';

export async function register(): Promise<void> {
  try {
    if (env.REDIS_URL && env.REDIS_URL !== '') {
      reconcileAllDashboardConfigs()
        .then(({ processed }) => console.log(`Redis warm-up finished. processed=${processed}`))
        .catch((e) => console.error('Redis warm-up failed:', e));
    } else {
      console.log('Redis URL is not set, skipping dashboard config reconciliation');
    }
  } catch (e) {
    console.error('Redis warm-up failed:', e);
  }
}
