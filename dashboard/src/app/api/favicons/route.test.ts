import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/feature-flags', () => ({
  isFeatureEnabled: vi.fn(() => true),
}));

import { NextRequest } from 'next/server';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { GET } from './route';

const featureEnabled = vi.mocked(isFeatureEnabled);
const fetchMock = vi.fn();

function request(domain?: string) {
  const url = domain
    ? `http://localhost/api/favicons?domain=${encodeURIComponent(domain)}`
    : 'http://localhost/api/favicons';
  return new NextRequest(url);
}

beforeEach(() => {
  vi.clearAllMocks();
  featureEnabled.mockReturnValue(true);
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('GET /api/favicons', () => {
  it('returns the negative response without contacting the upstream when favicon fetching is disabled', async () => {
    featureEnabled.mockReturnValue(false);

    const response = await GET(request('example.com'));

    expect(response.status).toBe(404);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(featureEnabled).toHaveBeenCalledWith('enableFaviconFetching');
  });

  it('proxies the upstream icon when favicon fetching is enabled', async () => {
    fetchMock.mockResolvedValue(
      new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: { 'Content-Type': 'image/x-icon' },
      }),
    );

    const response = await GET(request('example.com'));

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toBe('https://icons.duckduckgo.com/ip3/example.com.ico');
  });

  it('returns the negative response for an invalid domain without contacting the upstream', async () => {
    const response = await GET(request('not a domain'));

    expect(response.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
