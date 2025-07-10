import { NextRequest } from 'next/server';
import { collectDefaultMetrics, register } from 'prom-client';
import { env } from '@/lib/env';

let metricsInitialized = false;

// Required to avoid issues with hot reloading registering metrics multiple times
if (env.ENABLE_MONITORING && !metricsInitialized) {
  collectDefaultMetrics({ register });
  metricsInitialized = true;
}

export async function GET(req: NextRequest) {
  if (!env.ENABLE_MONITORING) {
    return new Response('Metrics disabled', {
      status: 404,
    });
  }

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
