export async function register() {
  registerOpenTelemetry();
  await registerBackgroundJobs();
}

async function registerBackgroundJobs() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { env } = await import('@/lib/env');
    if (!env.BACKGROUND_JOBS_ENABLED) {
      console.info('Background jobs disabled, skipping');
      return;
    }
    const { startBackgroundJobs } = await import('@/lib/jobs/scheduler');
    startBackgroundJobs();
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
