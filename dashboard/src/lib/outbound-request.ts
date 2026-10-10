import 'server-only';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { isIP } from 'node:net';
import { createGuardedLookup, isAddressAllowed, urlHostname, type Resolver } from '@/lib/outbound-target';

const TIMEOUT_MS = 10_000;

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
