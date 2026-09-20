import { Counter, Gauge, Histogram } from 'prom-client';

export const replayStreamsOpen = new Gauge({
  name: 'replay_streams_open',
  help: 'Replay segment streams currently open',
});

export const replayStreamsRefusedTotal = new Counter({
  name: 'replay_streams_refused_total',
  help: 'Replay segment streams refused by the concurrency cap',
  labelNames: ['reason'] as const,
});

export const replayStreamDurationSeconds = new Histogram({
  name: 'replay_stream_duration_seconds',
  help: 'Lifetime of a replay segment stream from slot acquire to release',
  buckets: [0.5, 1, 2.5, 5, 10, 30, 60, 120, 300, 600],
});
