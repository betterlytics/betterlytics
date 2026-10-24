import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '@/middleware';
import { SIGNIN_RETURN_TO_HEADER } from '@/lib/auth/signin-redirect';

const intlMiddleware = vi.hoisted(() => vi.fn());

vi.mock('next-intl/middleware', () => ({ default: () => intlMiddleware }));
vi.mock('@/lib/env', () => ({ env: { PUBLIC_BASE_URL: 'http://localhost:3000', STATUS_PAGE_DOMAIN: '' } }));
vi.mock('@/services/analytics/statusHost.service', () => ({ classifyStatusHost: vi.fn() }));

// NextResponse.next({ request: { headers } }) hands the page its request headers through these response headers
const OVERRIDDEN = 'x-middleware-override-headers';
const FORWARDED_RETURN_TO = `x-middleware-request-${SIGNIN_RETURN_TO_HEADER}`;

const PAGE_LOAD = { 'sec-fetch-dest': 'document' };

function request(path: string, headers: Record<string, string>) {
  return new NextRequest(`http://localhost:3000${path}`, { headers });
}

beforeEach(() => {
  intlMiddleware.mockReset().mockImplementation(() => NextResponse.next());
});

describe('middleware sign-in return address', () => {
  it('passes a page load of the signed-in app on to the page', async () => {
    const res = await middleware(request('/dashboard/abc/pages?filters=x&range=7d', PAGE_LOAD));
    expect(res.headers.get(FORWARDED_RETURN_TO)).toBe('/dashboard/abc/pages?filters=x&range=7d');
  });

  it('drops a client-sent return address on a client navigation', async () => {
    const res = await middleware(
      request('/billing', { 'sec-fetch-dest': 'empty', [SIGNIN_RETURN_TO_HEADER]: '/admin' }),
    );
    expect(res.headers.get(OVERRIDDEN)?.split(',')).not.toContain(SIGNIN_RETURN_TO_HEADER);
    expect(res.headers.get(FORWARDED_RETURN_TO)).toBeNull();
  });

  it('records nothing for a page load of the API', async () => {
    const res = await middleware(request('/api/auth/session', PAGE_LOAD));
    expect(res.headers.get(FORWARDED_RETURN_TO)).toBeNull();
    expect(intlMiddleware).not.toHaveBeenCalled();
  });

  it.each(['/signin', '/da/dashboard', '/dashboardsx'])('leaves a page load of %s to next-intl', async (path) => {
    const res = await middleware(request(path, PAGE_LOAD));
    expect(res.headers.get(FORWARDED_RETURN_TO)).toBeNull();
    expect(intlMiddleware).toHaveBeenCalledOnce();
  });
});
