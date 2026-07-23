export async function register() {
  await registerOpenTelemetry();
  await registerBackgroundJobs();
}

async function registerBackgroundJobs() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { env } = await import('@/lib/env');
    if (!env.BACKGROUND_JOBS_ENABLED) {
      console.info(
        '[instrumentation] Background jobs disabled (BACKGROUND_JOBS_ENABLED=false), skipping embedded worker',
      );
      return;
    }
    if (env.IS_CLOUD && process.env.NODE_ENV !== 'development') {
      console.info(
        '[instrumentation] IS_CLOUD=true in non-dev env, skipping embedded worker (expecting separate worker process)',
      );
      return;
    }
    console.info('[instrumentation] Starting embedded worker...');
    const { startEmbeddedWorker } = await import('@/worker/embedded');
    await startEmbeddedWorker();
    console.info('[instrumentation] Embedded worker started.');
  }
}

export async function registerOpenTelemetry() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { env } = await import('@/lib/env');
    if (!env.ENABLE_MONITORING) return;
    if (!env.OTEL_SERVICE_NAME) throw new Error('OTEL_SERVICE_NAME is not set');
    const { registerOTel } = await import('@vercel/otel');
    registerOTel({
      serviceName: env.OTEL_SERVICE_NAME,
      attributesFromHeaders: {
        'next.prefetch': 'Next-Router-Prefetch',
      },
    });
  }
}
