export async function register() {
  await registerHeapdump();
  await registerOpenTelemetry();
  await registerBackgroundJobs();
}

async function registerHeapdump() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const v8 = await import('v8');

    process.on('SIGUSR2', () => {
      const path = '/tmp/' + Date.now() + '.heapsnapshot';
      v8.writeHeapSnapshot(path);
      console.info('Heap snapshot written to', path);
    });
  }
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
