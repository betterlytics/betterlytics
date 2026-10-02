import 'server-only';
import { BlockList, isIP } from 'node:net';
import { lookup } from 'node:dns/promises';

// Mirrors classify_ip in backend/src/monitor/guard.rs; keep the two range lists in sync.

type AddressClass = 'public' | 'private' | 'blocked';
type Subnet = [network: string, prefix: number, family: 'ipv4' | 'ipv6'];

function buildList(subnets: Subnet[]): BlockList {
  const list = new BlockList();
  for (const [network, prefix, family] of subnets) list.addSubnet(network, prefix, family);
  return list;
}

// BlockList matches ::ffff:a.b.c.d against IPv4 rules, so mapped addresses need no special case.
const ALWAYS_BLOCKED = buildList([
  ['0.0.0.0', 8, 'ipv4'],
  ['169.254.0.0', 16, 'ipv4'],
  ['100.100.100.200', 32, 'ipv4'],
  ['192.0.2.0', 24, 'ipv4'],
  ['198.51.100.0', 24, 'ipv4'],
  ['203.0.113.0', 24, 'ipv4'],
  ['224.0.0.0', 3, 'ipv4'],
  ['::', 128, 'ipv6'],
  ['fe80::', 10, 'ipv6'],
  ['ff00::', 8, 'ipv6'],
  ['fd00:ec2::254', 128, 'ipv6'],
]);

const PRIVATE = buildList([
  ['127.0.0.0', 8, 'ipv4'],
  ['10.0.0.0', 8, 'ipv4'],
  ['172.16.0.0', 12, 'ipv4'],
  ['192.168.0.0', 16, 'ipv4'],
  ['100.64.0.0', 10, 'ipv4'],
  ['::1', 128, 'ipv6'],
  ['fc00::', 7, 'ipv6'],
]);

export function classifyAddress(address: string): AddressClass {
  const family = isIP(address) === 6 ? 'ipv6' : 'ipv4';
  if (ALWAYS_BLOCKED.check(address, family)) return 'blocked';
  if (PRIVATE.check(address, family)) return 'private';
  return 'public';
}

export function isAddressAllowed(address: string, allowPrivateTargets: boolean): boolean {
  const addressClass = classifyAddress(address);
  return addressClass === 'public' || (addressClass === 'private' && allowPrivateTargets);
}

type Resolver = (hostname: string) => Promise<string[]>;

const resolveAll: Resolver = async (hostname) =>
  (await lookup(hostname, { all: true })).map((entry) => entry.address);

export async function isWebhookUrlAllowed(
  rawUrl: string,
  allowPrivateTargets: boolean,
  resolve: Resolver = resolveAll,
): Promise<boolean> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return false;
  }
  const schemeAllowed = url.protocol === 'https:' || (allowPrivateTargets && url.protocol === 'http:');
  if (!schemeAllowed) return false;

  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  if (!hostname) return false;

  try {
    const addresses = isIP(hostname) ? [hostname] : await resolve(hostname);
    // every(): a mixed public/private answer must not let the confirmation fetch pick the private one
    return addresses.length > 0 && addresses.every((address) => isAddressAllowed(address, allowPrivateTargets));
  } catch {
    return false;
  }
}
