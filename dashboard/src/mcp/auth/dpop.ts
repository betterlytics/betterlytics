import type { ClientMetadataResourceFetch } from '@better-auth/oauth-provider';

/*
 * DPoP is off: MCP clients don't use it and its MCP profile isn't final (#483). better-auth has no switch for it and
 * binds a token whenever a request asks, so these strip the asking before the library sees it and the advertising
 * from what it serves. Every token is then a plain Bearer token.
 */

// The CIMD plugin's own cap on a metadata document; a longer body is passed on cut short for it to reject
const MAX_CLIENT_METADATA_BYTES = 5120;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Discovery metadata without `dpop_signing_alg_values_supported` or any other `dpop_*` member. */
export function withoutDpopMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(metadata).filter(([key]) => !key.startsWith('dpop_')));
}

/**
 * Removes a request parameter that asks for DPoP (`dpop_jkt` at authorize, `dpop_bound_access_tokens` at
 * registration). In place: better-auth merges what a before hook returns into the request, which can't drop a key.
 */
export function withoutDpopInput(params: Record<string, unknown> | undefined, key: string): void {
  if (params && Object.hasOwn(params, key)) delete params[key];
}

/** A token request without its DPoP proof, so the library issues a Bearer token as RFC 9449 has it. */
export async function withoutDpopProof(request: Request): Promise<Request> {
  if (!request.headers.has('dpop')) return request;
  const headers = new Headers(request.headers);
  headers.delete('dpop');
  // Rebuilt rather than cloned: Next's request subclass can't be passed to the Request constructor
  return new Request(request.url, { method: request.method, headers, body: await request.arrayBuffer() });
}

function isMetadataPath(pathname: string): boolean {
  return pathname.includes('/.well-known/');
}

/** A discovery response with its DPoP members removed; anything else is returned as it is. */
export async function withoutDpopMetadataResponse(request: Request, response: Response): Promise<Response> {
  if (!isMetadataPath(new URL(request.url).pathname) || !response.ok || request.method !== 'GET') return response;
  if (!response.headers.get('content-type')?.includes('json')) return response;

  const metadata: unknown = await response.json();
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  return new Response(JSON.stringify(isRecord(metadata) ? withoutDpopMetadata(metadata) : metadata), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function readLimited(response: Response, maximumBytes: number): Promise<Uint8Array<ArrayBuffer>> {
  const reader = response.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total <= maximumBytes) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.byteLength;
  }
  if (total > maximumBytes) await reader.cancel();
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

/** Fetches a CIMD document like `fetch`, then drops `dpop_bound_access_tokens` from it. */
export function withoutDpopClientMetadata(
  fetchResource: ClientMetadataResourceFetch,
): ClientMetadataResourceFetch {
  return async (input, init) => {
    const response = await fetchResource(input, init);
    if (response.status !== 200 || response.redirected) return response;

    const bytes = await readLimited(response, MAX_CLIENT_METADATA_BYTES);
    const headers = new Headers(response.headers);
    headers.delete('content-length');
    let body: BodyInit = bytes;
    if (bytes.byteLength <= MAX_CLIENT_METADATA_BYTES) {
      try {
        const document: unknown = JSON.parse(new TextDecoder().decode(bytes));
        if (isRecord(document) && Object.hasOwn(document, 'dpop_bound_access_tokens')) {
          withoutDpopInput(document, 'dpop_bound_access_tokens');
          body = JSON.stringify(document);
        }
      } catch {
        // not JSON: the plugin rejects it with its own message
      }
    }
    return new Response(body, { status: response.status, statusText: response.statusText, headers });
  };
}
