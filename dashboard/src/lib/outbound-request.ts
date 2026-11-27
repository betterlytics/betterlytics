import 'server-only';
import { request as httpRequest, type IncomingHttpHeaders, type OutgoingHttpHeaders } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { isIP } from 'node:net';
import { createGuardedLookup, isAddressAllowed, urlHostname, type Resolver } from '@/lib/outbound-target';

const TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 3;

export type ResponseHead = { status: number; headers: IncomingHttpHeaders };

type RequestInit = { method: 'GET' | 'POST'; headers: OutgoingHttpHeaders; body?: string; signal?: AbortSignal };

function assertAllowedTarget(url: URL, allowPrivateTargets: boolean): void {
  const isHttps = url.protocol === 'https:';
  if (!isHttps && !(allowPrivateTargets && url.protocol === 'http:')) throw new Error('Blocked scheme');

  const hostname = urlHostname(url);
  // IP literals never reach lookup, so they are checked here
  if (isIP(hostname) && !isAddressAllowed(hostname, allowPrivateTargets)) throw new Error('Blocked target');
}

// Done at the response headers: the body is never read, so a slow one can't hold the socket
function sendGuarded(
  url: URL,
  allowPrivateTargets: boolean,
  init: RequestInit,
  resolve?: Resolver,
): Promise<ResponseHead> {
  return new Promise((resolveRequest, reject) => {
    const req = (url.protocol === 'https:' ? httpsRequest : httpRequest)(
      url,
      {
        method: init.method,
        lookup: createGuardedLookup(allowPrivateTargets, resolve),
        // A pooled keep-alive socket would skip lookup
        agent: false,
        timeout: TIMEOUT_MS,
        headers: init.headers,
        signal: init.signal,
      },
      (res) => {
        res.destroy();
        resolveRequest({ status: res.statusCode ?? 0, headers: res.headers });
      },
    );
    req.on('timeout', () => req.destroy(new Error('Request timed out')));
    req.on('error', reject);
    req.end(init.body);
  });
}

export async function postJsonGuarded(
  rawUrl: string,
  body: unknown,
  allowPrivateTargets: boolean,
  resolve?: Resolver,
): Promise<void> {
  const url = new URL(rawUrl);
  assertAllowedTarget(url, allowPrivateTargets);

  const payload = JSON.stringify(body);
  // Never follows redirects
  await sendGuarded(
    url,
    allowPrivateTargets,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
      body: payload,
    },
    resolve,
  );
}

type FetchResponseHeadOptions = {
  allowPrivateTargets: boolean;
  /** For the whole check, redirects included */
  deadlineMs: number;
  /** Checked for the first address and every redirect */
  allowUrl: (url: URL) => boolean;
  resolve?: Resolver;
};

type Send = (url: URL, init: RequestInit) => Promise<ResponseHead>;

/**
 * GETs a page only far enough to read its response headers, following up to three redirects.
 * Every hop goes through the outbound guard and `allowUrl`, and no body is read.
 */
export async function fetchResponseHeadGuarded(
  rawUrl: string,
  options: FetchResponseHeadOptions,
  send: Send = (url, init) => sendGuarded(url, options.allowPrivateTargets, init, options.resolve),
): Promise<ResponseHead> {
  const signal = AbortSignal.timeout(options.deadlineMs);
  let url = new URL(rawUrl);
  for (let hop = 0; ; hop++) {
    assertAllowedTarget(url, options.allowPrivateTargets);
    if (!options.allowUrl(url)) throw new Error('Blocked target');

    const head = await send(url, {
      method: 'GET',
      headers: { Accept: 'text/html', 'User-Agent': 'Betterlytics heatmap framing check' },
      signal,
    });
    if (head.status >= 300 && head.status < 400 && head.headers.location && hop < MAX_REDIRECTS) {
      url = new URL(head.headers.location, url);
      continue;
    }
    return head;
  }
}
