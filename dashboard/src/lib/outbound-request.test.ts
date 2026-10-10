import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { postJsonGuarded } from './outbound-request';

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
