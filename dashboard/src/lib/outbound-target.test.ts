import { describe, expect, it } from 'vitest';
import {
  checkTargetUrl,
  checkWebhookUrl,
  classifyAddress,
  createGuardedLookup,
  isVendorWebhookUrl,
} from './outbound-target';

const resolvesTo =
  (...addresses: string[]) =>
  async () =>
    addresses;

const failingResolver = async () => {
  throw new Error('ENOTFOUND');
};

describe('classifyAddress', () => {
  it.each(['1.1.1.1', '2606:4700::1111', '::ffff:1.1.1.1', '64:ff9b::101:101'])('%s is public', (address) => {
    expect(classifyAddress(address)).toBe('public');
  });

  it.each([
    '10.1.2.3',
    '172.16.0.1',
    '172.31.255.255',
    '192.168.1.10',
    '100.64.0.1',
    '100.127.255.254',
    'fd12:3456::1',
    '::ffff:10.1.2.3',
    '64:ff9b::a00:1',
  ])('%s is private', (address) => {
    expect(classifyAddress(address)).toBe('private');
  });

  it.each([
    '169.254.169.254',
    '::ffff:169.254.169.254',
    '64:ff9b::a9fe:a9fe',
    '64:ff9b::169.254.169.254',
    '100.100.100.200',
    '0.0.0.0',
    '0.1.2.3',
    '224.0.0.1',
    '240.0.0.1',
    '255.255.255.255',
    '192.0.2.1',
    'fe80::1',
    '::',
    'ff02::1',
    'fd00:ec2::254',
    '127.0.0.1',
    '127.1.2.3',
    '::1',
    '::ffff:127.0.0.1',
    '64:ff9b::7f00:1',
    '64:ff9b::127.0.0.1',
  ])('%s is always blocked', (address) => {
    expect(classifyAddress(address)).toBe('blocked');
  });
});

describe('checkWebhookUrl', () => {
  it.each([
    ['https://hooks.example', ['93.184.216.34'], false, 'allowed', 'public https'],
    ['https://hooks.example', ['93.184.216.34'], true, 'allowed', 'public https with allowance'],
    ['http://hooks.example', ['93.184.216.34'], false, 'invalid', 'http without allowance'],
    ['http://hooks.example', ['93.184.216.34'], true, 'allowed', 'http with allowance'],
    ['https://hooks.example', ['93.184.216.34', '10.0.0.1'], false, 'mixed', 'mixed public/private answer'],
    ['https://hooks.example', ['93.184.216.34', '127.0.0.1'], true, 'mixed', 'mixed public/loopback answer'],
    ['https://10.0.0.1/', [], false, 'blocked', 'private literal without allowance'],
    ['https://10.0.0.1/', [], true, 'allowed', 'private literal with allowance'],
    ['http://192.168.1.10:8080/', [], true, 'allowed', 'lan literal with allowance'],
    ['http://nas.lan', ['192.168.1.10'], true, 'allowed', 'lan hostname with allowance'],
    ['https://169.254.169.254/', [], false, 'blocked', 'metadata literal'],
    ['https://169.254.169.254/', [], true, 'blocked', 'metadata literal with allowance'],
    ['https://[64:ff9b::a9fe:a9fe]/', [], true, 'blocked', 'nat64 metadata literal with allowance'],
    ['https://[::1]/', [], false, 'blocked', 'ipv6 loopback without allowance'],
    ['https://[::1]/', [], true, 'blocked', 'ipv6 loopback with allowance'],
    ['http://127.0.0.1:2019/stop', [], true, 'blocked', 'ipv4 loopback with allowance'],
    ['http://127.1.2.3/', [], true, 'blocked', 'ipv4 loopback range with allowance'],
    ['http://[::ffff:127.0.0.1]/', [], true, 'blocked', 'mapped loopback with allowance'],
    ['http://[64:ff9b::7f00:1]/', [], true, 'blocked', 'nat64 loopback with allowance'],
    ['http://2130706433/', [], true, 'blocked', 'decimal ip normalised to 127.0.0.1'],
    ['http://localhost:3000', ['127.0.0.1', '::1'], true, 'blocked', 'localhost with allowance'],
    ['https://hooks.example', [], true, 'unresolved', 'empty answer'],
    ['not a url', [], true, 'invalid', 'unparseable'],
    ['ftp://x', ['93.184.216.34'], true, 'invalid', 'unsupported scheme'],
  ])('%s resolving to %j, allowPrivateTargets=%s → %s (%s)', async (url, addresses, allowPrivateTargets, expected) => {
    expect(await checkWebhookUrl(url, allowPrivateTargets, resolvesTo(...addresses))).toBe(expected);
  });

  it('is unresolved when resolution fails', async () => {
    expect(await checkWebhookUrl('https://hooks.example', true, failingResolver)).toBe('unresolved');
  });
});

describe('checkTargetUrl', () => {
  it.each([
    ['http://example.com', ['93.184.216.34'], false, 'allowed', 'http is not a webhook-only rule'],
    ['http://127.0.0.1:3000', [], true, 'blocked', 'ipv4 loopback literal with allowance'],
    ['http://[::1]/', [], true, 'blocked', 'ipv6 loopback literal with allowance'],
    ['http://app.example', ['127.0.0.1'], true, 'blocked', 'hostname resolving to loopback'],
    ['http://app.example', ['93.184.216.34', '127.0.0.1'], true, 'mixed', 'public and loopback answer'],
    ['http://192.168.1.10:8080', [], true, 'allowed', 'lan literal with allowance'],
    ['http://192.168.1.10:8080', [], false, 'blocked', 'lan literal without allowance'],
    ['not a url', [], true, 'invalid', 'unparseable'],
  ])('%s resolving to %j, allowPrivateTargets=%s → %s (%s)', async (url, addresses, allowPrivateTargets, expected) => {
    expect(await checkTargetUrl(url, allowPrivateTargets, resolvesTo(...addresses))).toBe(expected);
  });

  it('is unresolved when resolution fails', async () => {
    expect(await checkTargetUrl('http://app.example', true, failingResolver)).toBe('unresolved');
  });
});

describe('createGuardedLookup', () => {
  type LookupResult = { error: NodeJS.ErrnoException | null; address: unknown; family?: number };

  const run = (lookup: ReturnType<typeof createGuardedLookup>, all: boolean) =>
    new Promise<LookupResult>((done) => {
      lookup('target.example', { all }, (error, address, family) => done({ error, address, family }));
    });

  it('returns only the allowed addresses of a mixed answer', async () => {
    const lookup = createGuardedLookup(true, resolvesTo('93.184.216.34', '127.0.0.1'));
    expect(await run(lookup, true)).toMatchObject({
      error: null,
      address: [{ address: '93.184.216.34', family: 4 }],
    });
    expect(await run(lookup, false)).toMatchObject({ error: null, address: '93.184.216.34', family: 4 });
  });

  it.each([true, false])('refuses an all-loopback answer, allowPrivateTargets=%s', async (allowPrivateTargets) => {
    const lookup = createGuardedLookup(allowPrivateTargets, resolvesTo('127.0.0.1', '::1'));
    expect((await run(lookup, true)).error?.code).toBe('EACCES');
    expect((await run(lookup, false)).error?.code).toBe('EACCES');
  });

  it('passes a private address only with the allowance', async () => {
    expect(await run(createGuardedLookup(true, resolvesTo('192.168.1.10')), false)).toMatchObject({
      error: null,
      address: '192.168.1.10',
    });
    expect((await run(createGuardedLookup(false, resolvesTo('192.168.1.10')), false)).error?.code).toBe('EACCES');
  });

  it('passes a resolver error through', async () => {
    expect((await run(createGuardedLookup(true, failingResolver), true)).error?.message).toBe('ENOTFOUND');
  });
});

describe('isVendorWebhookUrl', () => {
  it.each([
    ['https://contoso.webhook.office.com/webhookb2/abc', 'teams', true],
    ['https://prod-12.westus.logic.azure.com:443/workflows/abc', 'teams', true],
    ['https://PROD-12.WESTUS.LOGIC.AZURE.COM/workflows/abc', 'teams', true],
    ['https://attacker.example/x.webhook.office.com/', 'teams', false],
    ['https://10.0.0.5/a.logic.azure.com/', 'teams', false],
    ['http://contoso.webhook.office.com/', 'teams', false],
    ['https://contoso.webhook.office.com:8443/', 'teams', false],
    ['https://webhook.office.com/', 'teams', false],
    ['https://evilwebhook.office.com/', 'teams', false],
    ['https://contoso.webhook.office.com.attacker.example/', 'teams', false],
    ['https://contoso.webhook.office.com./', 'teams', false],
    ['https://user@contoso.webhook.office.com/', 'teams', false],
    ['https://attacker.example#.webhook.office.com/', 'teams', false],
    ['not a url', 'teams', false],
    ['https://hooks.slack.com/services/T0/B0/x', 'slack', true],
    ['https://hooks.slack.com/triggers/x', 'slack', false],
    ['https://hooks.slack.com/services/../x', 'slack', false],
    ['https://hooks.slack.com.attacker.example/services/x', 'slack', false],
    ['https://hooks.slack.com:444/services/x', 'slack', false],
    ['https://discord.com/api/webhooks/1/x', 'discord', true],
    ['https://discord.com/api/other', 'discord', false],
    ['https://evil.discord.com/api/webhooks/1/x', 'discord', false],
    ['https://discord.com@attacker.example/api/webhooks/1/x', 'discord', false],
  ] as const)('%s as %s → %s', (url, vendor, expected) => {
    expect(isVendorWebhookUrl(url, vendor)).toBe(expected);
  });
});
