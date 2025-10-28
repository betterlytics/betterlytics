import { registerOTel } from '@vercel/otel';
import { env } from './lib/env';
import { reconcileAllDashboardConfigs } from './services/dashboard';

export function register() {
  if (!env.ENABLE_MONITORING) return;
  if (!env.OTEL_SERVICE_NAME) throw new Error('OTEL_SERVICE_NAME is not set');

  registerOTel({ serviceName: env.OTEL_SERVICE_NAME });

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
