import { registerOTel } from '@vercel/otel';
import { env } from './lib/env';

export function register() {
  if (!env.ENABLE_MONITORING) return;
  if (!env.OTEL_SERVICE_NAME) throw new Error('OTEL_SERVICE_NAME is not set');

  registerOTel({ serviceName: env.OTEL_SERVICE_NAME });
}
