import { describe, it, expect } from 'vitest';
import { holdForRedirect } from './holdForRedirect';

describe('holdForRedirect', () => {
  it('passes a real result through, including null', async () => {
    await expect(holdForRedirect(Promise.resolve({ available: true }))).resolves.toEqual({ available: true });
    await expect(holdForRedirect(Promise.resolve(null))).resolves.toBeNull();
  });

  it('stays pending when a redirect resolves the action with undefined', async () => {
    const settled = await Promise.race([
      holdForRedirect(Promise.resolve(undefined)).then(() => 'settled'),
      new Promise((resolve) => setTimeout(() => resolve('pending'), 20)),
    ]);

    expect(settled).toBe('pending');
  });

  it('passes a failure through', async () => {
    await expect(holdForRedirect(Promise.reject(new Error('failed')))).rejects.toThrow('failed');
  });
});
