import { Counter, Gauge, Histogram } from 'prom-client';

export const replayStreamsOpen = new Gauge({
  name: 'replay_streams_open',
  help: 'Replay segment streams currently open',
  labelNames: ['storage'] as const,
});

export const replayStreamsRefusedTotal = new Counter({
  name: 'replay_streams_refused_total',
  help: 'Replay segment streams refused by the concurrency cap, labelled with the deployment storage',
  labelNames: ['reason', 'storage'] as const,
});

export const replayStreamDurationSeconds = new Histogram({
  name: 'replay_stream_duration_seconds',
  help: 'Lifetime of a replay segment stream from slot acquire to release',
  labelNames: ['outcome', 'storage'] as const,
  buckets: [0.5, 1, 2.5, 5, 10, 30, 60, 120, 300, 600],
});

export const replayStreamOpenSeconds = new Histogram({
  name: 'replay_stream_open_seconds',
  help: 'Time from a replay segment request until its stream is ready to send',
  labelNames: ['outcome', 'storage'] as const,
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 3, 5, 10, 30],
});

export const replayStreamBytesServedTotal = new Counter({
  name: 'replay_stream_bytes_served_total',
  help: 'Bytes sent to viewers by replay segment streams, after compression',
  labelNames: ['storage'] as const,
});
