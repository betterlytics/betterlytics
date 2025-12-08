import { NextRequest, NextResponse } from 'next/server';
import { lookup } from 'dns/promises';
import ipaddr from 'ipaddr.js';
import { domainValidation } from '@/entities/dashboard/dashboard.entities';

const USER_AGENT = 'Better Analytics Favicon Proxy';
const SUPPORTED_PROTOCOLS: Array<'https' | 'http'> = ['https', 'http'];
const FAVICON_PATHS: string[] = ['/favicon.ico', '/favicon.png', '/favicon.jpg', '/apple-touch-icon.png'];

const CONFIG = {
  timeoutMs: 2_000,
  cacheSeconds: 60 * 60 * 24 * 3,
  negativeCacheSeconds: 60 * 60 * 6,
  maxBytes: 100 * 1024,
  maxRedirects: 5,
};

export async function GET(request: NextRequest) {
  const domainParam = request.nextUrl.searchParams.get('domain');
  if (!domainParam) {
    return new NextResponse(null, { status: 400 });
  }

  const parsed = domainValidation.safeParse(domainParam);
  if (!parsed.success) {
    return new NextResponse(null, { status: 400 });
  }

  const response = await proxyFavicon(parsed.data);
  if (response) {
    return response;
  }

  // Negative cache: if we fail to resolve a favicon for this domain, return a 404
  // with the same caching semantics as a successful favicon. This prevents repeated
  // lookups for obviously bad or misconfigured domains.
  return new NextResponse(null, {
    status: 404,
    headers: {
      'Cache-Control': `public, max-age=${CONFIG.negativeCacheSeconds}`,
    },
  });
}

async function proxyFavicon(domain: string): Promise<NextResponse | null> {
  for (const protocol of SUPPORTED_PROTOCOLS) {
    for (const path of FAVICON_PATHS) {
      const response = await fetchFavicon(`${protocol}://${domain}${path}`);
      if (response) {
        return response;
      }
    }
  }
  return null;
}

async function fetchFavicon(url: string): Promise<NextResponse | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeoutMs);

  try {
    const upstream = await fetchWithRedirectLimit(
      url,
      {
        signal: controller.signal,
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'image/*',
        },
        next: {
          revalidate: CONFIG.cacheSeconds,
        },
      },
      CONFIG.maxRedirects,
    );

    if (!upstream) {
      return null;
    }

    if (!upstream.ok || !upstream.body) {
      return null;
    }

    const contentType = upstream.headers.get('content-type');
    if (!contentType?.startsWith('image/')) {
      return null;
    }

    const contentLengthHeader = upstream.headers.get('content-length');
    if (contentLengthHeader) {
      const contentLength = Number(contentLengthHeader);
      if (!Number.isNaN(contentLength) && contentLength > CONFIG.maxBytes) {
        return null;
      }
    }

    const body = await readLimitedBody(upstream, CONFIG.maxBytes);
    if (!body) {
      return null;
    }

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': `public, max-age=${CONFIG.cacheSeconds}`,
      },
    });
  } catch (error) {
    // Network/TLS issues for arbitrary user domains are expected.
    // We don't want to log these in production to avoid log spam.
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchWithRedirectLimit(
  url: string,
  init: RequestInit,
  maxRedirects: number,
): Promise<Response | null> {
  let currentUrl = url;

  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount += 1) {
    const isSafe = await isSafeOutgoingUrl(currentUrl);
    if (!isSafe) {
      return null;
    }

    const response = await fetch(currentUrl, {
      ...init,
      redirect: 'manual',
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) {
        return null;
      }

      try {
        currentUrl = new URL(location, currentUrl).toString();
      } catch {
        return null;
      }

      continue;
    }

    return response;
  }

  return null;
}

async function readLimitedBody(response: Response, maxBytes: number): Promise<ArrayBuffer | null> {
  const body = response.body;
  if (!body) {
    return null;
  }

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    if (!value) {
      continue;
    }

    receivedBytes += value.byteLength;
    if (receivedBytes > maxBytes) {
      await reader.cancel();
      return null;
    }

    chunks.push(value);
  }

  const result = new Uint8Array(receivedBytes);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return result.buffer as ArrayBuffer;
}

async function isSafeOutgoingUrl(rawUrl: string): Promise<boolean> {
  let url: URL;

  try {
    url = new URL(rawUrl);
  } catch {
    return false;
  }

  const hostname = url.hostname;

  if (isIpLiteral(hostname)) {
    return false;
  }

  try {
    const lookupResult = await lookup(hostname, { all: true });

    for (const addressInfo of lookupResult) {
      const { address } = addressInfo;
      if (isBlockedAddress(address)) {
        return false;
      }
    }
  } catch {
    return false;
  }

  return true;
}

function isIpLiteral(hostname: string): boolean {
  return ipaddr.isValid(hostname);
}

function isBlockedAddress(address: string): boolean {
  if (!ipaddr.isValid(address)) {
    return true;
  }

  return ipaddr.parse(address).range() !== 'unicast';
}
