import { createServer } from 'node:http';
import { PgBoss } from 'pg-boss';
import { JOB_REGISTRY } from '@/worker/jobs/registry';
import { workerEnv } from '@/worker/workerEnv';

async function main() {
  const boss = new PgBoss(workerEnv.POSTGRES_URL);

  boss.on('error', (err) => console.error({ event: 'pg-boss:error', err }));
  boss.on('warning', (warning) => console.warn({ event: 'pg-boss:warning', warning }));

  let isShuttingDown = false;
  const healthServer = createServer((req, res) => {
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
    res.writeHead(404);
    res.end();
  });

  try {
    await boss.start();
    console.info(`Worker started. Registering ${JOB_REGISTRY.length} jobs.`);

    for (const job of JOB_REGISTRY) {
      await boss.createQueue(job.name, {
        ...(job.deadLetter ? { deadLetter: job.deadLetter } : {}),
        retryLimit: job.retryLimit,
        retryBackoff: job.retryBackoff,
        expireInSeconds: job.expireInSeconds,
      });

      if (job.schedule) {
        await boss.schedule(job.name, job.schedule, null);
      }

      await boss.work(job.name, async ([j]) => {
        const startedAt = Date.now();
        try {
          await job.handler(j.data);
          console.info({ job: job.name, jobId: j.id, success: true, durationMs: Date.now() - startedAt });
        } catch (err) {
          console.error({ job: job.name, jobId: j.id, success: false, err, durationMs: Date.now() - startedAt });
          throw err;
        }
      });

      if (job.runOnStart) {
        await boss.send(job.name);
      }

      const tags = [job.schedule ? job.schedule : 'triggered', job.runOnStart ? 'run-on-start' : null].filter(
        Boolean,
      );
      console.info(`  ✓ ${job.name} (${tags.join(', ')})`);
    }

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
