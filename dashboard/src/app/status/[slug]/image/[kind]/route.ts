import { NextResponse } from 'next/server';
import { StatusPageImageKindSchema } from '@/entities/analytics/statusPage/statusPage.entities';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { getPublicStatusPageImage } from '@/services/analytics/publicStatusPage.service';

type ImageRouteParams = { params: Promise<{ slug: string; kind: string }> };

export async function GET(_request: Request, { params }: ImageRouteParams) {
  const { slug, kind } = await params;

  const parsedKind = StatusPageImageKindSchema.safeParse(kind);
  if (!parsedKind.success || !isFeatureEnabled('enablePublicStatusPages')) {
    return new NextResponse(null, { status: 404 });
  }

  const image = await getPublicStatusPageImage(slug, parsedKind.data);

  if (!image) {
    return new NextResponse(null, { status: 404, headers: { 'Cache-Control': 'public, max-age=86400' } });
  }

  // SVG is a document format, so it gets the stricter treatment: no resource loads of any kind,
  // and `attachment` makes direct navigation download the file instead of rendering it as a page
  // (<img> subresource loads ignore Content-Disposition, so embedding is unaffected).
  const isSvg = image.mimeType === 'image/svg+xml';

  return new NextResponse(image.data as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': image.mimeType,
      // Safe to cache forever: the rendered <img src> carries ?v={hash}, so new content => new URL.
      'Cache-Control': 'public, max-age=31536000, immutable',
      ...(image.hash ? { ETag: `"${image.hash}"` } : {}),
      // Owner-uploaded bytes served from our origin: never let the browser sniff a different type, and
      // disallow any script execution even if a payload slips past the upload-time validation.
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': isSvg ? "default-src 'none'" : "script-src 'none'",
      'Content-Disposition': isSvg ? 'attachment' : 'inline',
    },
  });
}
