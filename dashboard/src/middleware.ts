import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SUPPORTED_LANGUAGES } from './constants/supportedLanguages';
import { SupportedLanguages } from './dictionaries/dictionaries';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Grab the first URL segment after the leading slash
  const firstSegment = pathname.split('/')[1];

  if (SUPPORTED_LANGUAGES.includes(firstSegment as SupportedLanguages)) {
    // Set a custom header so we can read it later in getRequestConfig
    request.headers.set('x-locale', firstSegment);
  }

  return NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
}
