import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { parseEnv } from '@/lib/env/parse-env';

const schema = z.object({
  AUTH_SECRET: z.string().min(1),
  PUBLIC_BASE_URL: z.string().url(),
  IS_CLOUD: z
    .enum(['true', 'false'])
    .optional()
    .default('false')
    .transform((val) => val === 'true'),
});

describe('parseEnv', () => {
  it('returns parsed values with defaults applied', () => {
    const parsed = parseEnv('test', schema, { AUTH_SECRET: 'secret', PUBLIC_BASE_URL: 'https://example.io' });
    expect(parsed).toEqual({ AUTH_SECRET: 'secret', PUBLIC_BASE_URL: 'https://example.io', IS_CLOUD: false });
  });

  it('names every failing variable in the error message', () => {
    expect(() => parseEnv('test', schema, { PUBLIC_BASE_URL: 'not-a-url' })).toThrowError(
      /AUTH_SECRET: Required[\s\S]*PUBLIC_BASE_URL: Invalid url/,
    );
  });

  it('throws a plain Error with a writable message, so Next error wrapping cannot mask it', () => {
    let caught: unknown;
    try {
      parseEnv('test', schema, {});
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(Error);
    expect(caught).not.toBeInstanceOf(z.ZodError);
    expect(() => {
      (caught as Error).message = `wrapped: ${(caught as Error).message}`;
    }).not.toThrow();
  });
});
