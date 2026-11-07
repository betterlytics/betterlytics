import { describe, it, expect, vi } from 'vitest';
import {
  withoutDpopClientMetadata,
  withoutDpopInput,
  withoutDpopMetadataResponse,
  withoutDpopProof,
} from '@/mcp/auth/dpop';

const METADATA_URL = 'https://betterlytics.example/.well-known/oauth-authorization-server/api/auth';

function jsonResponse(body: unknown, init?: ResponseInit) {
  return Response.json(body, init);
}

describe('withoutDpopMetadataResponse', () => {
  it('removes every DPoP member from a discovery document', async () => {
    const response = await withoutDpopMetadataResponse(
      new Request(METADATA_URL),
      jsonResponse({
        issuer: 'https://betterlytics.example/api/auth',
        dpop_signing_alg_values_supported: ['ES256'],
        dpop_bound_access_tokens_required: true,
      }),
    );
    expect(await response.json()).toEqual({ issuer: 'https://betterlytics.example/api/auth' });
  });

  it('leaves other endpoints alone', async () => {
    const original = jsonResponse({ dpop_signing_alg_values_supported: ['ES256'] });
    const response = await withoutDpopMetadataResponse(
      new Request('https://betterlytics.example/api/auth/oauth2/token', { method: 'POST' }),
      original,
    );
    expect(response).toBe(original);
  });
});

describe('withoutDpopProof', () => {
  it('drops the DPoP header and keeps the rest of the request', async () => {
    const request = await withoutDpopProof(
      new Request('https://betterlytics.example/api/auth/oauth2/token', {
        method: 'POST',
        headers: { DPoP: 'proof', 'content-type': 'application/x-www-form-urlencoded' },
        body: 'grant_type=authorization_code',
      }),
    );
    expect(request.headers.has('dpop')).toBe(false);
    expect(request.headers.get('content-type')).toBe('application/x-www-form-urlencoded');
    expect(await request.text()).toBe('grant_type=authorization_code');
  });
});

describe('withoutDpopInput', () => {
  it('removes the parameter from the request it was given', () => {
    const body: Record<string, unknown> = { client_name: 'Agent', dpop_bound_access_tokens: true };
    withoutDpopInput(body, 'dpop_bound_access_tokens');
    expect(body).toEqual({ client_name: 'Agent' });
    expect(() => withoutDpopInput(undefined, 'dpop_jkt')).not.toThrow();
  });
});

describe('withoutDpopClientMetadata', () => {
  const documentUrl = 'https://client.example/oauth/metadata.json';

  it('drops dpop_bound_access_tokens from a metadata document', async () => {
    const fetchResource = vi.fn(async () =>
      jsonResponse({ client_id: documentUrl, dpop_bound_access_tokens: true }, { headers: { etag: '"v1"' } }),
    );
    const response = await withoutDpopClientMetadata(fetchResource)(documentUrl, { redirect: 'error' });
    expect(fetchResource).toHaveBeenCalledWith(documentUrl, { redirect: 'error' });
    expect(response.headers.get('etag')).toBe('"v1"');
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(await response.json()).toEqual({ client_id: documentUrl });
  });

  it('passes other responses through unchanged', async () => {
    const notModified = new Response(null, { status: 304 });
    expect(await withoutDpopClientMetadata(async () => notModified)(documentUrl)).toBe(notModified);

    const response = await withoutDpopClientMetadata(async () => new Response('not json'))(documentUrl);
    expect(await response.text()).toBe('not json');
  });

  it('passes an oversized document on cut short instead of reading all of it', async () => {
    let chunksRead = 0;
    const endless = new ReadableStream<Uint8Array>({
      pull(controller) {
        chunksRead++;
        controller.enqueue(new Uint8Array(1024).fill(120));
      },
    });
    const response = await withoutDpopClientMetadata(async () => new Response(endless))(documentUrl);
    const body = await response.arrayBuffer();
    expect(body.byteLength).toBeGreaterThan(5120);
    expect(chunksRead).toBeLessThan(10);
  });
});
