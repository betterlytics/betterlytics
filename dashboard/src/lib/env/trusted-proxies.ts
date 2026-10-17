import { z } from 'zod';

const ipOrCidr = z.union([z.string().ip(), z.string().cidr()]);

// better-auth drops zone ids and reads an IPv4-mapped range as IPv4, so accepting either would trust something else than written
const isReadAsWritten = (entry: string) =>
  !entry.includes('%') && !(entry.includes('/') && /^[0:]*:ffff:/i.test(entry));

export const zTrustedProxies = z
  .string()
  .optional()
  .default('')
  .transform((val, ctx) => {
    const entries = val.split(/[\s,]+/).filter(Boolean);
    const invalid = entries.filter((entry) => !ipOrCidr.safeParse(entry).success || !isReadAsWritten(entry));
    if (invalid.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `invalid entries: ${invalid.join(', ')}. Each entry must be an IP address or CIDR range`,
      });
      return z.NEVER;
    }
    return entries;
  });
