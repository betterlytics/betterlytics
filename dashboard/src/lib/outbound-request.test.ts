import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchResponseHeadGuarded, postJsonGuarded } from './outbound-request';

describe('postJsonGuarded', () => {
  let server: Server;
  let port: number;
  let requests = 0;

  beforeAll(async () => {
    server = createServer((_req, res) => {
      requests += 1;
      res.end('ok');
    });
    await new Promise<void>((listening) => server.listen(0, '127.0.0.1', listening));
    port = (server.address() as AddressInfo).port;
  });

  afterAll(async () => {
    await new Promise((closed) => server.close(closed));
  });

  beforeEach(() => {
    requests = 0;
  });

  it('refuses a hostname that resolves to loopback at connect time', async () => {
    const resolver = vi.fn(async () => ['127.0.0.1']);

    await expect(postJsonGuarded(`http://rebind.test:${port}/`, {}, true, resolver)).rejects.toMatchObject({
      code: 'EACCES',
    });
    expect(resolver).toHaveBeenCalledWith('rebind.test');
    expect(requests).toBe(0);
  });

  it('refuses a loopback literal', async () => {
    await expect(postJsonGuarded(`http://127.0.0.1:${port}/`, {}, true)).rejects.toThrow('Blocked target');
    expect(requests).toBe(0);
  });

  it('refuses http without the allowance before resolving', async () => {
    const resolver = vi.fn(async () => ['93.184.216.34']);

    await expect(postJsonGuarded(`http://hooks.example:${port}/`, {}, false, resolver)).rejects.toThrow(
      'Blocked scheme',
    );
    expect(resolver).not.toHaveBeenCalled();
  });
});

describe('fetchResponseHeadGuarded', () => {
  const options = {
    allowPrivateTargets: false,
    deadlineMs: 5000,
    allowUrl: (url: URL) => url.hostname.endsWith('example.com'),
  };

  // Each hop's socket is replaced, so the redirect handling is tested on its own
  function redirectsThen(final: number, ...locations: string[]) {
    const queue = [...locations];
    return vi.fn<(url: URL) => Promise<{ status: number; headers: { location?: string } }>>(async () => {
      const location = queue.shift();
      return location ? { status: 302, headers: { location } } : { status: final, headers: {} };
    });
  }

  it('follows a relative redirect from the address it came from', async () => {
    const send = redirectsThen(200, '/pricing/');

    await expect(fetchResponseHeadGuarded('https://www.example.com/pricing', options, send)).resolves.toMatchObject({
      status: 200,
    });
    expect(send.mock.calls.map(([url]) => url.href)).toEqual([
      'https://www.example.com/pricing',
      'https://www.example.com/pricing/',
    ]);
  });

  it('refuses a redirect to a blocked address, plain http or another host', async () => {
    for (const location of ['https://127.0.0.1/', 'http://www.example.com/', 'https://evil.test/']) {
      const send = redirectsThen(200, location);
      await expect(fetchResponseHeadGuarded('https://www.example.com/', options, send)).rejects.toThrow(/Blocked/);
      expect(send).toHaveBeenCalledTimes(1);
    }
  });

  it('stops following redirects after three', async () => {
    const send = redirectsThen(200, '/1', '/2', '/3', '/4');

    await expect(fetchResponseHeadGuarded('https://www.example.com/', options, send)).resolves.toMatchObject({
      status: 302,
    });
    expect(send).toHaveBeenCalledTimes(4);
  });
});
