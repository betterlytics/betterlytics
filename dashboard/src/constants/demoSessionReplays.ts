import type { SessionReplay } from '@/entities/analytics/sessionReplays.entities';

type DemoSessionReplay = Omit<SessionReplay, 'site_id' | 'started_at' | 'ended_at' | 'date' | 's3_prefix'> & {
  endedMinutesAgo: number;
};

// Recordings served from public/demo-replays/<session_id>.ndjson
export const DEMO_SESSION_REPLAYS: DemoSessionReplay[] = [
  {
    session_id: '14445731518390628775',
    visitor_id: '18424755441283352403',
    endedMinutesAgo: 4,
    duration: 44,
    size_bytes: 2235418,
    event_count: 98,
    start_url: '/vs/google-analytics',
    device_type: 'desktop',
    browser: 'Chrome',
    os: 'Mac OS X',
    country_code: 'DE',
    error_count: 0,
  },
  {
    session_id: '7232805401559086446',
    visitor_id: '3317191895022419203',
    endedMinutesAgo: 19,
    duration: 104,
    size_bytes: 3250538,
    event_count: 953,
    start_url: '/',
    device_type: 'desktop',
    browser: 'Chrome',
    os: 'Windows',
    country_code: 'DK',
    error_count: 0,
  },
  {
    session_id: '2414364543570353435',
    visitor_id: '1185309476018121761',
    endedMinutesAgo: 47,
    duration: 56,
    size_bytes: 2885657,
    event_count: 1954,
    start_url: '/',
    device_type: 'mobile',
    browser: 'Mobile Safari',
    os: 'iOS',
    country_code: 'GB',
    error_count: 0,
  },
];
