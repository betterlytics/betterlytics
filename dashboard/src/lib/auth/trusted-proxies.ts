import { z } from 'zod';

const ipOrCidr = z.union([z.string().ip(), z.string().cidr()]);

export function parseTrustedProxies(raw: string): { valid: string[]; invalid: string[] } {
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const entry of raw.split(/[\s,]+/).filter(Boolean)) {
    (ipOrCidr.safeParse(entry).success ? valid : invalid).push(entry);
  }
  return { valid, invalid };
}
