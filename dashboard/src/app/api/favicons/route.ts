import { NextRequest, NextResponse } from 'next/server';
import { domainValidation } from '@/entities/dashboard';

const USER_AGENT = 'Better Analytics Favicon Proxy';
const SUPPORTED_PROTOCOLS: Array<'https' | 'http'> = ['https', 'http'];

const CONFIG = {
  timeoutMs: 2_000,
  cacheSeconds: 60 * 60 * 24 * 3,
  maxBytes: 100 * 1024,
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
  return response ?? new NextResponse(null, { status: 404 });
}

async function proxyFavicon(domain: string): Promise<NextResponse | null> {
  for (const protocol of SUPPORTED_PROTOCOLS) {
    const response = await fetchFavicon(`${protocol}://${domain}/favicon.ico`);
    if (response) {
      return response;
    }
  }
  return null;
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

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': `public, max-age=${CONFIG.cacheSeconds}`,
      },
    });
  } catch (error) {
    if ((error as Error).name !== 'AbortError') {
      console.warn('[favicon-proxy] Failed to fetch favicon from', url, error);
    }
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
