import { NextRequest } from 'next/server';
import { collectDefaultMetrics, register } from 'prom-client';
import { env } from '@/lib/env';
import { lazyCache } from '@/lib/lazy-cache';

const collectDefaultMetricsCache = lazyCache(() => {
  if (process.env.ENABLE_MONITORING) {
    collectDefaultMetrics({ register });
  }
  return true;
});

export async function GET(req: NextRequest) {
  if (!env.ENABLE_MONITORING) {
    return new Response('Metrics disabled', {
      status: 404,
    });
  }

  collectDefaultMetricsCache();

  const contentType = register.contentType;
  const metrics = await register.metrics();

  return new Response(metrics, {
    status: 200,
    headers: {
      'Content-Type': contentType,
    },
  });
}

export const runtime = 'nodejs';
