export async function register() {
  registerOpenTelemetry();
  registerSiteConfigReconciliation();
}

export async function registerSiteConfigReconciliation() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { env } = await import('@/lib/env');
    if (!env.REDIS_URL) {
      console.log('Redis URL is not set, skipping dashboard config reconciliation');
      return;
    }

    try {
      const { reconcileAllSiteConfigs } = await import('@/services/dashboard');

      reconcileAllSiteConfigs()
        .then(({ processed }) => {
          console.log(`Redis warm-up finished. processed=${processed}`);
        })
        .catch((err) => {
          console.error('Redis warm-up failed:', err);
        });
    } catch (err) {
      console.error('Redis warm-up failed:', err);
    }
  }
}

export async function registerOpenTelemetry() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { env } = await import('@/lib/env');
    if (!env.ENABLE_MONITORING) return;
    if (!env.OTEL_SERVICE_NAME) throw new Error('OTEL_SERVICE_NAME is not set');
    const { registerOTel } = await import('@vercel/otel');
    registerOTel({ serviceName: env.OTEL_SERVICE_NAME });
  }
}
