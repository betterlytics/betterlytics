import { NextResponse } from 'next/server';
import { getPublicStatusPageLogo } from '@/services/analytics/publicStatusPage.service';

type LogoRouteParams = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: LogoRouteParams) {
  const { slug } = await params;
  const logo = await getPublicStatusPageLogo(slug);

  if (!logo) {
    return new NextResponse(null, { status: 404, headers: { 'Cache-Control': 'public, max-age=86400' } });
  }

  return new NextResponse(logo.data as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': logo.mimeType,
      // Safe to cache forever: the rendered <img src> carries ?v={hash}, so new content => new URL.
      'Cache-Control': 'public, max-age=31536000, immutable',
      ...(logo.hash ? { ETag: `"${logo.hash}"` } : {}),
      // Mirror the favicon proxy hardening: never let an image be treated as an active document.
      'Content-Security-Policy': "script-src 'none'",
      'Content-Disposition': 'inline',
    },
  });
}
