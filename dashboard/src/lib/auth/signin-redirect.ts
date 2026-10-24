import { signInPath } from '@/lib/auth/auth-page-state';
import { toSafeRelativePath } from '@/lib/auth/safe-redirect';

// Carries the requested page from middleware to the sign-in redirect of a signed-out page load.
export const SIGNIN_RETURN_TO_HEADER = 'x-ba-signin-return-to';

type MiddlewareRequest = {
  method: string;
  headers: Headers;
  nextUrl: { pathname: string; search: string };
};

// Next hides the RSC header from middleware and from headers(), so a full page load is recognised by
// the browser's own Sec-Fetch-Dest. Client navigations, prefetches and refreshes are fetches (`empty`)
// and server actions are POSTs: those keep bouncing to plain /signin. Browsers only send Sec-Fetch-Dest
// to HTTPS and localhost, so a self-host on plain HTTP falls back to Accept: a page load asks for
// text/html, while Next's own fetches send the default */*.
function isDocumentLoad(request: MiddlewareRequest): boolean {
  if (request.method !== 'GET') return false;
  const dest = request.headers.get('sec-fetch-dest');
  if (dest !== null) return dest === 'document';
  return request.headers.get('accept')?.includes('text/html') ?? false;
}

// Always overwrites the header, so a client cannot supply its own value.
export function withSigninReturnTo(request: MiddlewareRequest): Headers {
  const headers = new Headers(request.headers);
  headers.delete(SIGNIN_RETURN_TO_HEADER);
  if (isDocumentLoad(request)) {
    headers.set(SIGNIN_RETURN_TO_HEADER, `${request.nextUrl.pathname}${request.nextUrl.search}`);
  }
  return headers;
}

export function getSigninPath(requestHeaders: Headers): string {
  return signInPath(toSafeRelativePath(requestHeaders.get(SIGNIN_RETURN_TO_HEADER), ''));
}
