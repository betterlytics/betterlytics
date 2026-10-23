import { ProxyTracerProvider, trace } from '@opentelemetry/api';

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

// @vercel/otel installs no shutdown hook, so buffered spans are lost on exit unless flushed
export async function flushTracing(timeoutMs = 3_000): Promise<void> {
  const provider = trace.getTracerProvider();
  const delegate = provider instanceof ProxyTracerProvider ? provider.getDelegate() : provider;
  const flush = (delegate as { forceFlush?: () => Promise<void> }).forceFlush?.();
  if (!flush) return;
  await Promise.race([flush.catch(() => {}), new Promise((resolve) => setTimeout(resolve, timeoutMs).unref())]);
}
