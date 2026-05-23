import { NextRequest, NextResponse } from 'next/server';
import { domainValidation } from '@/entities/dashboard/dashboard.entities';

const USER_AGENT = 'Better Analytics Favicon Proxy';
const DDG_ICON_BASE = 'https://icons.duckduckgo.com/ip3';

const CONFIG = {
  timeoutMs: 2_000,
  cacheSeconds: 60 * 60 * 24 * 3,
  negativeCacheSeconds: 60 * 60 * 24,
  maxBytes: 100 * 1024,
};

export async function GET(request: NextRequest) {
  const domainParam = request.nextUrl.searchParams.get('domain');
  if (!domainParam) {
    return negativeResponse();
  }

  const parsed = domainValidation.safeParse(domainParam);
  if (!parsed.success) {
    return negativeResponse();
  }

  const response = await proxyFavicon(parsed.data);
  if (response) {
    return response;
  }

  // Negative cache: if we fail to resolve a favicon for this domain, return a 404
  // with the same caching semantics as a successful favicon. This prevents repeated
  // lookups for obviously bad or misconfigured domains.
  return negativeResponse();
}

function negativeResponse(): NextResponse {
  return new NextResponse(null, {
    status: 404,
    headers: {
      'Cache-Control': `public, max-age=${CONFIG.negativeCacheSeconds}`,
    },
  });
}

async function proxyFavicon(domain: string): Promise<NextResponse | null> {
  // Proxy via DDG: handles HTML parsing internally, and proxying keeps end-user IPs off DDG
  return await fetchFavicon(`${DDG_ICON_BASE}/${encodeURIComponent(domain)}.ico`);
}

async function fetchFavicon(url: string): Promise<NextResponse | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeoutMs);

  try {
    const upstream = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'image/*',
      },
      next: {
        revalidate: CONFIG.cacheSeconds,
      },
    });

    if (!upstream.ok) {
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

    const body = await upstream.arrayBuffer();
    if (body.byteLength > CONFIG.maxBytes) {
      return null;
    }

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': `public, max-age=${CONFIG.cacheSeconds}`,
        'Content-Security-Policy': "script-src 'none'",
        'Content-Disposition': 'attachment',
      },
    });
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
