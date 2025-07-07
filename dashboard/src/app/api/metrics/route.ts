import { NextRequest } from 'next/server';
import { collectDefaultMetrics, register } from 'prom-client';

let metricsInitialized = false;

// Required to avoid issues with hot reloading registering metrics multiple times
if (!metricsInitialized) {
  collectDefaultMetrics({ register });
  metricsInitialized = true;
}

export async function GET(req: NextRequest) {
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
