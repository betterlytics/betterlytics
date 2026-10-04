import { describe, expect, it } from 'vitest';
import { classifyAddress, isWebhookUrlAllowed } from './outbound-target';

describe('classifyAddress', () => {
  it.each(['1.1.1.1', '2606:4700::1111', '::ffff:1.1.1.1'])('%s is public', (address) => {
    expect(classifyAddress(address)).toBe('public');
  });

  it.each([
    '127.0.0.1',
    '10.1.2.3',
    '172.16.0.1',
    '172.31.255.255',
    '192.168.1.10',
    '100.64.0.1',
    '100.127.255.254',
    '::1',
    'fd12:3456::1',
    '::ffff:127.0.0.1',
  ])('%s is private', (address) => {
    expect(classifyAddress(address)).toBe('private');
  });

  it.each([
    '169.254.169.254',
    '::ffff:169.254.169.254',
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
  ])('%s is always blocked', (address) => {
    expect(classifyAddress(address)).toBe('blocked');
  });
});

describe('isWebhookUrlAllowed', () => {
  const resolvesTo =
    (...addresses: string[]) =>
    async () =>
      addresses;

  it.each([
    ['https://hooks.example', ['93.184.216.34'], false, true, 'public https'],
    ['https://hooks.example', ['93.184.216.34'], true, true, 'public https with allowance'],
    ['http://hooks.example', ['93.184.216.34'], false, false, 'http without allowance'],
    ['http://hooks.example', ['93.184.216.34'], true, true, 'http with allowance'],
    ['https://hooks.example', ['93.184.216.34', '10.0.0.1'], false, false, 'mixed public/private answer'],
    ['https://10.0.0.1/', [], false, false, 'private literal without allowance'],
    ['https://10.0.0.1/', [], true, true, 'private literal with allowance'],
    ['https://169.254.169.254/', [], false, false, 'metadata literal'],
    ['https://169.254.169.254/', [], true, false, 'metadata literal with allowance'],
    ['https://[::1]/', [], false, false, 'ipv6 loopback without allowance'],
    ['https://[::1]/', [], true, true, 'ipv6 loopback with allowance'],
    ['http://2130706433/', [], true, true, 'decimal ip normalised to 127.0.0.1'],
    ['not a url', [], true, false, 'unparseable'],
    ['ftp://x', ['93.184.216.34'], true, false, 'unsupported scheme'],
  ])('%s resolving to %j, allowPrivateTargets=%s → %s (%s)', async (url, addresses, allowPrivateTargets, expected) => {
    expect(await isWebhookUrlAllowed(url, allowPrivateTargets, resolvesTo(...addresses))).toBe(expected);
  });

  it('rejects when resolution fails', async () => {
    const failing = async () => {
      throw new Error('ENOTFOUND');
    };
    expect(await isWebhookUrlAllowed('https://hooks.example', true, failing)).toBe(false);
  });
});
