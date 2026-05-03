import { createServer } from 'node:http';
import { getBoss } from '@/lib/pgboss';
import { workerEnv } from '@/lib/env/worker.env';
import { register } from '@/worker/metrics';
import { registerWorkersOnce } from '@/worker/runtime';

async function main() {
  if (!workerEnv.BACKGROUND_JOBS_ENABLED) {
    console.info('BACKGROUND_JOBS_ENABLED=false, exiting');
    return;
  }

  const boss = await getBoss();

  let isShuttingDown = false;
  const healthServer = createServer(async (req, res) => {
    if (req.url === '/healthz') {
      if (isShuttingDown) {
        res.writeHead(503, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ status: 'shutting_down' }));
        return;
      }
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }
    if (req.url === '/metrics') {
      if (!workerEnv.ENABLE_MONITORING) {
        res.writeHead(404);
        res.end();
        return;
      }
      res.writeHead(200, { 'content-type': register.contentType });
      res.end(await register.metrics());
      return;
    }
    res.writeHead(404);
    res.end();
  });

  try {
    await registerWorkersOnce(boss);

    await new Promise<void>((resolve) => {
      healthServer.listen(workerEnv.WORKER_HEALTH_PORT, () => {
        console.info(`Health server listening on :${workerEnv.WORKER_HEALTH_PORT}/healthz`);
        resolve();
      });
    });
  } catch (err) {
    console.error({ event: 'worker:setup-failed', err });
    healthServer.close();
    await boss.stop({ graceful: false }).catch(() => {});
    throw err;
  }

  const shutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.info(`${signal} received — shutting down worker`);
    healthServer.close();
    try {
      await boss.stop({ graceful: true, timeout: 25_000 });
      console.info('Worker stopped');
      process.exit(0);
    } catch (err) {
      console.error({ event: 'worker:shutdown-failed', err });
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('Worker failed to start:', err);
  process.exit(1);
});
