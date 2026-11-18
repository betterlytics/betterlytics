import 'server-only';
import { request as httpRequest, type IncomingHttpHeaders } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { isIP } from 'node:net';
import { createGuardedLookup, isAddressAllowed, urlHostname, type Resolver } from '@/lib/outbound-target';

const TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 3;

export type GuardedResponseHead = { status: number; headers: IncomingHttpHeaders; url: string };

/**
 * GETs a page only far enough to read its response headers, following up to three redirects.
 * Every hop goes through the outbound guard, and no body is read.
 */
export async function fetchResponseHeadGuarded(
  rawUrl: string,
  allowPrivateTargets: boolean,
  timeoutMs = TIMEOUT_MS,
  resolve?: Resolver,
): Promise<GuardedResponseHead> {
  let url = new URL(rawUrl);
  for (let hop = 0; ; hop++) {
    const { status, headers } = await requestHead(url, allowPrivateTargets, timeoutMs, resolve);
    if (status >= 300 && status < 400 && headers.location && hop < MAX_REDIRECTS) {
      url = new URL(headers.location, url);
      continue;
    }
    return { status, headers, url: url.href };
  }
}

function requestHead(
  url: URL,
  allowPrivateTargets: boolean,
  timeoutMs: number,
  resolve?: Resolver,
): Promise<{ status: number; headers: IncomingHttpHeaders }> {
  const isHttps = url.protocol === 'https:';
  if (!isHttps && !(allowPrivateTargets && url.protocol === 'http:')) {
    return Promise.reject(new Error('Blocked scheme'));
  }
  const hostname = urlHostname(url);
  if (isIP(hostname) && !isAddressAllowed(hostname, allowPrivateTargets)) {
    return Promise.reject(new Error('Blocked target'));
  }

  return new Promise((resolveRequest, reject) => {
    const req = (isHttps ? httpsRequest : httpRequest)(
      url,
      {
        method: 'GET',
        lookup: createGuardedLookup(allowPrivateTargets, resolve),
        agent: false,
        timeout: timeoutMs,
        headers: { Accept: 'text/html', 'User-Agent': 'Betterlytics heatmap framing check' },
      },
      (res) => {
        res.destroy();
        resolveRequest({ status: res.statusCode ?? 0, headers: res.headers });
      },
    );
    req.on('timeout', () => req.destroy(new Error('Request timed out')));
    req.on('error', reject);
    req.end();
  });
}

export async function postJsonGuarded(
  rawUrl: string,
  body: unknown,
  allowPrivateTargets: boolean,
  resolve?: Resolver,
): Promise<void> {
  const url = new URL(rawUrl);
  const isHttps = url.protocol === 'https:';
  if (!isHttps && !(allowPrivateTargets && url.protocol === 'http:')) throw new Error('Blocked scheme');

  const hostname = urlHostname(url);
  // IP literals never reach lookup, so they are checked here
  if (isIP(hostname) && !isAddressAllowed(hostname, allowPrivateTargets)) throw new Error('Blocked target');

  const payload = JSON.stringify(body);
  await new Promise<void>((resolveRequest, reject) => {
    const req = (isHttps ? httpsRequest : httpRequest)(
      url,
      {
        method: 'POST',
        lookup: createGuardedLookup(allowPrivateTargets, resolve),
        // A pooled keep-alive socket would skip lookup
        agent: false,
        timeout: TIMEOUT_MS,
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
      },
      (res) => {
        // Done at headers and never follows redirects; the body is not read, so a slow one cannot hold the socket
        res.destroy();
        resolveRequest();
      },
    );
    req.on('timeout', () => req.destroy(new Error('Request timed out')));
    req.on('error', reject);
    req.end(payload);
  });
}
