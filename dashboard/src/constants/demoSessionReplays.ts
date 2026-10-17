import type { SessionReplay } from '@/entities/analytics/sessionReplays.entities';

type DemoSessionReplay = Omit<SessionReplay, 'site_id' | 'started_at' | 'ended_at' | 'date' | 's3_prefix'> & {
  endedMinutesAgo: number;
};

// Recordings served from public/demo-replays/<session_id>.ndjson
export const DEMO_SESSION_REPLAYS: DemoSessionReplay[] = [
  {
    session_id: '17969784260461275337',
    visitor_id: '12338211488004548168',
    endedMinutesAgo: 4,
    duration: 101,
    size_bytes: 1870219,
    event_count: 955,
    start_url: '/',
    device_type: 'desktop',
    browser: 'Chrome',
    os: 'Windows',
    country_code: 'DK',
    error_count: 8,
  },
  {
    session_id: '16968594901253342157',
    visitor_id: '8018674917054324068',
    endedMinutesAgo: 11,
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
  {
    session_id: '14474506353404477706',
    visitor_id: '10910948625790626283',
    endedMinutesAgo: 46,
    duration: 82,
    size_bytes: 2203236,
    event_count: 690,
    start_url: '/',
    device_type: 'mobile',
    browser: 'Mobile Safari',
    os: 'iOS',
    country_code: 'GB',
    error_count: 0,
  },
];
