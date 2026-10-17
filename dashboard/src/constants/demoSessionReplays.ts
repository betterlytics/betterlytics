import type { SessionReplay } from '@/entities/analytics/sessionReplays.entities';

type DemoSessionReplay = Omit<SessionReplay, 'site_id' | 'started_at' | 'ended_at' | 'date' | 's3_prefix'> & {
  endedMinutesAgo: number;
};

// Recordings served from public/demo-replays/<session_id>.ndjson
export const DEMO_SESSION_REPLAYS: DemoSessionReplay[] = [
  {
    session_id: '16968594901253342157',
    visitor_id: '8018674917054324068',
    endedMinutesAgo: 2,
    duration: 58,
    size_bytes: 155591,
    event_count: 224,
    start_url: '/',
    device_type: 'desktop',
    browser: 'Firefox',
    os: 'Windows',
    country_code: 'NL',
    error_count: 0,
  },
  {
    session_id: '13515586274288279664',
    visitor_id: '10200915007004435513',
    endedMinutesAgo: 9,
    duration: 56,
    size_bytes: 929809,
    event_count: 496,
    start_url: '/',
    device_type: 'desktop',
    browser: 'Edge',
    os: 'Windows',
    country_code: 'SE',
    error_count: 0,
  },
  {
    session_id: '18267387105860719827',
    visitor_id: '11501771846953689450',
    endedMinutesAgo: 21,
    duration: 75,
    size_bytes: 2563745,
    event_count: 237,
    start_url: '/pricing',
    device_type: 'desktop',
    browser: 'Chrome',
    os: 'macOS',
    country_code: 'DE',
    error_count: 0,
  },
];
