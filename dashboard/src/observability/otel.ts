export async function registerTracing(serviceName: string): Promise<void> {
  // @vercel/otel prefers OTEL_SERVICE_NAME over serviceName, so the worker would otherwise report as the dashboard
  process.env.OTEL_SERVICE_NAME = serviceName;

  const [{ registerOTel }, { PrismaInstrumentation }] = await Promise.all([
    import('@vercel/otel'),
    import('@prisma/instrumentation'),
  ]);
  registerOTel({
    serviceName,
    instrumentations: ['auto', new PrismaInstrumentation()],
    attributesFromHeaders: {
      'next.prefetch': 'Next-Router-Prefetch',
    },
  });
}
